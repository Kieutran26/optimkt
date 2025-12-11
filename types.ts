export interface Word {
  id: string;
  term: string; // English
  definition: string; // Vietnamese
  starred: boolean;
  setId: string;
}

export interface VocabSet {
  id: string;
  name: string;
  description?: string;
  createdAt: number;
}

export interface TranslationRecord {
  id: string;
  sourceText: string;
  translatedText: string;
  fromLang: 'en' | 'vi';
  toLang: 'en' | 'vi';
  timestamp: number;
}

export interface Plan {
  id: string;
  website: string;
  price: number;
  currency: string;
  email: string;
  paymentDate: string; // YYYY-MM-DD (Original start/payment date)
  nextPaymentDate: string; // YYYY-MM-DD
  cardInfo: string; // e.g. "Visa **** 1234"
  billingCycle: 'monthly' | 'yearly';
  icon: string; // Icon identifier
}

export interface SavedPrompt {
  id: string;
  aiModel: string; // e.g. Gemini, GPT-4, Midjourney
  title: string; // "Chi tiết" - What is this prompt for?
  content: string; // The actual prompt text
  createdAt: number;
}

export interface ToDoTask {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
  priority: 'low' | 'medium' | 'high';
  deadline?: string;
  note?: string;
}

// IMC Planner Types
export interface IMCActivity {
  channel_type: 'Paid' | 'Owned' | 'Earned' | 'Shared';
  channel_name: string;
  tactic: string;
  kpi: string;
}

export interface IMCPhase {
  phase_name: string;
  objective: string;
  budget_allocation: string; // percentage like "15%"
  duration_weeks: number;
  activities: IMCActivity[];
}

export interface IMCChannelMatrix {
  paid: string[];
  owned: string[];
  earned: string[];
  shared: string[];
}

export interface IMCPlan {
  id: string;
  campaign_name: string;
  big_idea: string;
  key_message: string;
  brand: string;
  product: string;
  total_budget: number;
  timeline_weeks: number;
  phases: IMCPhase[];
  channel_matrix: IMCChannelMatrix;
  created_at: number;
}


export interface ContentHistoryRecord {
  id: string;
  timestamp: number;
  originalContent: string;
  selectedPlatforms: string[];
  results: Record<string, any>;
}

// --- Key Visuals Types ---
export interface KeyVisualImage {
  id: string;
  url: string; // Base64 or URL
  prompt: string;
  style: string;
  createdAt: number;
}

export interface KeyVisualProject {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  // Inputs
  aspectRatio: string;
  description: string;

  // New Fields
  concept?: string;
  mood?: string;
  referenceImage?: string; // Base64 (Style reference)
  productAssets?: string[]; // Array of Base64 (Supporting assets)
  placementInstructions?: string;

  productImage?: string; // Base64 (Main Hero)
  productNote?: string;

  // Typography & Copy
  mainHeading?: string;
  mainHeadingStyle?: string;
  mainHeadingEffect?: string; // New: Neon, Metallic, etc.
  subHeading?: string;
  subHeadingEffect?: string; // New
  contentText?: string; // New: Body text
  contentTextEffect?: string; // New
  cta?: string; // New: Call to action text
  ctaEffect?: string; // New: Button style/effect

  images: KeyVisualImage[];
}

// --- Frame Visual Types ---
export interface StoryFrame {
  id: string;
  script: string;
  imageUrl?: string;
  isLoading: boolean;
  error?: string;
}

export interface StoryboardProject {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  style: string;
  frames: StoryFrame[];
}

// --- Email Builder Types ---
export interface EmailTemplateConfig {
  logo: string | null;
  title: string;
  contentHtml: string;
  showFooter: boolean;
  btnText: string;
  btnUrl: string;
  footerText: string;
  activeLayout: 'modern' | 'minimal' | 'corporate';
  primaryColor: string;
  backgroundColor: string;
}

export interface EmailTemplate {
  id: string;
  name: string;
  createdAt: number;
  config: EmailTemplateConfig;
}

export interface EmailHistoryRecord {
  id: string;
  timestamp: number;
  title: string;
  html: string;
}

// --- UTM Builder Types ---
export interface UtmRecord {
  id: string;
  baseUrl: string;
  source: string;
  medium: string;
  campaign: string;
  term?: string;
  content?: string;
  finalUrl: string;
  shortUrl?: string;
  createdAt: number;
}

export interface UtmPreset {
  id: string;
  name: string; // e.g. "Facebook Ads Traffic"
  source: string; // e.g. "facebook"
  medium: string; // e.g. "cpc"
}

