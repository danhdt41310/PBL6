import { Controller, Get, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Observable } from 'rxjs';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('chats')
@ApiBearerAuth('JWT-auth')
@Controller('chats')
export class ChatsController {
  constructor(@Inject('CHATS_SERVICE') private chatsService: ClientProxy) {}

  @Get('hello')
  @ApiOperation({ summary: 'Test chats service', description: 'Simple hello endpoint for testing chats service' })
  @ApiResponse({ status: 200, description: 'Returns hello message' })
  getHello(): Observable<string> {
    return this.chatsService.send('chats.get_hello', {});
  }
}
