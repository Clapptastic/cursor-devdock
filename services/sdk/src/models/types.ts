/**
 * Customer Survey SDK Types
 * Defines the interfaces and types used throughout the SDK
 */

/**
 * Question type enum
 */
export enum QuestionType {
  TEXT = 'text',
  SINGLE_CHOICE = 'single_choice',
  MULTIPLE_CHOICE = 'multiple_choice',
  RATING = 'rating',
  SCALE = 'scale',
  CHECKBOX = 'checkbox'
}

/**
 * Question base properties
 */
export interface BaseQuestion {
  id: string;
  text: string;
  type: QuestionType;
  required?: boolean;
  order?: number;
}

/**
 * Text question
 */
export interface TextQuestion extends BaseQuestion {
  type: QuestionType.TEXT;
  maxLength?: number;
}

/**
 * Choice option
 */
export interface ChoiceOption {
  id: string;
  text: string;
  value: string | number;
}

/**
 * Single choice question
 */
export interface SingleChoiceQuestion extends BaseQuestion {
  type: QuestionType.SINGLE_CHOICE;
  options: ChoiceOption[];
}

/**
 * Multiple choice question
 */
export interface MultipleChoiceQuestion extends BaseQuestion {
  type: QuestionType.MULTIPLE_CHOICE;
  options: ChoiceOption[];
  maxSelections?: number;
}

/**
 * Rating question
 */
export interface RatingQuestion extends BaseQuestion {
  type: QuestionType.RATING;
  maxRating: number;
  labels?: {
    min?: string;
    max?: string;
  };
}

/**
 * Scale question
 */
export interface ScaleQuestion extends BaseQuestion {
  type: QuestionType.SCALE;
  minValue: number;
  maxValue: number;
  step?: number;
  labels?: {
    min?: string;
    max?: string;
  };
}

/**
 * All question types
 */
export type QuestionUnion = 
  | TextQuestion
  | SingleChoiceQuestion
  | MultipleChoiceQuestion
  | RatingQuestion
  | ScaleQuestion;

/**
 * Survey status
 */
export enum SurveyStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  CLOSED = 'closed',
  ARCHIVED = 'archived',
  PUBLISHED = 'published'
}

/**
 * Survey settings interface
 */
export interface SurveySettings {
  allowAnonymous?: boolean;
  requireEmail?: boolean;
  showProgressBar?: boolean;
  thankYouMessage?: string;
  confirmationMessage?: string;
  redirectUrl?: string;
  theme?: {
    primaryColor?: string;
    backgroundColor?: string;
    fontFamily?: string;
  };
}

/**
 * Survey type
 */
export interface Survey {
  id: string;
  title: string;
  description?: string;
  questions: Question[];
  status?: SurveyStatus;
  createdAt: string;
  updatedAt: string;
  expiresAt?: string;
  ownerId?: string;
  published?: boolean;
  isPublic?: boolean;
  settings?: SurveySettings;
}

/**
 * Answer base type
 */
export interface BaseAnswer {
  questionId: string;
}

/**
 * Text answer
 */
export interface TextAnswer extends BaseAnswer {
  value: string;
}

/**
 * Single choice answer
 */
export interface SingleChoiceAnswer extends BaseAnswer {
  value: string | number;
}

/**
 * Multiple choice answer
 */
export interface MultipleChoiceAnswer extends BaseAnswer {
  value: (string | number)[];
}

/**
 * Rating answer
 */
export interface RatingAnswer extends BaseAnswer {
  value: number;
}

/**
 * Scale answer
 */
export interface ScaleAnswer extends BaseAnswer {
  value: number;
}

/**
 * All answer types
 */
export type Answer = 
  | TextAnswer
  | SingleChoiceAnswer
  | MultipleChoiceAnswer
  | RatingAnswer
  | ScaleAnswer;

/**
 * Survey response
 */
export interface SurveyResponse {
  id: string;
  surveyId: string;
  answers: Answer[];
  createdAt: string;
  submittedAt?: string;
  respondentId?: string;
  respondentEmail?: string;
  metadata?: {
    userAgent?: string;
    ipAddress?: string;
    email?: string;
    userId?: string;
    [key: string]: any;
  };
}

/**
 * Survey statistics
 */
