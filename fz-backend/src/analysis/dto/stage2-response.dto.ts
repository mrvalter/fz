import { AppliedChange } from '../interfaces/change-instruction.interface';

export class Stage2ResponseDto {
  success: boolean;
  changes: AppliedChange[];
  tokensUsed: number;
  processingTimeMs: number;
  error?: string;
}
