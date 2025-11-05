import { Body, Controller, Delete, Get, HttpException, HttpStatus, Inject, Param, Post, Put, ValidationPipe, ParseIntPipe } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { catchError, Observable, throwError, timeout, TimeoutError } from 'rxjs';
import { AddStudentsDto, CreateClassDto, UpdateClassDto } from '../dto/class.dto';
import { UserInfoDto } from 'src/dto/user.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiBody } from '@nestjs/swagger';
import { PostsDTO } from 'src/dto/post.dto';

@ApiTags('classes')
@ApiBearerAuth('JWT-auth')
@Controller('classes')
export class ClassesController {
  constructor(@Inject('CLASSES_SERVICE') private classesService: ClientProxy) {}

  @Get('hello')
  @ApiOperation({ summary: 'Test classes service', description: 'Simple hello endpoint for testing classes service' })
  @ApiResponse({ status: 200, description: 'Returns hello message' })
  getHello(): Observable<string> {
    return this.classesService.send('classes.get_hello', {});
  }

  @Post('create')
  @ApiOperation({ summary: 'Create class', description: 'Create a new class' })
  @ApiBody({ type: CreateClassDto })
  @ApiResponse({ status: 201, description: 'Class created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 408, description: 'Request timeout' })
  async create(@Body(ValidationPipe) createClassDto: CreateClassDto) {
    try {
      const result = await this.classesService.send('classes.create_class', createClassDto)
        .pipe(
          timeout(5000),
          catchError(err => {
            if (err instanceof TimeoutError) {
              return throwError(new HttpException('Classes service timeout', HttpStatus.REQUEST_TIMEOUT));
            }
            return throwError(new HttpException('Failed to create class', HttpStatus.BAD_REQUEST));
          }),
        )
        .toPromise();

      return result;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Failed to create class', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('')
  @ApiOperation({ summary: 'Get all classes', description: 'Retrieve all classes' })
  @ApiResponse({ status: 200, description: 'List of classes retrieved successfully' })
  @ApiResponse({ status: 408, description: 'Request timeout' })
  @ApiResponse({ status: 503, description: 'Service unavailable' })
  async findAll() {
    try {
      return await this.classesService.send('classes.find_all', {})
        .pipe(
          timeout(5000),
          catchError(err => {
            if (err instanceof TimeoutError) {
              return throwError(new HttpException('Classes service timeout', HttpStatus.REQUEST_TIMEOUT));
            }
            return throwError(new HttpException('Failed to fetch classes', HttpStatus.SERVICE_UNAVAILABLE));
          }),
        )
        .toPromise();
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Failed to fetch classes', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get(':class_id')
  @ApiOperation({ summary: 'Get class by ID', description: 'Retrieve a specific class by its ID' })
  @ApiParam({ name: 'class_id', type: 'integer', description: 'ID of the class to retrieve' })
  @ApiResponse({ status: 200, description: 'Class retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Class not found' })
  @ApiResponse({ status: 408, description: 'Request timeout' })
  async findOne(@Param('class_id', ParseIntPipe) class_id: number) {
    try {
      return await this.classesService.send('classes.find_one', +class_id)
        .pipe(
          timeout(5000),
          catchError(err => {
            if (err instanceof TimeoutError) {
              return throwError(new HttpException('Classes service timeout', HttpStatus.REQUEST_TIMEOUT));
            }
            return throwError(new HttpException('Class not found', HttpStatus.NOT_FOUND));
          }),
        )
        .toPromise();
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Failed to fetch class', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Put(':class_id')
  @ApiOperation({ summary: 'Update class', description: 'Update details of an existing class' })
  @ApiParam({ name: 'class_id', type: 'integer', description: 'ID of the class to update' })
  @ApiBody({ type: UpdateClassDto })
  @ApiResponse({ status: 200, description: 'Class updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Class not found' })
  @ApiResponse({ status: 408, description: 'Request timeout' })
  async update(@Param('class_id', ParseIntPipe) class_id: number, @Body(ValidationPipe) updateClassDto: UpdateClassDto) {
    console.log('Received update request for class_id:', class_id);
    console.log('Update data:', updateClassDto);
    try {
      const result = await this.classesService.send('classes.update_class', { 
        class_id, 
        updateClassDto 
      })
        .pipe(
          timeout(5000),
          catchError(err => {
            if (err instanceof TimeoutError) {
              return throwError(new HttpException('Classes service timeout', HttpStatus.REQUEST_TIMEOUT));
            }
            return throwError(new HttpException('Failed to update class', HttpStatus.BAD_REQUEST));
          }),
        )
        .toPromise();
      return result;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Failed to update class', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Delete(':class_id')
  @ApiOperation({ summary: 'Delete class', description: 'Remove a class by its ID' })
  @ApiParam({ name: 'class_id', type: 'integer', description: 'ID of the class to delete' })
  @ApiResponse({ status: 200, description: 'Class deleted successfully' })
  @ApiResponse({ status: 404, description: 'Class not found' })
  @ApiResponse({ status: 408, description: 'Request timeout' })
  async remove(@Param('class_id', ParseIntPipe) class_id: number) {
    try {
      const result = await this.classesService.send('classes.delete_class', +class_id)
        .pipe(
          timeout(5000),
          catchError(err => {
            if (err instanceof TimeoutError) {
              return throwError(new HttpException('Classes service timeout', HttpStatus.REQUEST_TIMEOUT));
            }
            return throwError(new HttpException('Failed to delete class', HttpStatus.BAD_REQUEST));
          }),
        )
        .toPromise();

      return result;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Failed to delete class', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('add-students')
  @ApiOperation({ summary: 'Add students to class', description: 'Enroll students in a class' })
  @ApiBody({ type: AddStudentsDto })
  @ApiResponse({ status: 201, description: 'Students added to class successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 408, description: 'Request timeout' })
  async addStudents(@Body() addStudentsDto: AddStudentsDto) {
    try {
      const result = await this.classesService.send('classes.add_students', addStudentsDto)
        .pipe(
          timeout(5000),
          catchError(err => {
            if (err instanceof TimeoutError) {
              return throwError(new HttpException('Classes service timeout', HttpStatus.REQUEST_TIMEOUT));
            }
            return throwError(new HttpException('Failed to add students to class', HttpStatus.BAD_REQUEST));
          }),
        )
        .toPromise();

      return result;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Failed to add students to class', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Delete(':class_id/students/:user_id')
  @ApiOperation({ summary: 'Remove student from class', description: 'Unenroll a student from a class' })
  @ApiParam({ name: 'class_id', type: 'integer', description: 'ID of the class' })
  @ApiParam({ name: 'user_id', type: 'integer', description: 'ID of the student' })
  @ApiResponse({ status: 200, description: 'Student removed from class successfully' })
  @ApiResponse({ status: 404, description: 'Class or student not found' })
  @ApiResponse({ status: 408, description: 'Request timeout' })
  async removeStudent(@Param('class_id', ParseIntPipe) class_id: number, @Param('user_id', ParseIntPipe) user_id: number) {
    try {
      const result = await this.classesService.send('classes.remove_student', { 
        class_id, 
        user_id 
      })
        .pipe(
          timeout(5000),
          catchError(err => {
            if (err instanceof TimeoutError) {
              return throwError(new HttpException('Classes service timeout', HttpStatus.REQUEST_TIMEOUT));
            }
            return throwError(new HttpException('Failed to remove student from class', HttpStatus.BAD_REQUEST));
          }),
        )
        .toPromise();

      return result;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Failed to remove student from class', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post(':class_code/joinclass')
  @ApiOperation({ summary: 'Join class by code', description: 'Enroll in a class using its code' })
  @ApiParam({ name: 'class_code', type: 'string', description: 'Code of the class to join' })
  @ApiResponse({ status: 201, description: 'Successfully joined the class' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Class not found' })
  @ApiResponse({ status: 408, description: 'Request timeout' })
  async joinClass(@Param('class_code') class_code: string, @Body() data: { user_id: number }) {
    try {
      const result = await this.classesService.send('classes.add_student_class_code', {
        user_id: data.user_id, 
        class_code
      })
        .pipe(
          timeout(5000),
          catchError(err => {
            if (err instanceof TimeoutError) {
              return throwError(new HttpException('Classes service timeout', HttpStatus.REQUEST_TIMEOUT));
            }
            return throwError(new HttpException('Failed to join class', HttpStatus.BAD_REQUEST));
          }),
        )
        .toPromise();

      if (!result) {
        throw new HttpException('Class not found', HttpStatus.NOT_FOUND);
      }

      return result;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Failed to join class', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }


  @Get('of/:role/:id')
  @ApiOperation({ summary: 'Get classes of a teacher or student', description: 'Retrieve classes by user role and ID' })
  @ApiParam({ name: 'role', type: 'string', description: 'Role of the user (teacher or student)' })
  @ApiParam({ name: 'id', type: 'integer', description: 'ID of the user' })
  @ApiResponse({ status: 200, description: 'List of classes retrieved successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Classes not found' })
  @ApiResponse({ status: 408, description: 'Request timeout' })
  async getAllClassesOfTeacher(@Param('id', ParseIntPipe) id: number, @Param('role') role:string){
    try {
      if (role!=='student' && role!=='teacher'){
        throw new HttpException('Not correct role', HttpStatus.BAD_REQUEST);
      }
      const result = await this.classesService.send(`classes.get_all_classes_of_${role}`, {
        user_id: id
      })
        .pipe(
          timeout(5000),
          catchError(err => {
            if (err instanceof TimeoutError) {
              return throwError(new HttpException('Classes service timeout', HttpStatus.REQUEST_TIMEOUT));
            }
            return throwError(new HttpException('Failed to join class', HttpStatus.BAD_REQUEST));
          }),
        )
        .toPromise();

      if (!result) {
        throw new HttpException('Class not found', HttpStatus.NOT_FOUND);
      }

      return result;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Failed to join class', HttpStatus.INTERNAL_SERVER_ERROR);
    }  
  }

  @Post('add-new-post')
  @ApiOperation({ summary: 'Add new post and reply', description: 'Retrieve classes by user role and ID' })
  @ApiResponse({ status: 200, description: 'Messages for adding and data for new post added' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 408, description: 'Request timeout' })
  async addNewPost(@Body() body:PostsDTO){
    try {
      const result = await this.classesService.send(`posts.add_new_post`, body)
        .pipe(
          timeout(5000),
          catchError(err => {
            if (err instanceof TimeoutError) {
              return throwError(new HttpException('Classes service timeout', HttpStatus.REQUEST_TIMEOUT));
            }
            return throwError(new HttpException('Failed to add post', HttpStatus.BAD_REQUEST));
          }),
        )
        .toPromise();

      if (!result) {
        throw new HttpException('Failed to add post', HttpStatus.NOT_FOUND);
      }

      return result;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Failed to add post', HttpStatus.INTERNAL_SERVER_ERROR);
    }  
  }

}