export interface SurveyStatistics {
  surveyId: string;
  responseCount: number;
  completionRate: number;
  averageCompletionTime?: number;
  questionStats: {
    [questionId: string]: {
      responseCount: number;
      // For rating/scale questions
      average?: number;
      distribution?: {
        [value: string]: number;
      };
    };
  };
}

/**
 * Survey insights
 */
export interface SurveyInsights {
  surveyId: string;
  sentiment?: {
    overall: number;
    positive: number;
    negative: number;
    neutral: number;
  };
  topics?: {
    name: string;
    count: number;
    sentiment?: number;
  }[];
  keywords?: {
    word: string;
    count: number;
  }[];
  recommendations?: string[];
}

// SDK Configuration
export interface SdkConfig {
  /**
   * The base URL of the API
   * @example 'https://api.customer-survey.com'
   */
  apiUrl: string;
  
  /**
   * API key for authentication (optional)
   */
  apiKey?: string;
  
  /**
   * JWT token for authentication (optional)
   */
  token?: string;
  
  /**
   * Timeout for API requests in milliseconds
   * @default 30000 (30 seconds)
   */
  timeout?: number;
  
  /**
   * Whether to enable debug logging
   * @default false
   */
  debug?: boolean;
}

/**
 * Response Stats interface
 */
export interface ResponseStats {
  totalResponses: number;
  responseDistribution: {
    [key: string]: number;
  };
  questionStats: {
    [questionId: string]: {
      average?: number;
      distribution: {
        [value: string]: number;
      };
    };
  };
}

/**
 * Question interface
 */
export interface Question {
  id: string;
  text: string;
  description?: string;
  type: QuestionType;
  required: boolean;
  order_position?: number;
  options?: string[];
  settings?: QuestionSettings;
}

export interface QuestionSettings {
  min?: number;
  max?: number;
  minLabel?: string;
  maxLabel?: string;
  options?: string[];
  maxLength?: number;
}

// AI Service Models
export interface TextAnalysis {
  sentiment: Sentiment;
  entities: Entity[];
  keyPhrases: string[];
  language: string;
  confidenceScore: number;
  analysisTimestamp: string;
}

export interface Sentiment {
  score: number;
  label: 'positive' | 'negative' | 'neutral';
  confidence: number;
}

export interface Entity {
  name: string;
  type: string;
  relevance: number;
}

export interface InsightRequest {
  surveyId: string;
  dateRange?: {
    start: string;
    end: string;
  };
  filters?: {
    questionId?: string;
    answerValue?: string | number;
  }[];
}

export interface Insights {
  totalResponses: number;
  responseAnalysis: {
    averageSentiment: number;
    commonTopics: string[];
    keyTakeaways: string[];
  };
  improvement: {
    areas: string[];
    suggestions: string[];
  };
  summary: string;
  sentimentDistribution: {
    positive: number;
    neutral: number;
    negative: number;
  };
  topKeyPhrases: { phrase: string; count: number }[];
  topEntities: { entity: string; count: number }[];
  ratingAverages?: { [questionId: string]: number };
  responseCount: number;
  trends?: Trend[];
}

export interface Trend {
  description: string;
  relevance: number;
  supportingData?: any;
}

export interface SurveyRecommendation {
  surveyTitle: string;
  estimatedCompletionTime: string;
  recommendedQuestions: {
    id: string;
    text: string;
    type: string;
    required: boolean;
    options?: string[];
  }[];
  bestPractices: string[];
  title: string;
  description: string;
  targetAudience?: string;
  suggestedChannels?: string[];
}

export interface RecommendedQuestion {
  text: string;
  type: QuestionType;
  required: boolean;
  options?: string[];
  purpose?: string;
}

// Error Handling
export interface ApiError {
  status: number;
  message: string;
  code?: string;
  details?: any;
}

export interface ApiResponse<T> {
  data: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
  };
}

export interface RequestOptions {
  headers?: Record<string, string>;
  responseType?: 'json' | 'blob' | 'text';
  timeout?: number;
  params?: Record<string, any>;
}

// Export Types
export interface ExportOptions {
  format: 'csv' | 'json' | 'pdf';
  includeMetadata?: boolean;
  anonymize?: boolean;
}

// Authentication Types
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
} 