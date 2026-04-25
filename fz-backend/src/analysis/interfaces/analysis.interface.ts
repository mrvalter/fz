import { AppliedChange } from './change-instruction.interface';
export interface AnalysisProgress {
  projectId: string;
  status: 'pending' | 'extracting' | 'applying' | 'completed' | 'failed';
  stage: 'stage1' | 'stage2' | null;
  currentArticle?: string;
  totalChanges?: number;
  completedChanges?: number;
  error?: string;
  result?: FinalResult;
}

export interface FinalResult {
  projectId: string;
  changes: AppliedChange[];
  finalLaw: string;
  statistics: {
    totalChanges: number;
    articlesModified: number;
    processingTimeMs: number;
    tokensUsed: {
      stage1: number;
      stage2: number;
      total: number;
    };
  };
}
