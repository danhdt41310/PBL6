import { Controller, Get, Inject } from '@nestjs/common';
import { MaterialsService } from './materials.service';
import { MessagePattern, Payload } from '@nestjs/microservices';

@Controller('materials')
export class MaterialsController {
  constructor(@Inject(MaterialsService) private readonly materialsService: MaterialsService) {}

  @Get('hello')
  getHello(): string {
    return 'Hello from Materials Controller!';
  }

  @MessagePattern('materials.all')
  async all(@Payload() class_id: number){
    return this.materialsService.all(class_id) 
  }
}
