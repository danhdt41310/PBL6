import { Controller, Get, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Observable } from 'rxjs';

@Controller('meetings')
export class MeetingsController {
  constructor(@Inject('MEETINGS_SERVICE') private meetingsService: ClientProxy) {}

  @Get('hello')
  getHello(): Observable<string> {
    return this.meetingsService.send('meetings.get_hello', {});
  }
}
