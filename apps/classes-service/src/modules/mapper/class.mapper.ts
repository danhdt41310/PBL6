import { Class, ClassEnrollment, Post } from '@prisma/classes-client';
import { 
  ClassResponseDto, 
  ClassResponseAllInfoDto,
  CreateClassResponseDto,
  UpdateClassResponseDto 
} from '../dto/classes-response.dto';
import { PostResponseDto } from '../dto/post-response.dto';

export class ClassMapper {
  /**
   * Maps a Class entity to ClassResponseDto
   */
  static toResponseDto(classEntity: Class): ClassResponseDto {
    return {
      class_id: classEntity.class_id,
      class_name: classEntity.class_name,
      class_code: classEntity.class_code,
      description: classEntity.description,
      teacher_id: classEntity.teacher_id,
      created_at: classEntity.created_at,
    };
  }

  /**
   * Maps a Class entity with posts to ClassResponseAllInfoDto
   */
  static toResponseAllInfoDto(classEntity: Class & { posts: Post[] }): ClassResponseAllInfoDto {
    return {
      class_id: classEntity.class_id,
      class_name: classEntity.class_name,
      class_code: classEntity.class_code,
      description: classEntity.description,
      teacher_id: classEntity.teacher_id,
      created_at: classEntity.created_at,
      posts: classEntity.posts.map(post => ({
        id: post.id,
        class_id: post.class_id,
        parent_id: post.parent_id,
        title: post.title,
        message: post.message,
        sender_id: post.sender_id,
        created_at: post.created_at,
      } as PostResponseDto)),
    };
  }

  /**
   * Maps a newly created class to CreateClassResponseDto
   */
  static toCreateClassResponseDto(classEntity: Class): CreateClassResponseDto {
    return {
      message: 'Class created successfully',
      class: this.toResponseDto(classEntity),
    };
  }

  /**
   * Maps an updated class to UpdateClassResponseDto
   */
  static toUpdateClassResponseDto(classEntity: Class): UpdateClassResponseDto {
    return {
      message: 'Class updated successfully',
      class: this.toResponseDto(classEntity),
    };
  }

  /**
   * Maps a deleted class to delete response
   */
  static toDeleteClassResponseDto(class_id: number): { message: string; class_id: number } {
    return {
      message: `Class with ID ${class_id} has been deleted successfully`,
      class_id,
    };
  }

  /**
   * Maps an array of Class entities to ClassResponseDto array
   */
  static toClassListResponseDto(classes: Class[]): ClassResponseDto[] {
    return classes.map(classEntity => this.toResponseDto(classEntity));
  }

  /**
   * Maps an array of Class entities with posts to ClassResponseAllInfoDto array
   */
  static toClassListAllInfoResponseDto(classes: (Class & { posts: Post[] })[]): ClassResponseAllInfoDto[] {
    return classes.map(classEntity => this.toResponseAllInfoDto(classEntity));
  }

  /**
   * Maps error to error response format
   */
  static toErrorResponseDto(error: string): {
    success: boolean;
    error: string;
  } {
    return {
      success: false,
      error,
    };
  }

  /**
   * Maps success message to success response format
   */
  static toSuccessResponseDto(message: string, data?: any): {
    success: boolean;
    message: string;
    data?: any;
  } {
    return {
      success: true,
      message,
      ...(data && { data }),
    };
  }
}