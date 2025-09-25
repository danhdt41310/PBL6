import { AddManyStudentsToClassResponseDto, AddOneStudentToClassResponseDto } from "../dto/classEnrollment-response.dto";
import { ClassEnrollment } from "../interface/classEnrollment.interface";

export class ClassMapper{
    static toAddManyStudentsToClassResponseDto(classEnrollments: ClassEnrollment[]):AddManyStudentsToClassResponseDto{
        var enrollments = [];
        for (let enroll of classEnrollments){
            enrollments.push(this.toAddOneStudentToClassResponseDto(enroll))
        }
        return {
            message: "Succesfully enroll to class",
            enrollments
        }
    }
    static toAddOneStudentToClassResponseDto(classEnroll: ClassEnrollment): AddOneStudentToClassResponseDto{
        return {
            message:"Succesfully enroll to class",
            enrollment_id: classEnroll.enrollment_id,
            student_id: classEnroll.student_id,
            class_id: classEnroll.class_id,
        }
    }
}