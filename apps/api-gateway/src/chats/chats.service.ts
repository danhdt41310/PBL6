import { Injectable, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Observable } from 'rxjs';

@Injectable()
export class ChatsService {
  constructor(@Inject('CHATS_SERVICE') private chatsService: ClientProxy) {}

  getHello(): Observable<string> {
    return this.chatsService.send({ cmd: 'get_hello' }, {});
  }
}
