// Comprehensive API type definitions to replace 'any' usage

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiError {
  message: string;
  code?: string;
  status?: number;
  details?: Record<string, unknown>;
}

export interface ApiKey {
  id: string;
  name: string;
  key: string;
  permissions: string[];
  isActive: boolean;
  createdAt: Date;
  lastUsed?: Date;
  expiresAt?: Date;
}

export interface ChartTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    color: string;
    dataKey: string;
  }>;
  label?: string;
}

export interface SelectChangeHandler {
  (value: string): void;
}

export interface VoiceCommandParameters {
  [key: string]: string | number | boolean;
}

export interface VoiceCommand {
  action: string;
  parameters?: VoiceCommandParameters;
}

export interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

export interface SpeechRecognitionErrorEvent {
  error: string;
  message?: string;
}

export interface FilterUpdateHandler<T = unknown> {
  (key: string, value: T): void;
}

export interface BulkOperationData {
  category?: string;
  status?: string;
  price?: number;
  minStock?: number;
  maxStock?: number;
  location?: string;
}

export interface PICUser {
  id: string;
  name: string;
  email: string;
  role: string;
  department?: string;
}

export interface ProductUpdateData {
  name?: string;
  category?: string;
  price?: number;
  minStock?: number;
  maxStock?: number;
  location?: string;
  description?: string;
}

export interface StatsData {
  totalProducts: number;
  totalValue: number;
  lowStockCount: number;
  outOfStockCount: number;
  topProducts: Array<{
    id: string;
    name: string;
    value: number;
    stock: number;
  }>;
}

export interface ChartDataPoint {
  name: string;
  value: number;
  [key: string]: string | number;
}

export interface CustomLabelProps {
  cx: number;
  cy: number;
  midAngle: number;
  innerRadius: number;
  outerRadius: number;
  percent: number;
  index: number;
}