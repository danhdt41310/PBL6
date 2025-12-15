import { Injectable } from '@nestjs/common';
import * as XLSX from 'xlsx';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';
import { QuestionsService } from './questions.service';
import { QuestionFilterDto } from './dto/question.dto';

interface QuestionOption {
  id: number;
  text: string;
}

@Injectable()
export class QuestionsExportService {
  constructor(private readonly questionsService: QuestionsService) {}

  /**
   * Export questions to Excel format
   */
  async exportToExcel(filterDto: QuestionFilterDto): Promise<Buffer> {
    // Remove pagination to export ALL questions by setting a very large limit
    const exportFilter = {
      ...filterDto,
      page: 1,
      limit: 999999, // Large number to get all questions
    }
    
    const { data: questions } = await this.questionsService.findAllQuestions(exportFilter);

    // Prepare data using the SAME structure as import template
    // Structure: A-E (basic info), F-U (8 option pairs: text + checkbox), V (is_public)
    const excelData = [
      // Row 1: Title
      ['Import Questions Via Excel', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
      
      // Row 2: Headers (match import template exactly)
      [
        'content', 'type', 'category_name', 'difficulty', 'is_multiple_answer',
        'A', 'A_correct', 'B', 'B_correct', 'C', 'C_correct', 'D', 'D_correct',
        'E', 'E_correct', 'F', 'F_correct', 'G', 'G_correct', 'H', 'H_correct',
        'is_public'
      ],
      
      // Row 3: Descriptions
      [
        'Question content (required)',
        'multiple_choice or essay (required)',
        'Category name (optional)',
        'easy, medium, or hard (optional)',
        'true or false (optional)',
        'Option A text', 'A correct? (true/false)', 
        'Option B text', 'B correct? (true/false)', 
        'Option C text', 'C correct? (true/false)', 
        'Option D text', 'D correct? (true/false)',
        'Option E text', 'E correct? (true/false)', 
        'Option F text', 'F correct? (true/false)', 
        'Option G text', 'G correct? (true/false)', 
        'Option H text', 'H correct? (true/false)',
        'Public? (true/false)'
      ]
    ];

    // Add question data rows
    questions.forEach((question) => {
      const row: any[] = [
        question.content, // A - content
        question.type, // B - type
        question.category?.name || '', // C - category_name
        question.difficulty || 'medium', // D - difficulty
        question.is_multiple_answer ? 'true' : 'false', // E - is_multiple_answer
      ];

      // Add 8 option pairs (F-U)
      if (question.type === 'multiple_choice' && question.options) {
        const options = question.options as unknown as QuestionOption[];
        
        // Process up to 8 options (A-H)
        for (let i = 0; i < 8; i++) {
          if (i < options.length) {
            const opt = options[i];
            const isCorrect = opt.text.startsWith('=');
            const text = opt.text.substring(1); // Remove prefix
            row.push(text); // Option text
            row.push(isCorrect ? 'true' : 'false'); // Correct checkbox
          } else {
            row.push(''); // Empty option text
            row.push(''); // Empty checkbox
          }
        }
      } else {
        // Essay question - add 16 empty columns for options
        for (let i = 0; i < 16; i++) {
          row.push('');
        }
      }

      // Add is_public (V)
      row.push(question.is_public ? 'true' : 'false');

      excelData.push(row);
    });

    // Create workbook with array of arrays
    const worksheet = XLSX.utils.aoa_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Main');

    // Set column widths to match template
    worksheet['!cols'] = [
      { wch: 50 },  // A - content
      { wch: 15 },  // B - type
      { wch: 15 },  // C - category_name
      { wch: 12 },  // D - difficulty
      { wch: 18 },  // E - is_multiple_answer
      { wch: 15 },  // F - Option A text
      { wch: 10 },  // G - Option A checkbox
      { wch: 15 },  // H - Option B text
      { wch: 10 },  // I - Option B checkbox
      { wch: 15 },  // J - Option C text
      { wch: 10 },  // K - Option C checkbox
      { wch: 15 },  // L - Option D text
      { wch: 10 },  // M - Option D checkbox
      { wch: 15 },  // N - Option E text
      { wch: 10 },  // O - Option E checkbox
      { wch: 15 },  // P - Option F text
      { wch: 10 },  // Q - Option F checkbox
      { wch: 15 },  // R - Option G text
      { wch: 10 },  // S - Option G checkbox
      { wch: 15 },  // T - Option H text
      { wch: 10 },  // U - Option H checkbox
      { wch: 12 },  // V - is_public
    ];

    // Write to buffer
    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  }

  /**
   * Export questions to plain text format
   */
  async exportToText(filterDto: QuestionFilterDto): Promise<string> {
    // Remove pagination to export ALL questions by setting a very large limit
    const exportFilter = {
      ...filterDto,
      page: 1,
      limit: 999999, // Large number to get all questions
    }
    
    const { data: questions } = await this.questionsService.findAllQuestions(exportFilter);

    let text = '='.repeat(80) + '\n';
    text += 'QUESTIONS EXPORT\n';
    text += `Generated: ${new Date().toLocaleString()}\n`;
    text += `Total Questions: ${questions.length}\n`;
    text += '='.repeat(80) + '\n\n';

    questions.forEach((question, index) => {
      text += `${index + 1}. ${question.content}\n`;
      text += `-`.repeat(80) + '\n';
      text += `Type: ${question.type === 'multiple_choice' ? 'Multiple Choice' : 'Essay'}\n`;
      text += `Category: ${question.category?.name || 'N/A'}\n`;
      text += `Difficulty: ${question.difficulty}\n`;
      text += `Multiple Answer: ${question.is_multiple_answer ? 'Yes' : 'No'}\n`;
      text += `Public: ${question.is_public ? 'Yes' : 'No'}\n`;

      if (question.type === 'multiple_choice' && question.options) {
        text += '\nOptions:\n';
        const options = question.options as unknown as QuestionOption[];
        options.forEach((opt) => {
          const isCorrect = opt.text.startsWith('=');
          const optText = opt.text.substring(1);
          const label = String.fromCharCode(64 + opt.id); // A, B, C...
          text += `  ${label}. ${optText} ${isCorrect ? '✓' : ''}\n`;
        });
      }

      text += '\n' + '='.repeat(80) + '\n\n';
    });

    return text;
  }

  /**
   * Export questions to Word (DOCX) format
   */
  async exportToDocx(filterDto: QuestionFilterDto): Promise<Buffer> {
    // Remove pagination to export ALL questions by setting a very large limit
    const exportFilter = {
      ...filterDto,
      page: 1,
      limit: 999999, // Large number to get all questions
    }
    
    const { data: questions } = await this.questionsService.findAllQuestions(exportFilter);

    const children: Paragraph[] = [];

    // Title
    children.push(
      new Paragraph({
        text: 'QUESTIONS EXPORT',
        heading: HeadingLevel.HEADING_1,
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
      }),
    );

    // Metadata
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `Generated: ${new Date().toLocaleString()}`,
            size: 20,
          }),
        ],
        spacing: { after: 100 },
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: `Total Questions: ${questions.length}`,
            size: 20,
          }),
        ],
        spacing: { after: 400 },
      }),
    );

    // Questions
    questions.forEach((question, index) => {
      // Question number and content
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `${index + 1}. `,
              bold: true,
              size: 24,
            }),
            new TextRun({
              text: question.content,
              size: 24,
            }),
          ],
          spacing: { after: 200 },
        }),
      );

      // Question metadata
      const metadata = [
        `Type: ${question.type === 'multiple_choice' ? 'Multiple Choice' : 'Essay'}`,
        `Category: ${question.category?.name || 'N/A'}`,
        `Difficulty: ${question.difficulty}`,
        `Multiple Answer: ${question.is_multiple_answer ? 'Yes' : 'No'}`,
        `Public: ${question.is_public ? 'Yes' : 'No'}`,
      ];

      metadata.forEach((meta) => {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: meta,
                size: 20,
              }),
            ],
            spacing: { after: 100 },
          }),
        );
      });

      // Options for multiple choice
      if (question.type === 'multiple_choice' && question.options) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: 'Options:',
                bold: true,
                size: 20,
              }),
            ],
            spacing: { before: 100, after: 100 },
          }),
        );

        const options = question.options as unknown as QuestionOption[];
        options.forEach((opt) => {
          const isCorrect = opt.text.startsWith('=');
          const optText = opt.text.substring(1);
          const label = String.fromCharCode(64 + opt.id);

          children.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: `${label}. ${optText}`,
                  size: 20,
                }),
                ...(isCorrect
                  ? [
                      new TextRun({
                        text: ' ✓',
                        bold: true,
                        color: '00AA00',
                        size: 20,
                      }),
                    ]
                  : []),
              ],
              spacing: { after: 80 },
            }),
          );
        });
      }

      // Separator
      children.push(
        new Paragraph({
          text: '',
          spacing: { after: 400 },
        }),
      );
    });

    // Create document
    const doc = new Document({
      sections: [
        {
          properties: {},
          children,
        },
      ],
    });

    // Generate buffer
    return Packer.toBuffer(doc);
  }
}
