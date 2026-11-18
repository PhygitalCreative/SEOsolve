export type BusinessType =
  | 'saas'
  | 'ecommerce'
  | 'local_business'
  | 'blog_publisher'
  | 'portfolio';

export type FindingStatus = 'pass' | 'warning' | 'fail';
export type ChecklistStatus = 'pass' | 'warning' | 'fail' | 'could_not_verify';
export type PriorityLevel = 'high' | 'medium' | 'low';
export type SearchIntent =
  | 'informational'
  | 'commercial'
  | 'transactional'
  | 'navigational';

export type KeywordGroup =
  | 'primary'
  | 'secondary'
  | 'long-tail'
  | 'question-based';

export type TechnicalGroup =
  | 'Crawlability and Indexing'
  | 'Performance'
  | 'Mobile and UX'
  | 'Security'
  | 'Structured Data'
  | 'International';

export interface AuditRequest {
  url: string;
  targetCountry?: string;
  primaryLanguage?: string;
  businessType?: BusinessType | '';
  competitorUrls?: string[];
}

export interface Finding {
  id: string;
  title: string;
  status: FindingStatus;
  priority: PriorityLevel;
  impact: string;
  fix: string;
}

export interface PageSnapshot {
  detectedTitle: string;
  titleLength: number;
  detectedMetaDescription: string;
  metaDescriptionLength: number;
  detectedH1: string;
  wordCountEstimate: string;
  canonicalUrl: string;
  hasOpenGraph: boolean;
  hasTwitterCards: boolean;
  eeatSignals: string[];
}

export interface SeoAuditModule {
  score: number;
  summary: string;
  pageSnapshot: PageSnapshot;
  findings: Finding[];
}

export interface TechnicalChecklistItem {
  id: string;
  group: TechnicalGroup;
  title: string;
  status: ChecklistStatus;
  priority: PriorityLevel;
  details: string;
  fix: string;
}

export interface TechnicalChecklistModule {
  score: number;
  summary: string;
  findings: Finding[];
  schemaTypesPresent: string[];
  schemaTypesMissing: string[];
  items: TechnicalChecklistItem[];
}

export interface CompetitorGap {
  topic: string;
  competitorAdvantage: string;
  opportunity: string;
}

export interface SuggestedTopic {
  title: string;
  searchIntent: SearchIntent;
  targetKeyword: string;
  suggestedOutline: string[];
  format: string;
}

export interface TopicCluster {
  pillarTitle: string;
  targetAudience: string;
  clusterTopics: string[];
}

export interface RefreshOpportunity {
  pageOrSection: string;
  reason: string;
  recommendedUpdate: string;
}

export interface InternalLinkSuggestion {
  sourceContext: string;
  anchorText: string;
  targetPage: string;
  rationale: string;
}

export interface ContentModule {
  score: number;
  summary: string;
  findings: Finding[];
  competitorGaps: CompetitorGap[];
  suggestedTopics: SuggestedTopic[];
  topicClusters: TopicCluster[];
  refreshOpportunities: RefreshOpportunity[];
  internalLinkingSuggestions: InternalLinkSuggestion[];
}

export interface KeywordSuggestion {
  keyword: string;
  group: KeywordGroup;
  searchIntent: SearchIntent;
  estimatedDifficulty: 'Low' | 'Medium' | 'High';
  estimatedVolumeBand: string;
  estimatedRelevance: number;
  contentTypeToTarget: string;
  quickWin: boolean;
}

export interface KeywordModule {
  score: number;
  summary: string;
  findings: Finding[];
  keywordStrategy: string;
  keywords: KeywordSuggestion[];
}

export interface GeoDimension {
  dimension: string;
  score: number;
  note: string;
}

export interface QuotableSnippet {
  targetTopic: string;
  placement: string;
  suggestedCopy: string;
  whyItWorks: string;
}

export interface GeoModule {
  score: number;
  summary: string;
  findings: Finding[];
  readinessDimensions: GeoDimension[];
  llmsTxtRecommendation: {
    status: string;
    recommendation: string;
  };
  aiVisibilityGaps: string[];
  quotableSnippets: QuotableSnippet[];
}

export interface TopPriorityAction {
  title: string;
  module: string;
  priority: PriorityLevel;
  expectedImpact: string;
  action: string;
}

export interface GroundingSource {
  title: string;
  url: string;
  sourceType: 'url_context' | 'google_search';
}

export interface AuditReport {
  id: string;
  createdAt: string;
  input: AuditRequest;
  overallScore: number;
  executiveSummary: string;
  topPriorities: TopPriorityAction[];
  groundingSources: GroundingSource[];
  seoAudit: SeoAuditModule;
  technicalChecklist: TechnicalChecklistModule;
  contentRecommendations: ContentModule;
  keywordSuggestions: KeywordModule;
  aiSearchGeo: GeoModule;
}

export interface AuditHistoryEntry {
  report: AuditReport;
  checkedChecklistIds: string[];
}

export type AuditStepId =
  | 'reading_page'
  | 'on_page_seo'
  | 'technical_signals'
  | 'researching_keywords'
  | 'ai_search_readiness'
  | 'building_report';

export interface AuditProgressEvent {
  type: 'progress' | 'complete' | 'error';
  step?: AuditStepId;
  label?: string;
  report?: AuditReport;
  error?: string;
}