// --- ROAS Forecaster Types ---
export interface RoasScenario {
  id: string;
  name: string;
  createdAt: number;
  inputs: {
    budget: number;
    cpc: number;
    conversionRate: number;
    aov: number;
    cogs: number;
  };
  results: {
    revenue: number;
    netProfit: number;
    roas: number;
  };
}

// --- Brand Vault Types ---
export interface BrandColor {
  type: string; // Primary, Secondary, Accent
  code: string; // Hex
}

export interface BrandLogo {
  id: string;
  url: string; // Base64
  variantName: string; // e.g. "Logo chính", "Logo trắng", "Icon"
}

export interface Brand {
  id: string;
  identity: {
    name: string;
    logoMain: string | null;
    logoIcon: string | null;
    logos: BrandLogo[];
    colors: BrandColor[];
    fontFamily: string;
  };
  strategy: {
    vision: string;
    mission: string;
    coreValues: string[];
    toneOfVoice: string;
    shortTermGoals: string[];
    longTermGoals: string[];
    targetObjectives: string[];
  };
  audience: {
    demographics: string[];
    psychographics: string[];
    painPoints: string[];
  };
  createdAt: number;
}

// --- Rival Radar Types ---
export interface CompetitorAd {
  id: string;
  imageUrl: string; // Uploaded Base64 or link
  copyText: string; // Ad copy / caption
  platform: string; // Facebook, Google, etc.
  dateSaved: number;
}

export interface Competitor {
  id: string;
  name: string;
  website: string;
  logoUrl: string; // Favicon or OG Image
  brandColor: string; // Extracted or Manual
  usp: string; // Meta description
  strengths: string[]; // SWOT
  weaknesses: string[]; // SWOT
  adArchive: CompetitorAd[];
  createdAt: number;
}

// --- Persona Builder Types ---
export interface PersonalityTrait {
  leftLabel: string; // e.g. Introvert
  rightLabel: string; // e.g. Extrovert
  value: number; // 0-100
}

export interface Persona {
  id: string;
  brandId: string; // Linked to a Brand
  fullname: string;
  avatarUrl: string; // Base64 or URL
  ageRange: string;
  jobTitle: string;
  bio: string;

  // Psychographics
  goals: string[];
  frustrations: string[];
  motivations: string[]; // e.g. Price, Quality, Speed
  preferredChannels: string[]; // e.g. FB, LinkedIn

  // Sliders
  personality: PersonalityTrait[];

  createdAt: number;
}

// --- Mindmap Generator Types ---
export interface MindmapProject {
  id: string;
  name: string;
  nodes: any[]; // ReactFlow Nodes
  edges: any[]; // ReactFlow Edges
  viewport?: { x: number, y: number, zoom: number };
  createdAt: number;
  updatedAt: number;
}

// --- SCAMPER Tool Types ---
export interface ScamperSession {
  id: string;
  topic: string;
  context: string;
  results: {
    substitute: string[];
    combine: string[];
    adapt: string[];
    modify: string[];
    putToAnotherUse: string[];
    eliminate: string[];
    reverse: string[];
  };
  savedIdeas: string[];
  createdAt: number;
}

// --- Strategic Model Generator Types ---
export interface StrategicModelData {
  model_type: string;
  data: Record<string, string[] | string>;
  summary: string;
}

// --- Smart Content Calendar Types ---
export interface ContentPlanItem {
  id: string;
  date: string; // YYYY-MM-DD
  title: string;
  pillar: string;
  angle: string;
  format: 'Video' | 'Image' | 'Text' | 'Carousel';
  status: 'Idea' | 'Drafting' | 'Published';
  content_brief: string;
  channel?: string; // Facebook, TikTok, etc.
}

export interface ContentPillar {
  name: string;
  weight: number; // Percentage 0-100
  color: string;
}

export interface CalendarProject {
  id: string;
  name: string;
  brandId: string;
  overallStrategy: string;
  pillars: ContentPillar[];
  events: ContentPlanItem[];
  createdAt: number;
  updatedAt: number;
}

// --- Mastermind Strategy Types ---
export interface MastermindStrategy {
  id: string;
  name: string;
  brandId: string;
  personaId: string;

  // Context
  objective: string;
  perception: string;
  tone: string;

  // AI Output
  result: {
    insight: string;
    coreMessage: string;
    keyMessages: string[];
    contentAngles: {
      text: string[];
      visual: string[];
      story: string[];
      data: string[];
      action: string[];
    };
    channelStrategy: Record<string, number>; // Channel name -> Weight %
  };
  createdAt: number;
}

