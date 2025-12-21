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

// IMC Planner V2 Types - Strategic Framework

// 3-Layer Strategic Foundation
export interface IMCStrategicFoundation {
  business_obj: string;      // Revenue/Market share target (e.g., "Tăng 20% doanh thu Q4")
  marketing_obj: string;     // Behavior change: Trial/Switch/Repeat/Increase Basket
  communication_obj: string; // Perception change in consumer's mind
}

// KPI structure for each phase
export interface IMCPhaseKPI {
  metric: string;  // e.g., "Reach & View", "Engagement Rate", "Orders & Shares"
  target: string;  // e.g., "5,000,000 Reach", "50,000 Interactions"
}

// 3-Phase Execution Model
export type IMCPhaseType = 'AWARE' | 'TRIGGER' | 'CONVERT';

// Budget Split structure (Production vs Media)
export interface IMCBudgetSplit {
  production: number;     // Production cost (30%)
  media: number;          // Media/Distribution cost (70%)
  production_percent: string;
  media_percent: string;
}

// Content Volume Estimation
export interface IMCContentItem {
  type: string;           // e.g., "Video TikTok", "Bài Post FB", "Landing Page"
  quantity: number;
  estimated_cost: string; // e.g., "5M VND"
  notes?: string;         // e.g., "Quay bằng điện thoại, low-cost"
}

// Execution Deep-dive details
export interface IMCExecutionDetails {
  week_range: string;           // e.g., "Tuần 1-3"
  start_week: number;
  end_week: number;
  budget_split: IMCBudgetSplit;
  content_items: IMCContentItem[];
}

export interface IMCExecutionPhase {
  phase: IMCPhaseType;
  objective_detail: string;    // What this phase aims to achieve
  key_hook: string;            // The attention-grabbing message
  channels: string[];          // Marketing channels for this phase
  budget_allocation: string;   // Percentage like "40%"
  kpis: IMCPhaseKPI;
  // Deep-dive fields
  execution_details?: IMCExecutionDetails;
}

// Main IMC Plan V2 Interface
export interface IMCPlan {
  id: string;
  campaign_name: string;
  brand: string;
  product: string;
  industry: string;
  total_budget: number;
  timeline_weeks: number;
  strategic_foundation: IMCStrategicFoundation;
  imc_execution: IMCExecutionPhase[];
  validation_warnings?: string[];  // Golden Thread validation warnings
  created_at: number;
}

// Legacy types for backward compatibility
export interface IMCActivity {
  channel_type: 'Paid' | 'Owned' | 'Earned' | 'Shared';
  channel_name: string;
  tactic: string;
  kpi: string;
}

export interface IMCPhase {
  phase_name: string;
  objective: string;
  budget_allocation: string;
  duration_weeks: number;
  activities: IMCActivity[];
}

export interface IMCChannelMatrix {
  paid: string[];
  owned: string[];
  earned: string[];
  shared: string[];
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

export type ViewState = 'HOME' | 'HOME_DASHBOARD' | 'FEATURES_GUIDE' | 'LEARN_SELECT' | 'LEARN_SESSION' | 'VOCAB_MANAGER' | 'STARRED' | 'PLAN_CALENDAR' | 'PLAN_LIST' | 'PROMPTS' | 'TODO' | 'CONTENT_WRITER' | 'VISUAL_EMAIL' | 'KEY_VISUALS_LIST' | 'KEY_VISUALS_CREATE' | 'FRAME_VISUAL' | 'UTM_BUILDER' | 'MOCKUP_GENERATOR' | 'AB_TESTING' | 'ROAS_FORECASTER' | 'BRAND_VAULT' | 'RIVAL_RADAR' | 'PERSONA_BUILDER' | 'MINDMAP_GENERATOR' | 'SCAMPER_TOOL' | 'STRATEGIC_MODELS' | 'SMART_CALENDAR' | 'MASTERMIND_STRATEGY' | 'SMART_SALARY' | 'AUTO_BRIEF' | 'SOP_BUILDER' | 'HOOK_GENERATOR' | 'CUSTOMER_JOURNEY_MAPPER' | 'BUDGET_ALLOCATOR' | 'INSIGHT_FINDER' | 'CREATIVE_ANGLE_EXPLORER' | 'ADS_HEALTH_CHECKER' | 'BRAND_POSITIONING_BUILDER' | 'PRICING_ANALYZER' | 'AUDIENCE_EMOTION_MAP' | 'IMC_PLANNER' | 'MARKETING_KNOWLEDGE' | 'PESTEL_BUILDER';


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
  stage_goal: string;            // Goal of this stage

