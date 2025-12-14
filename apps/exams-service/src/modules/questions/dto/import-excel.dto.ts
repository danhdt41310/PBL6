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
 * New structure: 8 pairs of (option_text, is_correct_checkbox)
 * Columns: 
 * - A-E: content, type, category_name, difficulty, is_multiple_answer
 * - F-G: Option A (text, checkbox)
 * - H-I: Option B (text, checkbox)
 * - J-K: Option C (text, checkbox)
 * - L-M: Option D (text, checkbox)
 * - N-O: Option E (text, checkbox)
 * - P-Q: Option F (text, checkbox)
 * - R-S: Option G (text, checkbox)
 * - T-U: Option H (text, checkbox)
 * - V: is_public
 * - W: options_json (auto-filled, can be ignored)
 * - X: status (error messages, auto-filled)
 */
export interface ExcelQuestionRow {
  content: string;
  type: string;
  category_name?: string;
  difficulty?: string;
  is_multiple_answer?: string;
  // Option A
  F?: string; // Option A text
  G?: string; // Option A is correct? (true/false/1/0)
  // Option B
  H?: string; // Option B text
  I?: string; // Option B is correct?
  // Option C
  J?: string; // Option C text
  K?: string; // Option C is correct?
  // Option D
  L?: string; // Option D text
  M?: string; // Option D is correct?
  // Option E
  N?: string; // Option E text
  O?: string; // Option E is correct?
  // Option F
  P?: string; // Option F text
  Q?: string; // Option F is correct?
  // Option G
  R?: string; // Option G text
  S?: string; // Option G is correct?
  // Option H
  T?: string; // Option H text
  U?: string; // Option H is correct?
  // Other fields
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
