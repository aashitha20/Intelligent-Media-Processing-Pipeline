export type ModuleIssue = {
  code: string;
  message: string;
  severity: 'info' | 'warning' | 'error';
};

export type AnalysisModuleResult = {
  blurScore?: number;
  isBlurry?: boolean;
  brightness?: number;
  brightnessOk?: boolean;
  perceptualHash?: string;
  isDuplicate?: boolean;
  duplicateOfId?: string | null;
  ocrText?: string;
  numberPlate?: string | null;
  numberPlateValid?: boolean | null;
  width?: number;
  height?: number;
  dimensionsOk?: boolean;
  metadata?: Record<string, unknown>;
  metadataOk?: boolean;
  issues?: ModuleIssue[];
};

export type AggregatedAnalysis = AnalysisModuleResult & {
  confidence: number;
  issues: ModuleIssue[];
  failureReason?: string;
};
