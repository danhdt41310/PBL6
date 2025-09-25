export interface ClassEnrollment{
    enrollment_id: number;
    class_id: number;
    student_id: number;
    enrolled_at: Date;
    deleted_at?: Date;
}

