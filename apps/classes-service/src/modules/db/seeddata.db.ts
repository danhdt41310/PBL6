import { Inject } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { Class, ClassEnrollment, ClassTeacher, Material, Post, FileType } from "@prisma/classes-client"

export class SeedData{
    constructor (@Inject(PrismaService) private readonly prisma: PrismaService ){}


    async seed(){
        const classInfo: any = {
            class_code: 'ab@9T',
            class_name: 'Mockup Class',
            description: 'Class mockup for test only',
            teacher_id: 19,
        }

        this.prisma.class.create({
            data: classInfo
        })
    }
}