import { Controller, Get, Inject } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ClassesService } from './classes.service';
import { AddStudentsDto, CreateClassDto } from '../dto/class.dto';
import { UserInfoDto } from '../dto/user.dto';

@Controller('classes')
export class ClassesController {
  constructor(@Inject(ClassesService) private readonly classesService: ClassesService) {}

  @MessagePattern('classes.get_hello')
  getHello(): string {
    return 'Hello from Classes Controller!';
  }

  @MessagePattern('classes.create_class')
  async createClass(@Payload() createClassDto: CreateClassDto) {
    return await this.classesService.create(createClassDto);
  }

  @MessagePattern('classes.find_all')
  async findAllClasses() {
    return await this.classesService.findAll();
  }

  @MessagePattern('classes.add_students')
  async addStudents(@Payload() addStudentsDto: AddStudentsDto){
    return await this.classesService.addStudents(addStudentsDto);
  }

  @MessagePattern('classes.add_student_class_code')
  async addStudentClassCode(@Payload() data: {user_id: number, class_code: string}){
    return await this.classesService.addStudentClassCode(data.user_id, data.class_code);
  }
}
