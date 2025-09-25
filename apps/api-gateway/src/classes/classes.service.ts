import { Injectable, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Observable } from 'rxjs';

@Injectable()
export class ClassesService {
  constructor(@Inject('CLASSES_SERVICE') private classesService: ClientProxy) {}

  getHello(): Observable<string> {
    return this.classesService.send({ cmd: 'get_hello' }, {});
  }
}
