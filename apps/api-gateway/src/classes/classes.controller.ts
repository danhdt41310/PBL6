import { Body, Controller, Delete, Get, HttpException, HttpStatus, Inject, Param, Post, Put, ValidationPipe } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { catchError, Observable, throwError, timeout, TimeoutError } from 'rxjs';
import { AddStudentsDto, CreateClassDto, UpdateClassDto } from '../dto/class.dto';
import { UserInfoDto } from 'src/dto/user.dto';

@Controller('classes')
export class ClassesController {
  constructor(@Inject('CLASSES_SERVICE') private classesService: ClientProxy) {}

  @Get('hello')
  getHello(): Observable<string> {
    return this.classesService.send('classes.get_hello', {});
  }

  @Post('create')
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

      if (!result.success) {
        throw new HttpException(result.error || result.message, HttpStatus.BAD_REQUEST);
      }

      return result;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Failed to create class', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('')
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
  async findOne(@Param('class_id') class_id: number) {
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
  async update(@Param('class_id') class_id: number, @Body(ValidationPipe) updateClassDto: UpdateClassDto) {
    try {
      const result = await this.classesService.send('classes.update_class', { 
        class_id: +class_id, 
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

      if (!result.success) {
        throw new HttpException(result.error || result.message, HttpStatus.BAD_REQUEST);
      }

      return result;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Failed to update class', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Delete(':class_id')
  async remove(@Param('class_id') class_id: number) {
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

      if (!result.success) {
        throw new HttpException(result.error || result.message, HttpStatus.BAD_REQUEST);
      }

      return result;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Failed to delete class', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('add-students')
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
  async removeStudent(@Param('class_id') class_id: number, @Param('user_id') user_id: number) {
    try {
      const result = await this.classesService.send('classes.remove_student', { 
        class_id: +class_id, 
        user_id: +user_id 
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

      if (!result.success) {
        throw new HttpException(result.error || result.message, HttpStatus.BAD_REQUEST);
      }

      return result;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Failed to remove student from class', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post(':class_code/joinclass')
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
}