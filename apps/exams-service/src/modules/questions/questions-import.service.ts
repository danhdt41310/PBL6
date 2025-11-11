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

      // Parse rows
      const preview = dataRows
        .slice(0, limit)
        .map((row) => this.parseExcelRow(row))
        .filter((row) => row.content && row.content.trim() !== '');

      return {
        total: dataRows.length,
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

      // Parse all rows
      const parsedRows = dataRows
        .map((row, index) => ({
          rowNumber: index + 4, // +4 because of skipped rows
          data: this.parseExcelRow(row),
        }))
        .filter((item) => item.data.content && item.data.content.trim() !== '');

      // Import within transaction
      await this.transactionService.runTransaction(async (tx) => {
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

            // Create or find category
            let categoryId: number | null = null;
            if (data.category_name && data.category_name.trim() !== '') {
              const category = await tx.questionCategory.upsert({
                where: { name: data.category_name.trim() },
                update: {},
                create: { name: data.category_name.trim() },
              });
              categoryId = category.category_id;
            }

            // Build options JSON
            let options = null;
            if (data.type === 'multiple_choice') {
              const optionTexts = [
                data.F,
                data.G,
                data.H,
                data.I,
                data.J,
                data.K,
                data.L,
                data.M,
                data.N,
                data.O,
              ].filter((text) => text && text.trim() !== '');

              if (optionTexts.length === 0) {
                errors.push({
                  row: rowNumber,
                  content: data.content,
                  errors: ['Multiple choice question must have at least one option'],
                });
                failed++;
                continue;
              }

              // Parse correct answers
              const correctAnswers = (data.correct_answers || '')
                .split(',')
                .map((a) => parseInt(a.trim()))
                .filter((a) => !isNaN(a) && a > 0);

              options = {
                answers: optionTexts.map((text, index) => ({
                  id: index + 1, // Use number instead of letter
                  text: text.trim(),
                  is_correct: correctAnswers.includes(index + 1),
                })),
              };
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
   * Parse Excel row to question data
   */
  private parseExcelRow(row: any): ExcelQuestionRow {
    return {
      content: row.A || '',
      type: row.B || '',
      category_name: row.C || '',
      difficulty: row.D || '',
      is_multiple_answer: row.E || '',
      F: row.F || '',
      G: row.G || '',
      H: row.H || '',
      I: row.I || '',
      J: row.J || '',
      K: row.K || '',
      L: row.L || '',
      M: row.M || '',
      N: row.N || '',
      O: row.O || '',
      correct_answers: row.P || '',
      is_public: row.Q || '',
      options_json: row.R || '',
      status: row.S || '',
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
      const optionTexts = [
        data.F,
        data.G,
        data.H,
        data.I,
        data.J,
        data.K,
        data.L,
        data.M,
        data.N,
        data.O,
      ].filter((text) => text && text.trim() !== '');

      if (optionTexts.length === 0) {
        errors.push('Multiple choice questions must have at least one option');
      }

      // Validate correct answers
      if (!data.correct_answers || data.correct_answers.trim() === '') {
        errors.push('Correct answers are required for multiple choice questions');
      } else {
        const correctAnswers = data.correct_answers
          .split(',')
          .map((a) => parseInt(a.trim()))
          .filter((a) => !isNaN(a));

        if (correctAnswers.length === 0) {
          errors.push('Invalid correct answers format. Use numbers separated by commas (e.g., 1,2,3)');
        }

        // Check if correct answers are within range
        correctAnswers.forEach((answer) => {
          if (answer < 1 || answer > optionTexts.length) {
            errors.push(`Correct answer ${answer} is out of range (1-${optionTexts.length})`);
          }
        });
      }
    }

    // Validate boolean fields
    if (data.is_multiple_answer && !['true', 'false', ''].includes(data.is_multiple_answer)) {
      errors.push('is_multiple_answer must be "true" or "false"');
    }

    if (data.is_public && !['true', 'false', ''].includes(data.is_public)) {
      errors.push('is_public must be "true" or "false"');
    }

    return errors;
  }
}
