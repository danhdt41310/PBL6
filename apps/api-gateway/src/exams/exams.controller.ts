import { Controller, Get, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Observable } from 'rxjs';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('exams')
@ApiBearerAuth('JWT-auth')
@Controller('exams')
export class ExamsController {
  constructor(@Inject('EXAMS_SERVICE') private examsService: ClientProxy) {}

  @Get('hello')
  @ApiOperation({ summary: 'Test exams service', description: 'Simple hello endpoint for testing exams service' })
  @ApiResponse({ status: 200, description: 'Returns hello message' })
  getHello(): Observable<string> {
    return this.examsService.send('exams.get_hello', {});
  }

}