export type ViewState = 'HOME' | 'HOME_DASHBOARD' | 'FEATURES_GUIDE' | 'LEARN_SELECT' | 'LEARN_SESSION' | 'VOCAB_MANAGER' | 'STARRED' | 'PLAN_CALENDAR' | 'PLAN_LIST' | 'PROMPTS' | 'TODO' | 'CONTENT_WRITER' | 'VISUAL_EMAIL' | 'KEY_VISUALS_LIST' | 'KEY_VISUALS_CREATE' | 'FRAME_VISUAL' | 'UTM_BUILDER' | 'MOCKUP_GENERATOR' | 'AB_TESTING' | 'ROAS_FORECASTER' | 'BRAND_VAULT' | 'RIVAL_RADAR' | 'PERSONA_BUILDER' | 'MINDMAP_GENERATOR' | 'SCAMPER_TOOL' | 'STRATEGIC_MODELS' | 'SMART_CALENDAR' | 'MASTERMIND_STRATEGY' | 'SMART_SALARY' | 'AUTO_BRIEF' | 'SOP_BUILDER' | 'HOOK_GENERATOR' | 'CUSTOMER_JOURNEY_MAPPER' | 'BUDGET_ALLOCATOR' | 'INSIGHT_FINDER' | 'CREATIVE_ANGLE_EXPLORER' | 'ADS_HEALTH_CHECKER' | 'BRAND_POSITIONING_BUILDER' | 'PRICING_ANALYZER' | 'AUDIENCE_EMOTION_MAP' | 'IMC_PLANNER';


// --- AUTO BRIEF GENERATOR ---
export interface BriefObjectives {
  business: string;
  marketing: string;
  communication: string;
}

export interface BriefPersona {
  demographic: string;
  psychographic: string;
  insight: string;
}

export interface BriefStrategy {
  core_message: string;
  key_hook: string;
  tone_mood: string;
}

export interface BriefExecutionPhase {
  phase: string;
  activity: string;
  channel: string;
}

export interface BriefKPIs {
  estimated_reach: string;
  required_content_pieces: string[];
}

export interface BriefData {
  project_name: string;
  context_analysis: string;
  objectives: BriefObjectives;
  target_persona: BriefPersona;
  strategy: BriefStrategy;
  execution_plan: BriefExecutionPhase[];
  kpis_deliverables: BriefKPIs;
}

// --- SOP BUILDER ---
export interface SOPStep {
  id: number;
  action: string;
  role: string;
  tools: string[];
  critical_note?: string;
  completed: boolean;
}

export interface SOPPhase {
  phase_name: string;
  steps: SOPStep[];
  collapsed: boolean;
}

export interface SOPData {
  sop_title: string;
  estimated_time: string;
  phases: SOPPhase[];
}

export enum StudyMode {
  FLASHCARD = 'FLASHCARD',
  QUIZ = 'QUIZ', // Multiple choice
  WRITING = 'WRITING'
}

// --- HOOK GENERATOR (The Hook Matrix) ---
export interface HookAnalysis {
  identified_pain_point: string;
  identified_desire: string;
}

export interface VideoHook {
  style: string;
  hook_text: string;
  visual_cue: string;
  psychology_trigger: string;
}

export interface LandingPageHook {
  style: string;
  headline: string;
  sub_headline: string;
  psychology_trigger: string;
}

export interface EmailHook {
  style: string;
  subject_line: string;
  preview_text: string;
  psychology_trigger: string;
}

export interface SocialHook {
  style: string;
  hook_text: string;
  hashtag_suggestion: string;
  psychology_trigger: string;
}

export interface HookGeneratorResult {
  analysis: HookAnalysis;
  hooks: {
    video_shorts: VideoHook[];
    landing_page: LandingPageHook[];
    email: EmailHook[];
    social_post: SocialHook[];
  };
}

// --- CUSTOMER JOURNEY MAPPER ---
export interface JourneyStage {
  stage: string;
  customer_mindset: string;
  emotional_state: string;
  touchpoints: string[];
  key_message: string;
  content_ideas: string[];
}

// --- BUDGET ALLOCATOR ---
export interface ChannelAllocation {
  channel: string;
  percentage: number;
  amount: number;
  role: string;
  rationale: string;
}

export interface BudgetAllocationResult {
  total_budget: number;
  strategy_name: string;
  allocation: ChannelAllocation[];
  estimated_result: {
    clicks: string;
    conversions: string;
  };
}

export interface BudgetAllocatorInput {
  totalBudget: number;
  kpi: 'sales' | 'awareness' | 'retention' | 'custom';
  industry: string;
}

// --- INSIGHT FINDER ---
export interface PainPoint {
  level: 'Surface' | 'Deep';
  content: string;
}

