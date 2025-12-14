import { Injectable, BadRequestException } from '@nestjs/common';
import * as XLSX from 'xlsx';
import { TransactionService } from '../../prisma/transaction.service';
import { QuestionsService } from './questions.service';
import {
  ExcelQuestionRow,
  ImportQuestionResult,
  ImportQuestionError,
  PreviewExcelResult,
} from './dto/import-excel.dto';

@Injectable()
export class QuestionsImportService {
  constructor(
    private readonly transactionService: TransactionService,
    private readonly questionsService: QuestionsService,
  ) {}

  /**
   * Preview Excel file data
   */
  async previewExcel(buffer: Buffer, limit: number = 10): Promise<PreviewExcelResult> {
    try {
      // Read workbook from buffer (binary data) & access "Main" sheet
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      const mainSheet = workbook.Sheets['Main'];

      if (!mainSheet) {
        throw new BadRequestException('Sheet "Main" not found in Excel file');
      }

      // Parse sheet to JSON
      const rawData: any[] = XLSX.utils.sheet_to_json(mainSheet, {
        header: 'A',
        defval: '',
        blankrows: false,
      });

      // Skip first 3 rows (title, header, notes)
      const dataRows = rawData.slice(3);

      // Get headers from row 2
      const headers = Object.values(rawData[1] || {}) as string[];

      // Parse all rows and filter out empty ones
      const allParsedRows = dataRows
        .map((row) => this.parseExcelRow(row))
        .filter((row) => row.content && row.content.trim() !== '');

      // Get preview with limit
      const preview = allParsedRows.slice(0, limit);

      return {
        total: allParsedRows.length, // Only count non-empty rows
        preview,
        headers,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`Failed to preview Excel: ${error.message}`);
    }
  }

