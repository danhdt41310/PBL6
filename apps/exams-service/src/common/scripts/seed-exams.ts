import { PrismaClient } from '@prisma/exams-client';
import { ExamStatus } from '../../modules/exams/dto/create-exam.dto';

const prisma = new PrismaClient();

async function seedExams() {
  try {
    console.log('🚀 Starting exam seeding process...');

    // Create simple exams for specified class IDs (22, 24, 26) - 2 exams each
    const examsData = [
      // Class 22
      {
        class_id: 22,
        title: 'Exam 1 for Class 22',
        start_time: new Date('2025-12-01T09:00:00Z'),
        end_time: new Date('2025-12-01T11:00:00Z'),
        total_time: 120,
        description: 'First exam for class 22',
        status: ExamStatus.PUBLISHED,
        created_by: 19,
      },
      {
        class_id: 22,
        title: 'Exam 2 for Class 22',
        start_time: new Date('2025-12-15T14:00:00Z'),
        end_time: new Date('2025-12-15T17:00:00Z'),
        total_time: 180,
        description: 'Second exam for class 22',
        status: ExamStatus.DRAFT,
        created_by: 19,
      },
      // Class 24
      {
        class_id: 24,
        title: 'Exam 1 for Class 24',
        start_time: new Date('2025-11-28T10:00:00Z'),
        end_time: new Date('2025-11-28T12:00:00Z'),
        total_time: 120,
        description: 'First exam for class 24',
        status: ExamStatus.PUBLISHED,
        created_by: 21,
      },
      {
        class_id: 24,
        title: 'Exam 2 for Class 24',
        start_time: new Date('2025-12-10T13:00:00Z'),
        end_time: new Date('2025-12-10T16:00:00Z'),
        total_time: 180,
        description: 'Second exam for class 24',
        status: ExamStatus.PUBLISHED,
        created_by: 21,
      },
      // Class 26
      {
        class_id: 26,
        title: 'Exam 1 for Class 26',
        start_time: new Date('2025-11-30T09:30:00Z'),
        end_time: new Date('2025-11-30T11:30:00Z'),
        total_time: 120,
        description: 'First exam for class 26',
        status: ExamStatus.PUBLISHED,
        created_by: 23,
      },
      {
        class_id: 26,
        title: 'Exam 2 for Class 26',
        start_time: new Date('2025-12-12T08:00:00Z'),
        end_time: new Date('2025-12-12T11:00:00Z'),
        total_time: 180,
        description: 'Second exam for class 26',
        status: ExamStatus.DRAFT,
        created_by: 23,
      }
    ];

    console.log('📝 Creating exams...');
    const createdExams = [];
    
    for (const examData of examsData) {
      const exam = await prisma.exam.create({
        data: examData
      });
      
      createdExams.push(exam);
      console.log(`✅ Created exam: ${exam.title} (ID: ${exam.exam_id})`);
    }

    console.log('\n🎉 Exam seeding completed successfully!');
    console.log(`📝 Total exams created: ${createdExams.length}`);
    console.log('📋 Exams by class:');
    console.log(`   🏫 Class 22: ${createdExams.filter(e => e.class_id === 22).length} exams`);
    console.log(`   🏫 Class 24: ${createdExams.filter(e => e.class_id === 24).length} exams`);
    console.log(`   🏫 Class 26: ${createdExams.filter(e => e.class_id === 26).length} exams`);

  } catch (error) {
    console.error('❌ Error seeding exams:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Execute seeding if run directly
if (require.main === module) {
  seedExams()
    .catch((error) => {
      console.error('💥 Seeding failed:', error);
      process.exit(1);
    });
}

export default seedExams;
