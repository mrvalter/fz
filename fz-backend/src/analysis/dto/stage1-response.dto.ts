import { ChangeInstruction } from '../interfaces/change-instruction.interface';

export class Stage1ResponseDto {
  success: boolean;
  changes: ChangeInstruction[];
  tokensUsed: number;
  processingTimeMs: number;
  error?: string;
}