  // Layer 1: Customer Mindset (Enhanced)
  mindset: {
    doing: string;         // What they're physically doing
    feeling: string;       // Emotional state with emoji
    thinking: string;      // Inner thoughts/questions
  };

  // Layer 2: The "Brick Wall" (Pain Points/Barriers)
  barriers: string[];      // What stops them from moving forward

  // Layer 3: The "Hammer" (Solutions/Triggers)
  solutions: string[];     // Tactics to break the barrier

  // Layer 4: Touchpoints & Formats (Specific)
  touchpoints: {
    channel: string;       // e.g., "Facebook Reels"
    format: string;        // e.g., "Problem/Solution format"
    action: string;        // e.g., "Show pain point, introduce solution"
  }[];

  // Layer 5: Success Metrics (KPIs)
  kpis: {
    metric: string;        // e.g., "CTR", "Conversion Rate"
    target: string;        // e.g., ">2%", "15-20%"
    description: string;   // What it measures
  }[];

  // NEW: Detailed Action Items with Psychological Drivers
  action_items: {
    touchpoint: string;           // Specific channel (e.g., "Group Seeding", "Shopee Live")
    trigger_message: string;      // The exact headline or hook
    psychological_driver: string; // Emotion: FOMO, Trust, Greed, Pride, Fear, Curiosity
    format: string;               // Video Short, Long-form Blog, Infographic, DM
  }[];

  // Critical Action for stage
  critical_action: string;

  // Legacy fields for backward compatibility
  customer_mindset: string;
  emotional_state: string;
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

// 3-Hit Combo Structure for Campaign-Ready Insights
export interface InsightThreeHitCombo {
  // Layer 1: The Truth
  truth: {
    whatTheySay: string;      // Surface-level desire: "I want [Product] to be cheaper/better"
    currentBehavior: string;  // What they're currently doing to solve the problem
  };
  // Layer 2: The Tension (MOST IMPORTANT)
  tension: {
    wantX: string;            // "I want to X..."
    butAfraid: string;        // "BUT I'm afraid of Y..."
    insight: string;          // Full insight statement combining both
  };
  // Layer 3: The Discovery  
  discovery: {
    unspokenMotivation: string;  // The real motivation they won't say out loud
    notAbout: string;            // "Actually, it's not about [Product Feature]"
    itsAbout: string;            // "It's about [Emotional Reward]"
  };
}

// Creative Implications for actionable strategy
export interface CreativeImplications {
  coreMessage: string;        // Single sentence brand promise
  visualKey: string;          // Symbolic image description (e.g., "Person standing alone in crowd but glowing")
  triggerWords: string[];     // Power words: "Dám" (Dare), "Chất" (Cool), "Riêng" (Unique)
}

export interface InsightFinderResult {
  industry: string;
  // NEW: 3-Hit Combo structure
  threeHitCombo: InsightThreeHitCombo;
  // NEW: Creative Implications (The "So What?")
  creativeImplications: CreativeImplications;
  // Keep existing for backward compatibility
  deep_insights: DeepInsights;
  emotional_intensity: {
    level: number;
    description: string;
  };
  // NEW: Validation status for anti-hallucination
  validationStatus?: 'VALID' | 'NEEDS_CLARIFICATION';
  clarificationMessage?: string;
}

export interface InsightFinderInput {
  productIndustry: string;
  targetAudience: string;
  // NEW: Context Layer for specificity
  specificSegment?: string;       // e.g., "Gen Z Students", "Office Workers", "New Moms"
  usageOccasion?: string;         // e.g., "When hanging out with friends", "Late night alone"
  currentHabitCompetitor?: string; // e.g., "Currently using Product X"
  context?: string;               // Keep for backward compatibility
}
// --- CREATIVE ANGLE EXPLORER ---
export interface CreativeAngleInput {
  productName: string;
  productDescription?: string;
  targetAudience?: string;
  keyFeatures?: string[] | string;
  desiredAngleCount?: number; // 5-15
  // V2 Performance Creative fields
  painPoints?: string;
  brandVibe?: 'fun' | 'premium' | 'meme' | 'minimalist' | 'professional';
  desiredFormat?: 'video_short' | 'carousel' | 'static' | 'meme' | 'mixed';
}

export interface CreativeAngle {
  id: number;
  framework: string;
  angleName: string;
  hookText: string;
  adCopyOutline: string;
  visualDirection: string;
  suggestedFormat: string;
  emotionTag?: string;
  // V2 Concept Card fields
  hookType?: string;
  headlineOverlay?: string;
  scriptOutline?: {
    opening_0_3s: string;
    body: string;
    cta: string;
  };
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
    // New V3 fields for Profit-First analysis
    duration?: number;      // Days running
    frequency?: number;     // Times shown per person
    reach?: number;         // Unique people reached (alternative to frequency)
    revenue?: number;       // Total revenue/conversion value
  };
  rawText?: string;
}

