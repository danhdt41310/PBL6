import { Controller, Get, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Observable } from 'rxjs';

@Controller('exams')
export class ExamsController {
  constructor(@Inject('EXAMS_SERVICE') private examsService: ClientProxy) {}

  @Get('hello')
  getHello(): Observable<string> {
    return this.examsService.send('exams.get_hello', {});
  }

}
