import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { runFullSiteAudit } from './server/geminiAudit.ts';
import type { AuditProgressEvent, AuditRequest } from './src/types/audit.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;

function isValidPublicHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return false;
    const host = parsed.hostname.toLowerCase();
    if (!host.includes('.') || host.startsWith('.') || host.endsWith('.')) return false;
    if (
      /^(localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\]|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+)$/i.test(
        host,
      )
    ) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

function normalizeUrlInput(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return '';
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

function formatGeminiErrorMessage(err: unknown): string {
  const message = err instanceof Error ? err.message : String(err);
  if (message.includes('PERMISSION_DENIED') || message.includes('API_KEY_INVALID')) {
    return 'API key verification failed. Please check your GEMINI_API_KEY in Settings > Secrets.';
  }
  if (message.includes('RESOURCE_EXHAUSTED') || message.includes('429')) {
    return 'Rate limit or quota reached for the Gemini API. Please wait a moment and try again.';
  }
  if (message.includes('NOT_FOUND') || message.includes('404')) {
    return 'The configured Gemini model could not be reached. Please try again.';
  }
  return message || 'An unexpected error occurred while running the audit.';
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
  });

  app.post('/api/audit/stream', async (req, res) => {
    const body = (req.body ?? {}) as Partial<AuditRequest>;
    const normalizedTarget = normalizeUrlInput(String(body.url ?? ''));

    if (!isValidPublicHttpUrl(normalizedTarget)) {
      res.status(400).json({
        error: 'Please provide a valid public website URL (e.g. https://example.com).',
      });
      return;
    }

    const sanitizedCompetitors = Array.isArray(body.competitorUrls)
      ? body.competitorUrls
          .map((u) => normalizeUrlInput(String(u ?? '')))
          .filter((u) => isValidPublicHttpUrl(u))
          .slice(0, 3)
      : [];

    const auditRequest: AuditRequest = {
      url: normalizedTarget,
      targetCountry: typeof body.targetCountry === 'string' ? body.targetCountry.trim() : '',
      primaryLanguage:
        typeof body.primaryLanguage === 'string' ? body.primaryLanguage.trim() : '',
      businessType: body.businessType || '',
      competitorUrls: sanitizedCompetitors,
    };

    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    let closed = false;
    req.on('close', () => {
      closed = true;
    });

    const sendEvent = (event: AuditProgressEvent) => {
      if (closed) return;
      res.write(`data: ${JSON.stringify(event)}\n\n`);
    };

    try {
      const report = await runFullSiteAudit(auditRequest, sendEvent);
      sendEvent({ type: 'complete', report });
      if (!closed) {
        res.end();
      }
    } catch (err) {
      console.error('Audit stream error:', err);
      sendEvent({
        type: 'error',
        error: formatGeminiErrorMessage(err),
      });
      if (!closed) {
        res.end();
      }
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`SEOsolve server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
