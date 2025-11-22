import { PrismaService } from "../../prisma/prisma.service";
import { Class, ClassEnrollment, ClassTeacher, Material, Post, FileType } from "@prisma/classes-client"

export class SeedData{
    constructor (private readonly prisma: PrismaService ){}

    async clearAll(){
        // Use a transaction and await each delete to ensure idempotency
        await this.prisma.$transaction([
            // delete materials first (depends on posts)
            this.prisma.material.deleteMany({ where: {} }),
            // delete replies (posts with parent_id)
            this.prisma.post.deleteMany({ where: { parent_id: { not: null } } }),
            // delete remaining posts
            this.prisma.post.deleteMany({ where: {} }),
            // delete class-teacher relations
            this.prisma.classTeacher.deleteMany({ where: {} }),
            // delete enrollments
            this.prisma.classEnrollment.deleteMany({ where: {} }),
            // delete classes
            this.prisma.class.deleteMany({ where: {} }),
        ])


    }

    async seed(){

        // Clear existing seeded data first
        await this.clearAll()

        // Define multiple classes with different teachers and students
        const classesData = [
            {
                class_code: 'MATH101',
                class_name: 'Mathematics Fundamentals',
                description: 'Introduction to basic mathematical concepts',
                teacher_id: 19,
                student_id: 10
            },
            {
                class_code: 'ENG102',
                class_name: 'English Literature',
                description: 'Study of classic and modern literature',
                teacher_id: 20,
                student_id: 11
            },
            {
                class_code: 'SCI103',
                class_name: 'General Science',
                description: 'Basic principles of physics, chemistry, and biology',
                teacher_id: 21,
                student_id: 10
            },
            {
                class_code: 'HIST104',
                class_name: 'World History',
                description: 'Comprehensive study of world historical events',
                teacher_id: 22,
                student_id: 11
            },
            {
                class_code: 'CS105',
                class_name: 'Computer Science Basics',
                description: 'Introduction to programming and computer concepts',
                teacher_id: 23,
                student_id: 10
            }
        ];

        // Create classes
        const classInfo = classesData.map(classData => ({
            class_code: classData.class_code,
            class_name: classData.class_name,
            description: classData.description,
            teacher_id: classData.teacher_id,
        }));

        const createdClasses = await this.prisma.class.createManyAndReturn({ data: classInfo });

        // Create class-teacher relations
        await this.prisma.classTeacher.createMany({
            data: createdClasses.map((createdClass, index) => ({
                class_id: createdClass.class_id,
                teacher_id: classesData[index].teacher_id,
            })),
        });

        // Create class enrollments (1 student per class)
        const enrollments = createdClasses.map((createdClass, index) => ({
            class_id: createdClass.class_id,
            student_id: classesData[index].student_id,
        }));

        for (const enrollment of enrollments) {
            await this.prisma.classEnrollment.create({ data: enrollment });
        }

        // Create posts and materials for each class
        for (let i = 0; i < createdClasses.length; i++) {
            const createdClass = createdClasses[i];
            const classData = classesData[i];

            // Create a welcome post for each class
            const mainPost = await this.prisma.post.create({
                data: {
                    class_id: createdClass.class_id,
                    parent_id: null,
                    title: `Welcome to ${createdClass.class_name}`,
                    message: `This is a welcome post for ${createdClass.class_name}. Let's start our learning journey!`,
                    sender_id: classData.teacher_id
                },
            });

            // Create a reply from the student
            const replyPost = await this.prisma.post.create({
                data: {
                    class_id: createdClass.class_id,
                    parent_id: mainPost.id,
                    title: null,
                    message: `Thank you for the welcome! I'm excited to learn ${createdClass.class_name}.`,
                    sender_id: classData.student_id,
                },
            });

            // Attach materials to the main post
            await this.prisma.material.createMany({
                data: [
                    {
                        post_id: mainPost.id,
                        title: `${createdClass.class_name}_Syllabus.pdf`,
                        file_url: `https://example.com/files/${createdClass.class_code.toLowerCase()}_syllabus.pdf`,
                        uploaded_by: classData.teacher_id,
                        type: FileType.document,
                        file_size: 1024 + (i * 100), // Vary file sizes
                    },
                    {
                        post_id: mainPost.id,
                        title: `${createdClass.class_name}_Introduction.png`,
                        file_url: `https://example.com/files/${createdClass.class_code.toLowerCase()}_intro.png`,
                        uploaded_by: classData.teacher_id,
                        type: FileType.image,
                        file_size: 2048 + (i * 200), // Vary file sizes
                    },
                ],
            });

            console.log(`Seeded class ${createdClass.class_id} (${createdClass.class_name}) with teacher ${classData.teacher_id} and student ${classData.student_id}`);
        }

        console.log(`Successfully seeded ${createdClasses.length} classes with their respective teachers and students.`);
    }
}


// Run for seeding data
const prisma = new PrismaService()
const seeder = new SeedData(prisma)
seeder.seed()