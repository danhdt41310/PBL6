import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AddStudentsDto, CreateClassDto, UpdateClassDto } from '../dto/class.dto';
import { UserInfoDto } from '../dto/user.dto';
import { ClassMapper } from '../mapper/classEnrollment.mapper';

@Injectable()
export class ClassesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createClassDto: CreateClassDto) {
    try {
      const newClass = await this.prisma.class.create({
        data: {
          class_name: createClassDto.class_name,
          class_code: createClassDto.class_code,
          description: createClassDto.description,
          teacher_id: createClassDto.teacher_id,
        },
        include: {
          posts: true,
          enrollments: true,
          teachers: true,
        },
      });

      return {
        success: true,
        data: newClass,
      };
    } catch (error) {
      if (error.code === 'P2002') {
        return {
          success: false,
          error: 'DUPLICATE_CLASS_CODE',
        };
      }
      
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async findAll() {
    return this.prisma.class.findMany({
      include: {
        posts: true,
        enrollments: true,
        teachers: true,
      },
    });
  }

  async findOne(class_id: number) {
    const classItem = await this.prisma.class.findUnique({
      where: { class_id },
      include: {
        posts: true,
        enrollments: true,
        teachers: true,
      }
    });

    if (!classItem) {
      throw new NotFoundException(`Class with ID ${class_id} not found`);
    }

    return classItem;
  }

  async update(class_id: number, updateClassDto: UpdateClassDto) {
    try {
      const existingClass = await this.prisma.class.findUnique({
        where: { class_id } 
      });

      if (!existingClass) {
        throw new NotFoundException(`Class with ID ${class_id} not found`);
      }

      if (updateClassDto.class_code && updateClassDto.class_code !== existingClass.class_code) {
        const existingCodeClass = await this.prisma.class.findUnique({
          where: { class_code: updateClassDto.class_code }
        });

        if (existingCodeClass) {
          throw new BadRequestException('Class code already exists');
        }
      }

      const updatedClass = await this.prisma.class.update({
        where: { class_id }, 
        data: updateClassDto,
        include: {
          posts: true,
          enrollments: true,
          teachers: true,
        }
      });

      return {
        success: true,
        data: updatedClass,
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to update class');
    }
  }

  async remove(class_id: number) {
    try {
      const existingClass = await this.prisma.class.findUnique({
        where: { class_id } 
      });

      if (!existingClass) {
        throw new NotFoundException(`Class with ID ${class_id} not found`);
      }

      await this.prisma.classEnrollment.deleteMany({
        where: { class_id }
      });

      await this.prisma.class.delete({
        where: { class_id } 
      });

      return { 
        success: true,
        message: `Class with ID ${class_id} has been deleted successfully` 
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to delete class');
    }
  }

  async addStudents(addStudentsDto: AddStudentsDto){
    var records = []
    for (let stu of addStudentsDto.students){
      records.push({
        class_id: addStudentsDto.class_id,
        student_id: stu.id,
      })
    }
    var enrolls = await this.prisma.classEnrollment.createManyAndReturn({
      data: records
    })
    return ClassMapper.toAddManyStudentsToClassResponseDto(enrolls);
  }

  async addStudentClassCode(user_id: number, class_code: string){
    const _class = await this.prisma.class.findUnique({
      where: { class_code },
    });
    
    if (!_class) return null;
    
    const classEnroll = await this.prisma.classEnrollment.create({
      data: {
        class_id: _class.class_id, 
        student_id: user_id,
      }
    });
    
    return ClassMapper.toAddOneStudentToClassResponseDto(classEnroll); 
  }

  async removeStudent(class_id: number, user_id: number) {
    try {
      const enrollment = await this.prisma.classEnrollment.findFirst({
        where: {
          class_id,
          student_id: user_id 
        }
      });

      if (!enrollment) {
        throw new NotFoundException('Student enrollment not found in this class');
      }

      await this.prisma.classEnrollment.delete({
        where: {
          enrollment_id: enrollment.enrollment_id 
        }
      });

      return { 
        success: true,
        message: 'Student removed from class successfully' 
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to remove student from class');
    }
  }
}