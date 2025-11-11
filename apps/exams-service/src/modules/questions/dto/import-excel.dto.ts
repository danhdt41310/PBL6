import { IsOptional, IsString } from 'class-validator';

/**
 * Import Excel Response DTO
 */
export interface ImportQuestionResult {
  success: boolean;
  total: number;
  imported: number;
  failed: number;
  errors: ImportQuestionError[];
}

export interface ImportQuestionError {
  row: number;
  content: string;
  errors: string[];
}

/**
 * Excel Row Data Interface
 */
export interface ExcelQuestionRow {
  content: string;
  type: string;
  category_name?: string;
  difficulty?: string;
  is_multiple_answer?: string;
  F?: string; // Option A
  G?: string; // Option B
  H?: string; // Option C
  I?: string; // Option D
  J?: string; // Option E
  K?: string; // Option F
  L?: string; // Option G
  M?: string; // Option H
  N?: string; // Option I
  O?: string; // Option J
  correct_answers?: string;
  is_public?: string;
  options_json?: string;
  status?: string;
}

/**
 * Preview Excel Request DTO
 */
export class PreviewExcelDto {
  @IsOptional()
  @IsString()
  limit?: string;
}

/**
 * Preview Excel Response
 */
export interface PreviewExcelResult {
  total: number;
  preview: ExcelQuestionRow[];
  headers: string[];
}
