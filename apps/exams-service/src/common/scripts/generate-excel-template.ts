import * as XLSX from 'xlsx';
import * as path from 'path';
import * as fs from 'fs';

/**
 * Generate Excel Template for Question Import
 */
function generateExcelTemplate() {
  // Create workbook
  const workbook = XLSX.utils.book_new();

  // ============================================================
  // Main Sheet - Where teachers enter questions
  // ============================================================
  const mainData = [
    // Row 1: Title
    ['TEMPLATE IMPORT QUESTIONS', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
    
    // Row 2: Headers
    [
      'content', 'type', 'category_name', 'difficulty', 'is_multiple_answer',
      'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J',
      'correct_answers', 'is_public', 'options_json', 'status'
    ],
    
    // Row 3: Notes
    [
      'Nội dung câu hỏi (required)',
      'multiple_choice/essay (required)',
      'Tên danh mục (optional)',
      'easy/medium/hard (optional)',
      'true/false (optional)',
      'Đáp án A', 'Đáp án B', 'Đáp án C', 'Đáp án D', 'Đáp án E',
      'Đáp án F', 'Đáp án G', 'Đáp án H', 'Đáp án I', 'Đáp án J',
      'Đáp án đúng (vd: 1,2,3) (required for multiple_choice)',
      'true/false (optional)',
      'Bỏ qua',
      'Kiểm lỗi (auto)'
    ],
    
    // Row 4: Example 1 - Multiple choice with single answer
    [
      'Is OOP a language?',
      'multiple_choice',
      'OOP',
      'easy',
      'false',
      'YES', 'NO', 'MAYBE', 'ALL', '',
      '', '', '', '', '',
      '2',
      'false',
      '',
      ''
    ],
    
    // Row 5: Example 2 - Multiple choice with multiple answers
    [
      'Which of the following are programming languages?',
      'multiple_choice',
      'Programming',
      'medium',
      'true',
      'Python', 'HTML', 'JavaScript', 'CSS', 'Java',
      'SQL', '', '', '', '',
      '1,3,5',
      'true',
      '',
      ''
    ],
    
    // Row 6: Example 3 - Essay question
    [
      'Explain the concept of inheritance in OOP',
      'essay',
      'OOP',
      'hard',
      'false',
      '', '', '', '', '',
      '', '', '', '', '',
      '',
      'false',
      '',
      ''
    ],
  ];

  const mainSheet = XLSX.utils.aoa_to_sheet(mainData);

  // Set column widths
  mainSheet['!cols'] = [
    { wch: 50 },  // content
    { wch: 15 },  // type
    { wch: 15 },  // category_name
    { wch: 12 },  // difficulty
    { wch: 18 },  // is_multiple_answer
    { wch: 15 },  // A
    { wch: 15 },  // B
    { wch: 15 },  // C
    { wch: 15 },  // D
    { wch: 15 },  // E
    { wch: 15 },  // F
    { wch: 15 },  // G
    { wch: 15 },  // H
    { wch: 15 },  // I
    { wch: 15 },  // J
    { wch: 20 },  // correct_answers
    { wch: 12 },  // is_public
    { wch: 12 },  // options_json
    { wch: 20 },  // status
  ];

  // ============================================================
  // Lists Sheet - Data validation lists
  // ============================================================
  const listsData = [
    ['TYPE', 'DIFFICULTY', 'BOOLEAN'],
    ['multiple_choice', 'easy', 'true'],
    ['essay', 'medium', 'false'],
    ['', 'hard', ''],
  ];

  const listsSheet = XLSX.utils.aoa_to_sheet(listsData);
  listsSheet['!cols'] = [
    { wch: 20 },
    { wch: 15 },
    { wch: 10 },
  ];

  // Add sheets to workbook
  XLSX.utils.book_append_sheet(workbook, mainSheet, 'Main');
  XLSX.utils.book_append_sheet(workbook, listsSheet, 'Lists');

  // Save file
  const outputDir = path.join(__dirname, '..', '..', '..', '..', 'templates', 'excels');
  
  // Create directory if not exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = path.join(outputDir, 'TemplateImportQuestions.xlsx');
  XLSX.writeFile(workbook, outputPath);

  console.log('Excel template generated successfully!');
  console.log(`Location: ${outputPath}`);
}

// Run the script
generateExcelTemplate();
