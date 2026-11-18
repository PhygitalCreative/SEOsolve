export interface UrlValidationResult {
  valid: boolean;
  normalizedUrl: string;
  error?: string;
}

const PRIVATE_HOST_REGEX =
  /^(localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\]|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+)$/i;

export function normalizeAndValidateUrl(rawInput: string): UrlValidationResult {
  const trimmed = rawInput.trim();
  if (!trimmed) {
    return {
      valid: false,
      normalizedUrl: '',
      error: 'Please enter a website URL to audit.',
    };
  }

  if (/\s/.test(trimmed)) {
    return {
      valid: false,
      normalizedUrl: '',
      error: 'URLs cannot contain spaces.',
    };
  }

  const withProtocol = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;

  try {
    const parsed = new URL(withProtocol);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return {
        valid: false,
        normalizedUrl: '',
        error: 'Only http:// and https:// URLs are supported.',
      };
    }

    const hostname = parsed.hostname.toLowerCase();
    if (!hostname || !hostname.includes('.') || hostname.startsWith('.') || hostname.endsWith('.')) {
      return {
        valid: false,
        normalizedUrl: '',
        error: 'Enter a valid public domain (for example, example.com).',
      };
    }

    const tld = hostname.split('.').pop() ?? '';
    if (tld.length < 2 || !/^[a-z0-9-]+$/i.test(tld)) {
      return {
        valid: false,
        normalizedUrl: '',
        error: 'Enter a valid domain extension (for example, .com, .io, .org).',
      };
    }

    if (PRIVATE_HOST_REGEX.test(hostname)) {
      return {
        valid: false,
        normalizedUrl: '',
        error: 'Local or private network addresses cannot be audited.',
      };
    }

    return {
      valid: true,
      normalizedUrl: parsed.toString(),
    };
  } catch {
    return {
      valid: false,
      normalizedUrl: '',
      error: 'Invalid URL format. Example: https://example.com',
    };
  }
}

export function formatDomainDisplay(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./, '') + (parsed.pathname !== '/' ? parsed.pathname : '');
  } catch {
    return url;
  }
}
