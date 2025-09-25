import { Controller, Get, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Observable } from 'rxjs';

@Controller('chats')
export class ChatsController {
  constructor(@Inject('CHATS_SERVICE') private chatsService: ClientProxy) {}

  @Get('hello')
  getHello(): Observable<string> {
    return this.chatsService.send('chats.get_hello', {});
  }
}
