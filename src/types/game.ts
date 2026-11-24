export interface NewsArticle {
  id: string;
  title: string;
  media: string;
  date: string;
  summary: string;
  url: string;
  categoryId?: string;
  contextNote?: string;
}

export interface AccidentCategory {
  id: string;
  label: string;
  shortLabel: string;
  color: string;
  borderClass: string;
  badgeClass: string;
  newsCount: number; // 篇
  officialCount: number; // 件
  population?: number; // 同年年底戶籍人口數（分母）
  ratePer100k?: number; // 本專題計算：每10萬戶籍人口第一當事者登記筆數
  description: string;
}

export interface ReflectionPrompt {
  id: string;
  question: string;
  explanation: string;
}

export interface IntuitionOption {
  id: string;
  label: string;
  desc?: string;
  biasTag?: string;
}

export interface IntuitionQuestion {
  id: string;
  tag: string;
  prompt: string;
  plainNote?: string;
  termDetail?: string;
  options: IntuitionOption[];
  realityFact: string;
}

export interface IntuitionAnswerRecord {
  answers: Record<string, string>; // questionId -> optionId
  confidenceLevel: 1 | 2 | 3; // 1: 憑感覺猜測, 2: 普通有印象, 3: 非常有把握
}

export interface NewsObservation {
  readArticleIds: string[];
  selectedImpression?: string; // Step 2 impression anchor: elderly_runaway | youth_bike | daily_collision
  quizAnswer?: string; // Step 2 reading observation question answer
  expandedAll?: boolean;
}

export interface ReflectionScoreRecord {
  correct: number;
  total: number;
  answers?: Record<string, string>;
  checkedIds?: string[];
}

export interface ResearchCase {
  group?: '國旅交通' | '社會安全' | '生活';
  topic?: TopicData;
  id: string;
  title: string;
  subtitle: string;
  status: 'active' | 'coming_soon';
  verificationStatus: 'sample_simulation' | 'verified';
  simulationBadgeText: string;
  period: string;
  region: string;
  description: string[];
  categories: AccidentCategory[];
  newsSampleMeta: {
    totalArticles: number;
    sampleUnit: '篇' | '則' | string;
    source: string;
    searchKeywords: string[];
    notes: string;
  };
  officialDataMeta: {
    totalAccidents: number;
    officialUnit: '件' | string;
    source: string;
    definition: string;
    notes: string;
  };
  articles: NewsArticle[];
  reflectionPrompts: ReflectionPrompt[];
  intuitionQuestions?: IntuitionQuestion[];
}

export interface TopicSeries {
  title: string;
  unit: string;
  kind: 'line' | 'bar';
  predictionMaximum?: number;
  knownFirst?: boolean;
  predictionControl?: 'slider';
  points: { label: string; value: number; note?: string }[];
}

export interface TopicData {
  file: string;
  sha256: string;
  workbookUrl: string;
  sources: { title: string; url: string }[];
  series: TopicSeries[];
  supportingSeries?: TopicSeries[];
  scope: string;
  finding: string;
  limitation: string;
  furtherQuestion: string;
  overclaim: string;
  investigation: string;
  readingPrompt: string;
  correctAnswers: Record<string, string>;
}