export interface MotivationsJTBD {
  functional: string;
  emotional: string;
  social: string;
}

export interface Barrier {
  type: 'Trust Barrier' | 'Effort Barrier' | 'Price Barrier';
  content: string;
}

export interface BuyingBehavior {
  search_channel: string;
  decision_driver: string;
  deal_breaker: string;
}

export interface DeepInsights {
  pain_points: PainPoint[];
  motivations_jtbd: MotivationsJTBD;
  barriers: Barrier[];
  buying_behavior: BuyingBehavior;
}

export interface InsightFinderResult {
  industry: string;
  deep_insights: DeepInsights;
  emotional_intensity: {
    level: number;
    description: string;
  };
}

export interface InsightFinderInput {
  productIndustry: string;
  targetAudience: string;
  context?: string;
}
// --- CREATIVE ANGLE EXPLORER ---
export interface CreativeAngleInput {
  productName: string;
  productDescription: string;
  targetAudience?: string;
  keyFeatures?: string[];
  desiredAngleCount?: number; // 20-50
}

export interface CreativeAngle {
  id: number;
  framework: 'PAS' | 'BAB' | 'Emotional Hook' | 'Story-driven';
  angleName: string;
  hookText: string;
  adCopyOutline: string;
  visualDirection: string;
  suggestedFormat: string;
  emotionTag?: string; // For Emotional Hooks: FOMO, Vanity, Greed, Laziness, Curiosity, Altruism, Fear
}

export interface CreativeAngleResult {
  productContext: string;
  totalAngles: number;
  angles: CreativeAngle[];
}

export interface AdsHealthInput {
  platform: string;
  industry: string;
  dataMode: 'manual' | 'paste';
  manualMetrics?: {
    spend: number;
    impressions: number;
    clicks: number;
    conversions: number;
  };
  rawText?: string;
}

export interface AdsHealthResult {
  health_score: number;
  status: 'Good' | 'Warning' | 'Critical';
  metrics_analysis: {
    cpm: { value: number; assessment: string; benchmark: string };
    ctr: { value: number; assessment: string; benchmark: string };
    cpc: { value: number; assessment: string };
    cr: { value: number; assessment: string };
  };
  diagnosis: {
    primary_issue: string;
    explanation: string;
  };
  actionable_steps: Array<{
    action: string;
    detail: string;
  }>;
}

// --- BRAND POSITIONING BUILDER ---
export interface BrandPositioningInput {
  brandName: string;
  products: string;
  targetCustomers: string;
  competitors: string;
  visionMission?: string;
}

export interface BrandPositioningResult {
  brand_identity: {
    archetype: string;
    archetype_desc: string;
    tone_of_voice: string[];
  };
  strategic_pillars: {
    usp: string;
    uvp: string;
    rtb: string[];
  };
  messaging_pillars: Array<{
    pillar_name: string;
    key_message: string;
  }>;
  positioning_statement: string;
}

// --- PRICING ANALYZER ---
export interface PricingAnalyzerInput {
  productName: string;
  industry: string;
  cogs: number;
  targetPrice: number;
  competitorMin: number;
  competitorMax: number;
  positioning: 'budget' | 'mainstream' | 'premium';
  fixedCosts?: number;
  pricingGoal?: string;
}

export interface PricingVerdict {
  status: 'Optimal' | 'Warning' | 'Critical';
  score: number;
  summary: string;
}

export interface FinancialAnalysis {
  gross_margin_percent: number;
  break_even_point: string;
  assessment: string;
}

export interface MarketPositionAnalysis {
  your_price: number;
  market_avg: number;
  price_index: number;
  comment: string;
}

export interface StrategicSolution {
  type: string;
  advice: string;
}

export interface PricingAnalyzerResult {
  verdict: PricingVerdict;
  financial_analysis: FinancialAnalysis;
  market_position_analysis: MarketPositionAnalysis;
  strategic_solutions: StrategicSolution[];
}

// --- AUDIENCE EMOTION MAP ---
export interface AudienceEmotionMapInput {
  industry: string;
  productCategory?: string;
  targetAudience?: string;
  painPoint: string;
  positioning?: string;
}

export interface EmotionStage {
  stage: 'Awareness' | 'Journey' | 'Buy' | 'Loyal';
  dominant_emotion: string;
  intensity_score: number;
  trigger: string;
  internal_monologue: string;
  recommended_tone: string;
  content_hook: string;
  emoji?: string;
  keywords_to_use?: string[];
  keywords_to_avoid?: string[];
}

export interface AudienceEmotionMapResult {
  industry: string;
  emotion_journey: EmotionStage[];
}


