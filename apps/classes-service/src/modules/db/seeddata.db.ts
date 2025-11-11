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


        const classInfo: any = {
            class_code: 'AB9T',
            class_name: 'Mockup Class',
            description: 'Class mockup for test only',
            teacher_id: 19,
        }

        const createdClass = await this.prisma.class.create({ data: classInfo })

        // create an additional teacher relation (class_teacher table)
        await this.prisma.classTeacher.create({
            data: {
                class_id: createdClass.class_id,
                teacher_id: classInfo.teacher_id,
            },
        })

        // Add a few enrollments (students are references by id)
        const enrollments = [21, 22, 23].map((studentId) => ({
            class_id: createdClass.class_id,
            student_id: studentId,
        }))

        for (const e of enrollments) {
            await this.prisma.classEnrollment.create({ data: e })
        }

        // Create a main post and a reply
        const mainPost = await this.prisma.post.create({
            data: {
                class_id: createdClass.class_id,
                parent_id: null,
                title: 'Welcome to the Mockup Class',
                message: 'This is a seeded welcome post for testing.',
                sender_id: classInfo.teacher_id,
            },
        })

        const replyPost = await this.prisma.post.create({
            data: {
                class_id: createdClass.class_id,
                parent_id: mainPost.id,
                title: null,
                message: 'Thanks! Excited to be here.',
                sender_id: enrollments[0].student_id,
            },
        })

        // Attach materials to the main post
        await this.prisma.material.createMany({
            data: [
                {
                    post_id: mainPost.id,
                    title: 'Syllabus.pdf',
                    file_url: 'https://example.com/files/syllabus.pdf',
                    uploaded_by: classInfo.teacher_id,
                    type: FileType.document,
                    file_size: 1024,
                },
                {
                    post_id: mainPost.id,
                    title: 'Intro.png',
                    file_url: 'https://example.com/files/intro.png',
                    uploaded_by: classInfo.teacher_id,
                    type: FileType.image,
                    file_size: 2048,
                },
            ],
        })

        console.log(`Seeded class ${createdClass.class_id} (${createdClass.class_name})`)
    }
}


// Run for seeding data
const prisma = new PrismaService()
const seeder = new SeedData(prisma)
seeder.seed()