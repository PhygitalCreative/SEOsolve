import { GoogleGenAI, Type, ThinkingLevel } from '@google/genai';
import type {
  AuditProgressEvent,
  AuditReport,
  AuditRequest,
  ContentModule,
  GeoModule,
  GroundingSource,
  KeywordModule,
  SeoAuditModule,
  TechnicalChecklistModule,
  TopPriorityAction,
} from '../src/types/audit.ts';

const MODEL_NAME = 'gemini-4-hydrogen';

function getAiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      'GEMINI_API_KEY is not configured. Please check your Settings > Secrets panel.',
    );
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function clampScore(value: unknown, fallback = 50): number {
  const num = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(num)) return fallback;
  return Math.max(0, Math.min(100, Math.round(num)));
}

function parseJsonSafely<T>(rawText: string | undefined, label: string): T {
  const cleaned = (rawText ?? '')
    .trim()
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```$/i, '')
    .trim();
  if (!cleaned) {
    throw new Error(`Empty structured output received for ${label}.`);
  }
  try {
    return JSON.parse(cleaned) as T;
  } catch (err) {
    throw new Error(
      `Failed to parse structured JSON for ${label}: ${err instanceof Error ? err.message : 'Unknown error'}`,
    );
  }
}

const findingSchema = {
  type: Type.OBJECT,
  properties: {
    id: { type: Type.STRING },
    title: { type: Type.STRING },
    status: { type: Type.STRING, enum: ['pass', 'warning', 'fail'] },
    priority: { type: Type.STRING, enum: ['high', 'medium', 'low'] },
    impact: { type: Type.STRING },
    fix: { type: Type.STRING },
  },
  required: ['id', 'title', 'status', 'priority', 'impact', 'fix'],
};

const seoAndTechnicalSchema = {
  type: Type.OBJECT,
  properties: {
    seoAudit: {
      type: Type.OBJECT,
      properties: {
        score: { type: Type.INTEGER },
        summary: { type: Type.STRING },
        pageSnapshot: {
          type: Type.OBJECT,
          properties: {
            detectedTitle: { type: Type.STRING },
            titleLength: { type: Type.INTEGER },
            detectedMetaDescription: { type: Type.STRING },
            metaDescriptionLength: { type: Type.INTEGER },
            detectedH1: { type: Type.STRING },
            wordCountEstimate: { type: Type.STRING },
            canonicalUrl: { type: Type.STRING },
            hasOpenGraph: { type: Type.BOOLEAN },
            hasTwitterCards: { type: Type.BOOLEAN },
            eeatSignals: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: [
            'detectedTitle',
            'titleLength',
            'detectedMetaDescription',
            'metaDescriptionLength',
            'detectedH1',
            'wordCountEstimate',
            'canonicalUrl',
            'hasOpenGraph',
            'hasTwitterCards',
            'eeatSignals',
          ],
        },
        findings: { type: Type.ARRAY, items: findingSchema },
      },
      required: ['score', 'summary', 'pageSnapshot', 'findings'],
    },
    technicalChecklist: {
      type: Type.OBJECT,
      properties: {
        score: { type: Type.INTEGER },
        summary: { type: Type.STRING },
        findings: { type: Type.ARRAY, items: findingSchema },
        schemaTypesPresent: { type: Type.ARRAY, items: { type: Type.STRING } },
        schemaTypesMissing: { type: Type.ARRAY, items: { type: Type.STRING } },
        items: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              group: {
                type: Type.STRING,
                enum: [
                  'Crawlability and Indexing',
                  'Performance',
                  'Mobile and UX',
                  'Security',
                  'Structured Data',
                  'International',
                ],
              },
              title: { type: Type.STRING },
              status: {
                type: Type.STRING,
                enum: ['pass', 'warning', 'fail', 'could_not_verify'],
              },
              priority: { type: Type.STRING, enum: ['high', 'medium', 'low'] },
              details: { type: Type.STRING },
              fix: { type: Type.STRING },
            },
            required: ['id', 'group', 'title', 'status', 'priority', 'details', 'fix'],
          },
        },
      },
      required: [
        'score',
        'summary',
        'findings',
        'schemaTypesPresent',
        'schemaTypesMissing',
        'items',
      ],
    },
  },
  required: ['seoAudit', 'technicalChecklist'],
};

const contentKeywordsGeoSchema = {
  type: Type.OBJECT,
  properties: {
    executiveSummary: { type: Type.STRING },
    topPriorities: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          module: { type: Type.STRING },
          priority: { type: Type.STRING, enum: ['high', 'medium', 'low'] },
          expectedImpact: { type: Type.STRING },
          action: { type: Type.STRING },
        },
        required: ['title', 'module', 'priority', 'expectedImpact', 'action'],
      },
    },
    contentRecommendations: {
      type: Type.OBJECT,
      properties: {
        score: { type: Type.INTEGER },
        summary: { type: Type.STRING },
        findings: { type: Type.ARRAY, items: findingSchema },
        competitorGaps: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              topic: { type: Type.STRING },
              competitorAdvantage: { type: Type.STRING },
              opportunity: { type: Type.STRING },
            },
            required: ['topic', 'competitorAdvantage', 'opportunity'],
          },
        },
        suggestedTopics: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              searchIntent: {
                type: Type.STRING,
                enum: ['informational', 'commercial', 'transactional', 'navigational'],
              },
              targetKeyword: { type: Type.STRING },
              suggestedOutline: { type: Type.ARRAY, items: { type: Type.STRING } },
              format: { type: Type.STRING },
            },
            required: [
              'title',
              'searchIntent',
              'targetKeyword',
              'suggestedOutline',
              'format',
            ],
          },
        },
        topicClusters: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              pillarTitle: { type: Type.STRING },
              targetAudience: { type: Type.STRING },
              clusterTopics: { type: Type.ARRAY, items: { type: Type.STRING } },
            },
            required: ['pillarTitle', 'targetAudience', 'clusterTopics'],
          },
        },
        refreshOpportunities: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              pageOrSection: { type: Type.STRING },
              reason: { type: Type.STRING },
              recommendedUpdate: { type: Type.STRING },
            },
            required: ['pageOrSection', 'reason', 'recommendedUpdate'],
          },
        },
        internalLinkingSuggestions: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              sourceContext: { type: Type.STRING },
              anchorText: { type: Type.STRING },
              targetPage: { type: Type.STRING },
              rationale: { type: Type.STRING },
            },
            required: ['sourceContext', 'anchorText', 'targetPage', 'rationale'],
          },
        },
      },
      required: [
        'score',
        'summary',
        'findings',
        'competitorGaps',
        'suggestedTopics',
        'topicClusters',
        'refreshOpportunities',
        'internalLinkingSuggestions',
      ],
    },
    keywordSuggestions: {
      type: Type.OBJECT,
      properties: {
        score: { type: Type.INTEGER },
        summary: { type: Type.STRING },
        findings: { type: Type.ARRAY, items: findingSchema },
        keywordStrategy: { type: Type.STRING },
        keywords: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              keyword: { type: Type.STRING },
              group: {
                type: Type.STRING,
                enum: ['primary', 'secondary', 'long-tail', 'question-based'],
              },
              searchIntent: {
                type: Type.STRING,
                enum: ['informational', 'commercial', 'transactional', 'navigational'],
              },
              estimatedDifficulty: {
                type: Type.STRING,
                enum: ['Low', 'Medium', 'High'],
              },
              estimatedVolumeBand: { type: Type.STRING },
              estimatedRelevance: { type: Type.INTEGER },
              contentTypeToTarget: { type: Type.STRING },
              quickWin: { type: Type.BOOLEAN },
            },
            required: [
              'keyword',
              'group',
              'searchIntent',
              'estimatedDifficulty',
              'estimatedVolumeBand',
              'estimatedRelevance',
              'contentTypeToTarget',
              'quickWin',
            ],
          },
        },
      },
      required: ['score', 'summary', 'findings', 'keywordStrategy', 'keywords'],
    },
    aiSearchGeo: {
      type: Type.OBJECT,
      properties: {
        score: { type: Type.INTEGER },
        summary: { type: Type.STRING },
        findings: { type: Type.ARRAY, items: findingSchema },
        readinessDimensions: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              dimension: { type: Type.STRING },
              score: { type: Type.INTEGER },
              note: { type: Type.STRING },
            },
            required: ['dimension', 'score', 'note'],
          },
        },
        llmsTxtRecommendation: {
          type: Type.OBJECT,
          properties: {
            status: { type: Type.STRING },
            recommendation: { type: Type.STRING },
          },
          required: ['status', 'recommendation'],
        },
        aiVisibilityGaps: { type: Type.ARRAY, items: { type: Type.STRING } },
        quotableSnippets: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              targetTopic: { type: Type.STRING },
              placement: { type: Type.STRING },
              suggestedCopy: { type: Type.STRING },
              whyItWorks: { type: Type.STRING },
            },
            required: ['targetTopic', 'placement', 'suggestedCopy', 'whyItWorks'],
          },
        },
      },
      required: [
        'score',
        'summary',
        'findings',
        'readinessDimensions',
        'llmsTxtRecommendation',
        'aiVisibilityGaps',
        'quotableSnippets',
      ],
    },
  },
  required: [
    'executiveSummary',
    'topPriorities',
    'contentRecommendations',
    'keywordSuggestions',
    'aiSearchGeo',
  ],
};

function extractGroundingSources(response: any): GroundingSource[] {
  const seen = new Set<string>();
  const sources: GroundingSource[] = [];

  const urlMeta = response?.candidates?.[0]?.urlContextMetadata?.urlMetadata;
  if (Array.isArray(urlMeta)) {
    for (const item of urlMeta) {
      const url = item?.retrievedUrl;
      if (typeof url === 'string' && url && !seen.has(url)) {
        seen.add(url);
        sources.push({
          title: url,
          url,
          sourceType: 'url_context',
        });
      }
    }
  }

  const chunks = response?.candidates?.[0]?.groundingMetadata?.groundingChunks;
  if (Array.isArray(chunks)) {
    for (const chunk of chunks) {
      const web = chunk?.web;
      if (web?.uri && !seen.has(web.uri)) {
        seen.add(web.uri);
        sources.push({
          title: web.title || web.uri,
          url: web.uri,
          sourceType: 'google_search',
        });
      }
    }
  }

  return sources.slice(0, 20);
}

export async function runFullSiteAudit(
  request: AuditRequest,
  onProgress: (event: AuditProgressEvent) => void,
): Promise<AuditReport> {
  const ai = getAiClient();
  const targetUrl = request.url;
  const competitors = (request.competitorUrls ?? []).filter(Boolean).slice(0, 3);
  const businessLabel = request.businessType || 'general website';
  const countryLabel = request.targetCountry || 'Global';
  const langLabel = request.primaryLanguage || 'English';

  onProgress({
    type: 'progress',
    step: 'reading_page',
    label: 'Reading page',
  });

  // Step 1: Grounded live site & competitor intelligence using URL Context + Google Search
  const competitorPromptPart =
    competitors.length > 0
      ? `Also read and inspect these competitor URLs: ${competitors.join(', ')}.`
      : `Use Google Search to identify 2-3 top organic search competitors in the same niche and region (${countryLabel}).`;

  const researchPrompt = `You are a senior technical SEO, content strategist, and AI-search (GEO) auditor.
Inspect the live website at ${targetUrl}.
Context:
- Target country/market: ${countryLabel}
- Primary language: ${langLabel}
- Business type: ${businessLabel}
${competitorPromptPart}

Use the URL Context tool to read ${targetUrl}${competitors.length > 0 ? ` and ${competitors.join(', ')}` : ''}, and use Google Search to check indexation, brand presence, third-party citations, robots.txt/sitemap references, and search competition.

Produce a comprehensive, factual diagnostic dossier covering:
1. Exact On-Page Elements observed on ${targetUrl}: exact <title> and character count, meta description and character count, H1 text, H2-H6 heading structure, URL structure, internal links, image alt-text quality, content depth & approximate word count, keyword usage, canonical URL, Open Graph & Twitter card tags, and E-E-A-T signals (author attribution, about/contact/policy pages, external citations, proof).
2. Technical & Schema Signals observed or inferable (and explicitly note what could not be directly verified from HTML/HTTP alone, such as server headers or private analytics): HTTPS status, viewport tag, mobile ergonomics, Core Web Vitals risks (large hero images, render-blocking scripts, layout shift risks), robots.txt/sitemap clues, hreflang/lang attributes, and Schema.org types present vs missing (Organization, Article, Product, FAQPage, BreadcrumbList, LocalBusiness, WebSite).
3. Competitor Comparison & Content/Keyword Landscape: what competitors cover well, topic gaps, high-opportunity keywords (primary, secondary, long-tail, question-based) relevant to ${countryLabel} in ${langLabel}.
4. AI-Search (GEO) Readiness: entity clarity, direct answer/Q&A formatting, statistical & citation density, machine readability / llms.txt readiness, and third-party brand mentions in search results.

Be strictly factual about what was observed on the live page vs what could not be verified.`;

  const researchResponse = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: researchPrompt,
    config: {
      tools: [{ urlContext: {} }, { googleSearch: {} }],
      thinkingConfig: { thinkingLevel: ThinkingLevel.MEDIUM },
    },
  });

  const dossierText = researchResponse.text ?? '';
  if (!dossierText.trim()) {
    throw new Error(
      'Unable to extract live page intelligence from the target URL. Please verify the URL is publicly reachable and try again.',
    );
  }

  const groundingSources = extractGroundingSources(researchResponse);
  // Ensure the primary audited URL is listed if urlContext read it or even if metadata omitted it
  if (!groundingSources.some((s) => s.url === targetUrl)) {
    groundingSources.unshift({
      title: targetUrl,
      url: targetUrl,
      sourceType: 'url_context',
    });
  }

  onProgress({
    type: 'progress',
    step: 'on_page_seo',
    label: 'Analyzing on-page SEO',
  });

  const sharedContext = `Target URL: ${targetUrl}
Target Country: ${countryLabel}
Primary Language: ${langLabel}
Business Type: ${businessLabel}
Competitors: ${competitors.length > 0 ? competitors.join(', ') : 'Identified via Google Search'}

LIVE SITE & SEARCH RESEARCH DOSSIER:
${dossierText}`;

  // Step 2 & 3 in parallel:
  // A) On-Page SEO + Technical Checklist (>=25 items)
  // B) Content Recommendations (10 topics) + Keyword Suggestions (25-40) + AI-Search GEO
  const seoTechPromise = ai.models
    .generateContent({
      model: MODEL_NAME,
      contents: `${sharedContext}

Generate the On-Page SEO Audit and Technical SEO Checklist JSON for ${targetUrl}.
Requirements:
1. seoAudit:
   - Score 0-100 and concise summary.
   - pageSnapshot with exact detected values (or "Not detected" if missing).
   - 10 to 13 findings covering: Title tag (length, keyword use, uniqueness), Meta description, H1 to H6 hierarchy, URL structure, Internal linking, Image alt text, Content depth, Keyword usage, Canonical tags, Open Graph / Twitter cards, and E-E-A-T signals (author info, about page, trust signals, citations).
   - Each finding must have unique id (e.g. "seo-1"), title, status (pass/warning/fail), priority (high/medium/low), impact, and a concrete actionable fix.
2. technicalChecklist:
   - Score 0-100 and concise summary.
   - 6 to 8 high-level prioritized findings.
   - schemaTypesPresent and schemaTypesMissing arrays (evaluating Organization, Article, Product, FAQPage, BreadcrumbList, LocalBusiness, etc.).
   - items: MUST contain AT LEAST 27 checklist items distributed across ALL 6 groups:
     * "Crawlability and Indexing" (robots.txt, XML sitemap, noindex tags, canonicals, redirect chains, 404s) - at least 5 items
     * "Performance" (LCP likelihood, INP likelihood, CLS likelihood, image optimization, browser caching, render-blocking resources) - at least 6 items
     * "Mobile and UX" (viewport meta, responsive layout, tap targets, legible font sizing) - at least 4 items
     * "Security" (HTTPS enforcement, mixed content, security headers like HSTS/CSP/X-Frame-Options) - at least 4 items
     * "Structured Data" (Organization/LocalBusiness, Article/Product, FAQPage, BreadcrumbList, valid JSON-LD syntax) - at least 4 items
     * "International" (html lang attribute, hreflang implementation, regional URL/currency/locale consistency) - at least 4 items
   - For items that cannot be deterministically verified from public page text/search (like exact server HTTP headers or private redirect chains), set status to "could_not_verify" and explain how the site owner should check it in "fix".`,
      config: {
        systemInstruction:
          'You are SEOsolve, a rigorous technical SEO auditor. Return strictly valid JSON matching the schema. Never invent false passes when something could not be verified—use "could_not_verify".',
        responseMimeType: 'application/json',
        responseSchema: seoAndTechnicalSchema,
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
      },
    })
    .then((res) => {
      onProgress({
        type: 'progress',
        step: 'technical_signals',
        label: 'Checking technical signals',
      });
      return parseJsonSafely<{
        seoAudit: SeoAuditModule;
        technicalChecklist: TechnicalChecklistModule;
      }>(res.text, 'SEO & Technical Checklist');
    });

  const contentKeywordsGeoPromise = ai.models
    .generateContent({
      model: MODEL_NAME,
      contents: `${sharedContext}

Generate the Content Recommendations, Keyword Suggestions, AI-Search (GEO) Optimization, and Executive Priorities JSON for ${targetUrl}.
Requirements:
1. contentRecommendations:
   - Score 0-100, concise summary, 5 to 7 prioritized findings.
   - competitorGaps: 4 to 6 concrete content gaps versus competitors.
   - suggestedTopics: EXACTLY 10 suggested blog or landing page topics tailored to ${targetUrl}, each with title, searchIntent, targetKeyword, suggestedOutline (4 to 5 H2 headings), and format (e.g., "Comparison Guide", "Pillar Guide", "Case Study", "Landing Page", "Checklist").
   - topicClusters: 3 to 4 topic cluster / pillar page architectures.
   - refreshOpportunities: 3 to 5 existing page/section refresh recommendations.
   - internalLinkingSuggestions: 4 to 6 specific internal link opportunities.
2. keywordSuggestions:
   - Score 0-100, concise summary, 4 to 6 findings.
   - keywordStrategy: a clear, actionable 3-4 sentence strategy paragraph tailored to ${targetUrl} (${countryLabel}, ${langLabel}).
   - keywords: MUST contain 28 to 34 keywords balanced across all 4 groups ("primary", "secondary", "long-tail", "question-based").
   - For each keyword include: keyword, group, searchIntent, estimatedDifficulty ("Low"|"Medium"|"High"), estimatedVolumeBand (e.g. "High (10K+)", "Medium (1K-10K)", "Low (100-1K)", "Niche (<100)"), estimatedRelevance (integer 1 to 10), contentTypeToTarget, and quickWin (boolean). Note these are AI estimates.
3. aiSearchGeo (Generative Engine Optimization):
   - Score 0-100, concise summary, 6 to 8 prioritized GEO findings.
   - readinessDimensions: 5 dimensions ("Entity Clarity", "Direct Answer Formatting", "Citation & Fact Density", "Machine Readability & Schema", "Off-Page Consensus"), each with score 0-100 and a concise note.
   - llmsTxtRecommendation: status and specific recommendation for /llms.txt and AI crawler directives.
   - aiVisibilityGaps: 4 to 5 concrete gaps in how AI answer engines (Google AI Overviews, Perplexity, ChatGPT) synthesize this brand/topic.
   - quotableSnippets: 3 to 4 ready-to-paste direct-answer copy blocks / definition / comparison snippets tailored to ${targetUrl} that increase LLM citation likelihood.
4. executiveSummary: 2-3 crisp sentences summarizing the site's biggest strengths and most urgent bottlenecks.
5. topPriorities: 5 highest-leverage actions across all modules.`,
      config: {
        systemInstruction:
          'You are SEOsolve, a senior content strategist, keyword researcher, and GEO (Generative Engine Optimization) specialist. Return strictly valid JSON matching the schema.',
        responseMimeType: 'application/json',
        responseSchema: contentKeywordsGeoSchema,
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
      },
    })
    .then((res) => {
      onProgress({
        type: 'progress',
        step: 'researching_keywords',
        label: 'Researching keywords',
      });
      return parseJsonSafely<{
        executiveSummary: string;
        topPriorities: TopPriorityAction[];
        contentRecommendations: ContentModule;
        keywordSuggestions: KeywordModule;
        aiSearchGeo: GeoModule;
      }>(res.text, 'Content, Keywords & GEO');
    });

  const [seoTech, contentGeo] = await Promise.all([
    seoTechPromise,
    contentKeywordsGeoPromise,
  ]);

  onProgress({
    type: 'progress',
    step: 'ai_search_readiness',
    label: 'Evaluating AI-search readiness',
  });

  // Slight beat for final assembly progress clarity
  onProgress({
    type: 'progress',
    step: 'building_report',
    label: 'Building report',
  });

  const seoScore = clampScore(seoTech.seoAudit.score);
  const techScore = clampScore(seoTech.technicalChecklist.score);
  const contentScore = clampScore(contentGeo.contentRecommendations.score);
  const keywordScore = clampScore(contentGeo.keywordSuggestions.score);
  const geoScore = clampScore(contentGeo.aiSearchGeo.score);

  const overallScore = Math.round(
    seoScore * 0.25 +
      techScore * 0.25 +
      contentScore * 0.2 +
      keywordScore * 0.15 +
      geoScore * 0.15,
  );

  // Normalize keyword relevance bounds 1..10
  const normalizedKeywords = (contentGeo.keywordSuggestions.keywords ?? []).map((kw) => ({
    ...kw,
    estimatedRelevance: Math.max(1, Math.min(10, Math.round(kw.estimatedRelevance || 5))),
  }));

  const report: AuditReport = {
    id: `audit_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
    input: {
      url: targetUrl,
      targetCountry: countryLabel,
      primaryLanguage: langLabel,
      businessType: request.businessType || '',
      competitorUrls: competitors,
    },
    overallScore,
    executiveSummary: contentGeo.executiveSummary,
    topPriorities: (contentGeo.topPriorities ?? []).slice(0, 6),
    groundingSources,
    seoAudit: {
      ...seoTech.seoAudit,
      score: seoScore,
    },
    technicalChecklist: {
      ...seoTech.technicalChecklist,
      score: techScore,
    },
    contentRecommendations: {
      ...contentGeo.contentRecommendations,
      score: contentScore,
    },
    keywordSuggestions: {
      ...contentGeo.keywordSuggestions,
      score: keywordScore,
      keywords: normalizedKeywords,
    },
    aiSearchGeo: {
      ...contentGeo.aiSearchGeo,
      score: geoScore,
    },
  };

  return report;
}
