export type CorrelationAnalysis = {
  correlation: number;
  significance: number;
  metrics: string[];
};

export enum TestType {
  LOAD = 'load',
  STRESS = 'stress', 
  SPIKE = 'spike',
  SOAK = 'soak'
}

export type TestConfiguration = {
  duration: number;
  users: number;
  rampUp: number;
  target?: string;
};

export type ExportData = {
  format: 'pdf' | 'html' | 'csv';
  data: any;
};