  /**
   * Import questions from Excel file
   */
  async importExcel(buffer: Buffer, createdBy: number): Promise<ImportQuestionResult> {
    const errors: ImportQuestionError[] = [];
    let imported = 0;
    let failed = 0;

    try {
      // Read workbook from buffer (binary data) & access "Main" sheet
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      const mainSheet = workbook.Sheets['Main'];

      if (!mainSheet) {
        throw new BadRequestException('Sheet "Main" not found in Excel file');
      }

      // Parse sheet to JSON
      const rawData: any[] = XLSX.utils.sheet_to_json(mainSheet, {
        header: 'A', // Use column letters as keys
        defval: '', // Default value for empty cells
        blankrows: false, // Skip completely blank rows
      });

      // Skip first 3 rows (title, header, notes)
      const dataRows = rawData.slice(3);

      // Parse all rows
      const parsedRows = dataRows
        .map((row, index) => ({
          rowNumber: index + 4, // +4 because of skipped rows
          data: this.parseExcelRow(row),
        }))
        .filter((item) => item.data.content && item.data.content.trim() !== '') // Only allow non-empty content

      // Import within transaction
      await this.transactionService.runTransaction(async (tx) => {
        // Pre-fetch or create all categories at once to avoid repeated upserts
        const categoryNames = [...new Set(
          parsedRows
            .map(item => item.data.category_name?.trim())
            .filter(name => name && name !== '')
        )];

        const categoryMap = new Map<string, number>();
        
        // Batch upsert categories
        for (const categoryName of categoryNames) {
          const category = await tx.questionCategory.upsert({
            where: { 
              name_created_by: {
                name: categoryName,
                created_by: createdBy,
              }
            },
            update: {},
            create: { 
              name: categoryName,
              created_by: createdBy,
            },
          });
          categoryMap.set(categoryName, category.category_id);
        }

        for (const { rowNumber, data } of parsedRows) {
          try {
            // Validate row
            const validationErrors = this.validateRow(data);
            if (validationErrors.length > 0) {
              errors.push({
                row: rowNumber,
                content: data.content,
                errors: validationErrors,
              });
              failed++;
              continue;
            }

            // Get category ID from pre-fetched map
            let categoryId: number | null = null;
            if (data.category_name && data.category_name.trim() !== '') {
              categoryId = categoryMap.get(data.category_name.trim()) || null;
            }

            // Build options JSON from 8 pairs of (text, checkbox)
            let options = null;
            if (data.type === 'multiple_choice') {
              // Get all 8 option pairs (text + checkbox)
              const optionsData = [
                { text: data.F, correct: data.G }, // Option A
                { text: data.H, correct: data.I }, // Option B
                { text: data.J, correct: data.K }, // Option C
                { text: data.L, correct: data.M }, // Option D
                { text: data.N, correct: data.O }, // Option E
                { text: data.P, correct: data.Q }, // Option F
                { text: data.R, correct: data.S }, // Option G
                { text: data.T, correct: data.U }, // Option H
              ].filter((opt) => opt.text && opt.text.trim() !== '');

              if (optionsData.length === 0) {
                errors.push({
                  row: rowNumber,
                  content: data.content,
                  errors: ['Multiple choice question must have at least one option'],
                });
                failed++;
                continue;
              }

              // Build options with prefix (= for correct, ~ for incorrect)
              options = optionsData.map((opt, index) => {
                const isCorrect = opt.correct === 'true' || opt.correct === 'TRUE' || opt.correct === '1';
                const prefix = isCorrect ? '=' : '~';
                return {
                  id: index + 1,
                  text: `${prefix}${opt.text.trim()}`,
                };
              });

              // Validate at least one correct answer
              const hasCorrectAnswer = options.some(opt => opt.text.startsWith('='));
              if (!hasCorrectAnswer) {
                errors.push({
                  row: rowNumber,
                  content: data.content,
                  errors: ['Multiple choice question must have at least one correct answer'],
                });
                failed++;
                continue;
              }
            }

            // Create question
            await tx.question.create({
              data: {
                content: data.content.trim(),
                type: data.type as any,
                difficulty: (data.difficulty || 'medium') as any,
                is_multiple_answer: data.is_multiple_answer === 'true',
                options: options,
                category_id: categoryId,
                created_by: createdBy,
                is_public: data.is_public === 'true',
              },
            });

            imported++;
          } catch (error) {
            errors.push({
              row: rowNumber,
              content: data.content,
              errors: [`Failed to import: ${error.message}`],
            });
            failed++;
          }
        }
      });

      return {
        success: failed === 0,
        total: parsedRows.length,
        imported,
        failed,
        errors,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`Failed to import Excel: ${error.message}`);
    }
  }

  /**
   * Normalize boolean value from Excel
   * Excel can return: true, TRUE, "true", "TRUE", 1, "1", false, FALSE, "false", "FALSE", 0, "0"
   * We normalize to: "true" | "false" | ""
   */
  private normalizeBooleanValue(value: any): string {
    if (value === undefined || value === null || value === '') {
      return '';
    }
    
    // Handle boolean type
    if (typeof value === 'boolean') {
      return value ? 'true' : 'false';
    }
    
    // Handle number type (1 = true, 0 = false)
    if (typeof value === 'number') {
      return value === 1 ? 'true' : 'false';
    }
    
    // Handle string type
    const strValue = String(value).toLowerCase().trim();
    if (strValue === 'true' || strValue === '1') {
      return 'true';
    }
    if (strValue === 'false' || strValue === '0') {
      return 'false';
    }
    
    // Return original for validation to catch
    return String(value);
  }