export interface AdsHealthResult {
  health_score: number;
  status: 'Tốt' | 'Cần theo dõi' | 'Nguy kịch' | 'Good' | 'Warning' | 'Critical';
  metrics_analysis: {
    cpm: { value: number; assessment: string; benchmark?: string };
    ctr: { value: number; assessment: string; benchmark?: string };
    cpc: { value: number; assessment: string };
    cr: { value: number; assessment: string };
    cpa?: { value: number; assessment: string };
    // New V3 metrics for Profit-First analysis
    roas?: { value: number; assessment: string };
    aov?: { value: number; assessment: string };
    frequency?: { value: number; assessment: string };
  };
  diagnosis: {
    primary_issue: string;
    explanation: string;
    // New V3: Root cause category
    root_cause?: 'creative_fatigue' | 'audience_exhaustion' | 'low_profitability' | 'scale_opportunity' | 'tracking_issue';
  };
  actionable_steps: Array<{
    action: string;
    detail: string;
    priority?: 'urgent' | 'high' | 'medium' | 'low';
  }>;
  break_even_roas?: number;
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

// --- PESTEL BUILDER ---
export type PESTELCategory = 'Political' | 'Economic' | 'Social' | 'Technological' | 'Environmental' | 'Legal';
export type VerificationStatus = 'Verified' | 'Estimated' | 'Unverified';
export type ImpactDirection = 'Positive' | 'Negative' | 'Neutral';

export interface PESTELItem {
  factor: string;
  detail: string;
  impact_direction: ImpactDirection;
  impact_score: number; // 1-10
  actionable_insight: string;
  verification_status: VerificationStatus;
  source?: string; // Citation for P/L factors
  is_priority?: boolean; // High Priority flag for critical items
}

export interface PESTELFactorGroup {
  category: PESTELCategory;
  category_vi: string;
  items: PESTELItem[];
}

export interface PESTELBuilderInput {
  industry: string;
  location: string;
  businessScale: 'SME' | 'Startup' | 'Enterprise' | 'Multinational';
}

export interface PESTELBuilderResult {
  context: string;
  pestel_factors: PESTELFactorGroup[];
  generated_at: string;
  data_freshness: string;
}
