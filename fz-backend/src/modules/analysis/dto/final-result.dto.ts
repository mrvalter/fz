import { FinalResult } from '../interfaces/analysis.interface';
import { AppliedChange } from '../interfaces/change-instruction.interface';

export class FinalResultDto implements FinalResult {
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
