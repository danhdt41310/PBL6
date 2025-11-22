import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import {
  AddStudentsDto,
  CreateClassDto,
  UpdateClassDto,
} from "../dto/class.dto";
import { ClassMapper } from "../mapper/class.mapper";
import { ClassEnrollmentMapper } from "../mapper/classEnrollment.mapper";
import { promises as fs } from "fs";
import { join } from "path";
import { FileHelper } from "../utils/FileHelper.utils";
import { FileInfo } from "../dto/material-response.dto";
import { MaterialMapper } from "../mapper/meterials.mapper";
@Injectable()
export class ClassesService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly UPLOAD_DIR = "";

  async create(createClassDto: CreateClassDto) {
    try {
      const newClass = await this.prisma.class.create({
        data: {
          class_name: createClassDto.class_name,
          class_code: createClassDto.class_code,
          description: createClassDto.description,
          teacher_id: createClassDto.teacher_id,
        },
      });

      return ClassMapper.toCreateClassResponseDto(newClass);
    } catch (error) {
      if (error.code === "P2002") {
        return ClassMapper.toErrorResponseDto("DUPLICATE_CLASS_CODE");
      }

      return ClassMapper.toErrorResponseDto(error.message);
    }
  }

  async findAll() {
    const classes = await this.prisma.class.findMany({
      include: {
        posts: true,
        enrollments: true,
        teachers: true,
      },
    });

    return ClassMapper.toClassListResponseDto(classes);
  }

  async findOne(class_id: number) {
    const classItem = await this.prisma.class.findUnique({
      where: { class_id },
      include: {
        posts: {
          include: {
            materials: true,
            replies: {
              include: {
                materials: true,
              },
            },
          },
        },
        enrollments: true,
        teachers: true,
      },
    });

    if (!classItem) {
      throw new NotFoundException(`Class with ID ${class_id} not found`);
    }

    return ClassMapper.toResponseAllInfoDto(classItem);
  }

  async update(class_id: number, updateClassDto: UpdateClassDto) {
    try {
      const existingClass = await this.prisma.class.findUnique({
        where: { class_id },
      });

      if (!existingClass) {
        throw new NotFoundException(`Class with ID ${class_id} not found`);
      }

      if (
        updateClassDto.class_code &&
        updateClassDto.class_code !== existingClass.class_code
      ) {
        const existingCodeClass = await this.prisma.class.findUnique({
          where: { class_code: updateClassDto.class_code },
        });

        if (existingCodeClass) {
          throw new BadRequestException("Class code already exists");
        }
      }

      const updatedClass = await this.prisma.class.update({
        where: { class_id },
        data: updateClassDto,
      });

      return ClassMapper.toUpdateClassResponseDto(updatedClass);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException("Failed to update class");
    }
  }

  async remove(class_id: number) {
    try {
      const existingClass = await this.prisma.class.findUnique({
        where: { class_id },
      });

      if (!existingClass) {
        throw new NotFoundException(`Class with ID ${class_id} not found`);
      }

      await this.prisma.classEnrollment.deleteMany({
        where: { class_id },
      });

      await this.prisma.class.delete({
        where: { class_id },
      });

      return ClassMapper.toDeleteClassResponseDto(class_id);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException("Failed to delete class");
    }
  }

  async addStudents(addStudentsDto: AddStudentsDto) {
    console.log(
      "addStudents called with:",
      JSON.stringify(addStudentsDto, null, 2)
    );
    console.log("students type:", typeof addStudentsDto.students);
    console.log("students is array:", Array.isArray(addStudentsDto.students));

    // Ensure students is an array
    const students = Array.isArray(addStudentsDto.students)
      ? addStudentsDto.students
      : [];

    if (students.length === 0) {
      throw new BadRequestException("No students provided");
    }

    var records = [];
    for (let stu of students) {
      records.push({
        class_id: addStudentsDto.class_id,
        student_id: stu.id,
      });
    }
    var enrolls = await this.prisma.classEnrollment.createManyAndReturn({
      data: records,
    });
    return ClassEnrollmentMapper.toAddManyStudentsToClassResponseDto(enrolls);
  }

  async addStudentClassCode(user_id: number, class_code: string) {
    const _class = await this.prisma.class.findUnique({
      where: { class_code },
    });

    if (!_class) return null;

    const classEnroll = await this.prisma.classEnrollment.create({
      data: {
        class_id: _class.class_id,
        student_id: user_id,
      },
    });

    return ClassEnrollmentMapper.toAddOneStudentToClassResponseDto(classEnroll);
  }

  async removeStudent(class_id: number, user_id: number) {
    try {
      const enrollment = await this.prisma.classEnrollment.findFirst({
        where: {
          class_id,
          student_id: user_id,
        },
      });

      if (!enrollment) {
        throw new NotFoundException(
          "Student enrollment not found in this class"
        );
      }

      await this.prisma.classEnrollment.delete({
        where: {
          enrollment_id: enrollment.enrollment_id,
        },
      });

      return ClassMapper.toSuccessResponseDto(
        "Student removed from class successfully"
      );
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException("Failed to remove student from class");
    }
  }

  async getAllClassesOfStudent(userId: number) {
    try {
      const classEnrolls = await this.prisma.classEnrollment.findMany({
        where: { student_id: userId },
        include: {
          class: {
            include: {
              enrollments: true,
            },
          },
        },
      });

      return ClassMapper.toClassListResponseDto(
        classEnrolls.map((classEnroll) => classEnroll.class)
      );
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException("Failed to get all class of student");
    }
  }

  async getAllClassesOfTeacher(userId: number) {
    try {
      // Query directly from Class table using teacher_id field
      const classes = await this.prisma.class.findMany({
        where: { teacher_id: userId },
        include: {
          posts: true,
          enrollments: true,
          teachers: true,
        },
      });

      return ClassMapper.toClassListResponseDto(classes);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException("Failed to get all class of teacher");
    }
  }

  async getEnrollmentsByStudentId(studentId: number) {
    try {
      return await this.prisma.classEnrollment.findMany({
        where: {
          student_id: studentId,
          deleted_at: null, // Only active enrollments
        },
        select: {
          enrollment_id: true,
          class_id: true,
          student_id: true,
          enrolled_at: true,
        },
      });
    } catch (error) {
      throw new BadRequestException("Failed to get student enrollments");
    }
  }

  async getStudentsOfClass(classId: number) {
    try {
      const enrollments = await this.prisma.classEnrollment.findMany({
        where: { class_id: classId },
        select: {
          student_id: true,
          enrolled_at: true,
        },
      });

      return {
        class_id: classId,
        total_students: enrollments.length,
        students: enrollments.map((e) => ({
          student_id: e.student_id,
          enrolled_at: e.enrolled_at,
        })),
      };
    } catch (error) {
      throw new BadRequestException("Failed to get students of class");
    }
  }

  async uploadPostWithFiles(
    class_id: number,
    uploadFiles: FileInfo[],
    uploader_id: number,
    title: string,
    message: string
  ) {
    const newPost = await this.prisma.post.create({
      data: {
        sender_id: uploader_id,
        class_id,
        message,
        title,
      },
    });

    const data_for_save = await FileHelper.saveUploadFiles(
      uploadFiles,
      class_id,
      uploader_id,
      newPost.id
    );
    await this.prisma.material.createMany({
      data: data_for_save,
    });

    return MaterialMapper.toUploadPostWithFilesDto(
      `Uploads Post successfully with ${data_for_save.length} files`,
      class_id,
      data_for_save,
      title,
      message
    );
  }

  async uploadFiles(
    class_id: number,
    uploadFiles: FileInfo[],
    uploader_id: number
  ) {
    console.log(uploadFiles.length);

    const data_for_save = await FileHelper.saveUploadFiles(
      uploadFiles,
      class_id,
      uploader_id
    );

    try {
      await this.prisma.material.createMany({
        data: data_for_save,
      });

      return MaterialMapper.toUploadFilesOnlyDto(
        `Uploads successfully ${data_for_save.length} files`,
        class_id,
        data_for_save
      );
    } catch (error) {
      console.error("Upload failed:", error);
      throw new Error("Failed to upload files");
    }
  }
}
