export type ChangeType = 'replace' | 'add' | 'delete';

export interface ChangeInstruction {
  type: ChangeType;
  chapter?: string;
  article: string;
  newContent?: string; // для replace и add
  deletedContent?: string; // для delete
}

export interface AppliedChange {
  type: ChangeType;
  chapter?: string;
  article: string;
  oldContent: string;
  newContent: string;
  success: boolean;
  error?: string;
}
