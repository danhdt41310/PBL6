import { Controller, Get, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Observable } from 'rxjs';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('meetings')
@ApiBearerAuth('JWT-auth')
@Controller('meetings')
export class MeetingsController {
  constructor(@Inject('MEETINGS_SERVICE') private meetingsService: ClientProxy) {}

  @Get('hello')
  @ApiOperation({ summary: 'Test meetings service', description: 'Simple hello endpoint for testing meetings service' })
  @ApiResponse({ status: 200, description: 'Returns hello message' })
  getHello(): Observable<string> {
    return this.meetingsService.send('meetings.get_hello', {});
  }
}
