import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CreateMeetingDto, UpdateMeetingDto } from './dto/meeting.dto';

@Controller('meetings')
export class MeetingsController {

  @MessagePattern('meetings.get_hello')
  getHello(@Payload() data: { name: string }) {
    return `Hello, ${data.name}! Welcome to the Meetings Service.`;
  }

}
