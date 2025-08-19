import { PerformanceProfilingService } from '../PerformanceProfilingService';
import { BottleneckDetectionService } from '../BottleneckDetectionService';
import { RootCauseAnalysisService } from '../RootCauseAnalysisService';
import { PerformanceCorrelationService } from '../PerformanceCorrelationService';
import { PerformanceOptimizationService } from '../PerformanceOptimizationService';
import { PerformanceTestingService } from '../PerformanceTestingService';
import { BottleneckReportingService } from '../BottleneckReportingService';
declare const router: import("express-serve-static-core").Router;
export declare const initializeServices: (services: {
    profiling: PerformanceProfilingService;
    detection: BottleneckDetectionService;
    rootCause: RootCauseAnalysisService;
    correlation: PerformanceCorrelationService;
    optimization: PerformanceOptimizationService;
    testing: PerformanceTestingService;
    reporting: BottleneckReportingService;
}) => void;
export default router;
