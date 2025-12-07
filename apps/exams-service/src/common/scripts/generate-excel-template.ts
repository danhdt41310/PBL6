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
  // Structure: 8 pairs of (option_text, checkbox)
  // A-E: Basic info
  // F-G: Option A (text, checkbox)
  // H-I: Option B (text, checkbox)
  // J-K: Option C (text, checkbox)
  // L-M: Option D (text, checkbox)
  // N-O: Option E (text, checkbox)
  // P-Q: Option F (text, checkbox)
  // R-S: Option G (text, checkbox)
  // T-U: Option H (text, checkbox)
  // V: is_public
  // W: options_json (auto-filled)
  // X: status (error messages, auto-filled)
  // ============================================================
  const mainData = [
    // Row 1: Title
    ['Import Questions Via Excel', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
    
    // Row 2: Headers
    [
      'content', 'type', 'category_name', 'difficulty', 'is_multiple_answer',
      'A', 'A_correct', 'B', 'B_correct', 'C', 'C_correct', 'D', 'D_correct',
      'E', 'E_correct', 'F', 'F_correct', 'G', 'G_correct', 'H', 'H_correct',
      'is_public', 'options_json', 'status'
    ],
    
    // Row 3: Notes/Descriptions
    [
      'Question content (required)',
      'multiple_choice or essay (required)',
      'Category name (optional, auto-create if new)',
      'easy, medium, or hard (optional, default: medium)',
      'TRUE or FALSE (optional, default: FALSE)',
      'Option A text', 'TRUE or FALSE (leave empty = FALSE)', 
      'Option B text', 'TRUE or FALSE (leave empty = FALSE)', 
      'Option C text', 'TRUE or FALSE (leave empty = FALSE)', 
      'Option D text', 'TRUE or FALSE (leave empty = FALSE)',
      'Option E text', 'TRUE or FALSE (leave empty = FALSE)', 
      'Option F text', 'TRUE or FALSE (leave empty = FALSE)', 
      'Option G text', 'TRUE or FALSE (leave empty = FALSE)', 
      'Option H text', 'TRUE or FALSE (leave empty = FALSE)',
      'TRUE or FALSE (optional)',
      'Auto-filled, ignore',
      'Error messages (auto-filled)'
    ],
    
    // Row 4: Example 1 - Multiple choice with single answer
    [
      'Is OOP a language?',
      'multiple_choice',
      'OOP',
      'easy',
      false,
      'YES', false,
      'NO', true,
      'MAYBE', false,
      'ALL', false,
      '', '', '', '', '', '', '', '',
      false,
      '',
      ''
    ],
    
    // Row 5: Example 2 - Multiple choice with multiple answers
    [
      'Which of the following are programming languages?',
      'multiple_choice',
      'Programming',
      'medium',
      true,
      'Python', true,
      'HTML', false,
      'JavaScript', true,
      'CSS', false,
      'Java', true,
      'SQL', false,
      '', '', '', '',
      true,
      '',
      ''
    ],
    
    // Row 6: Example 3 - Essay question
    [
      'Explain the concept of inheritance in OOP',
      'essay',
      'OOP',
      'hard',
      false,
      '', '', '', '', '', '', '', '',
      '', '', '', '', '', '', '', '',
      false,
      '',
      ''
    ],
  ];

  const mainSheet = XLSX.utils.aoa_to_sheet(mainData);

  // Set column widths
  mainSheet['!cols'] = [
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
    { wch: 12 },  // W - options_json
    { wch: 30 },  // X - status
  ];

  // ============================================================
  // Lists Sheet - Data validation lists
  // ============================================================
  const listsData = [
    ['type', 'difficulty', 'boolean'],
    ['multiple_choice', 'easy', true],
    ['essay', 'medium', false],
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
  const outputDir = path.join(__dirname, '..', '..', '..', '..', '..', 'templates', 'excels');
  
  // Create directory if not exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = path.join(outputDir, 'TemplateImportQuestions.xlsx');
  XLSX.writeFile(workbook, outputPath);

  console.log('✅ Excel template generated successfully!');
  console.log(`📁 Location: ${outputPath}`);
  console.log('\n📝 Template structure:');
  console.log('   - Columns A-E: Basic question info');
  console.log('   - Columns F-U: 8 pairs of (option_text, checkbox)');
  console.log('   - Column V: is_public');
  console.log('   - Column W-X: Auto-filled fields (options_json, status)');
}

// Run the script
generateExcelTemplate();