  /**
   * Parse Excel row to question data
   * Structure: F-G (Option A), H-I (Option B), J-K (Option C), L-M (Option D),
   *            N-O (Option E), P-Q (Option F), R-S (Option G), T-U (Option H),
   *            V (is_public), W (options_json), X (status)
   */
  private parseExcelRow(row: any): ExcelQuestionRow {
    return {
      content: row.A,
      type: row.B || '',
      category_name: row.C || '',
      difficulty: row.D || '',
      is_multiple_answer: this.normalizeBooleanValue(row.E),
      // Option A (text + checkbox)
      F: row.F || '',
      G: this.normalizeBooleanValue(row.G),
      // Option B (text + checkbox)
      H: row.H || '',
      I: this.normalizeBooleanValue(row.I),
      // Option C (text + checkbox)
      J: row.J || '',
      K: this.normalizeBooleanValue(row.K),
      // Option D (text + checkbox)
      L: row.L || '',
      M: this.normalizeBooleanValue(row.M),
      // Option E (text + checkbox)
      N: row.N || '',
      O: this.normalizeBooleanValue(row.O),
      // Option F (text + checkbox)
      P: row.P || '',
      Q: this.normalizeBooleanValue(row.Q),
      // Option G (text + checkbox)
      R: row.R || '',
      S: this.normalizeBooleanValue(row.S),
      // Option H (text + checkbox)
      T: row.T || '',
      U: this.normalizeBooleanValue(row.U),
      // Other fields
      is_public: this.normalizeBooleanValue(row.V),
      options_json: row.W || '',
      status: row.X || '',
    };
  }

  /**
   * Validate Excel row data
   */
  private validateRow(data: ExcelQuestionRow): string[] {
    const errors: string[] = [];

    // Check required fields
    if (!data.content || data.content.trim() === '') {
      errors.push('Content is required');
    }

    if (!data.type || data.type.trim() === '') {
      errors.push('Type is required');
    }

    // Validate type
    const validTypes = ['multiple_choice', 'essay'];
    if (data.type && !validTypes.includes(data.type)) {
      errors.push(`Invalid type. Allowed: ${validTypes.join(', ')}`);
    }

    // Validate difficulty
    if (data.difficulty) {
      const validDifficulties = ['easy', 'medium', 'hard'];
      if (!validDifficulties.includes(data.difficulty)) {
        errors.push(`Invalid difficulty. Allowed: ${validDifficulties.join(', ')}`);
      }
    }

    // Validate multiple choice options
    if (data.type === 'multiple_choice') {
      const optionsData = [
        { text: data.F, correct: data.G, label: 'A' }, // Option A
        { text: data.H, correct: data.I, label: 'B' }, // Option B
        { text: data.J, correct: data.K, label: 'C' }, // Option C
        { text: data.L, correct: data.M, label: 'D' }, // Option D
        { text: data.N, correct: data.O, label: 'E' }, // Option E
        { text: data.P, correct: data.Q, label: 'F' }, // Option F
        { text: data.R, correct: data.S, label: 'G' }, // Option G
        { text: data.T, correct: data.U, label: 'H' }, // Option H
      ].filter((opt) => opt.text && opt.text.trim() !== '');

      if (optionsData.length === 0) {
        errors.push('Multiple choice questions must have at least one option');
      }

      // Validate at least one correct answer (after normalization, only 'true' or 'false' or '')
      const hasCorrectAnswer = optionsData.some(
        (opt) => opt.correct === 'true'
      );

      if (!hasCorrectAnswer) {
        errors.push('Multiple choice questions must have at least one correct answer');
      }

      // Validate checkbox values (after normalization, should only be 'true', 'false', or '')
      optionsData.forEach((opt) => {
        if (opt.correct && !['true', 'false', ''].includes(opt.correct)) {
          errors.push(`Invalid checkbox value for option ${opt.label}. Must be true/false or 1/0 (got: "${opt.correct}")`);
        }
      });
    }

    // Validate boolean fields (after normalization, should only be 'true', 'false', or '')
    if (data.is_multiple_answer && !['true', 'false', ''].includes(data.is_multiple_answer)) {
      errors.push(`is_multiple_answer must be "true" or "false" (got: "${data.is_multiple_answer}")`);
    }

    if (data.is_public && !['true', 'false', ''].includes(data.is_public)) {
      errors.push(`is_public must be "true" or "false" (got: "${data.is_public}")`);
    }

    return errors;
  }
}
