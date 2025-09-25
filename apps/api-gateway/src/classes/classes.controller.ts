import { Body, Controller, Get, HttpException, HttpStatus, Inject, Param, Post, ValidationPipe } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { catchError, Observable, throwError, timeout, TimeoutError } from 'rxjs';
import { AddStudentsDto, CreateClassDto } from '../dto/class.dto';
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
        throw new HttpException(result.message, HttpStatus.BAD_REQUEST);
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

  @Post('add-students')
  async addStudents(@Body() addStudentsDto :AddStudentsDto, te){
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

      if (!result.success) {
        throw new HttpException(result.message, HttpStatus.BAD_REQUEST);
      }

      return result;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Failed to add students to class', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post(':class_code/joinclass')
  joinClass(@Param('class_code') class_code: number, @Body() data:{user_id}){
    return this.classesService.send('classes.add_student_class_code',{user_id: data.user_id, class_code});
  }
}
