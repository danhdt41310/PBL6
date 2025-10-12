import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { SkipPermissionCheck } from './common/decorators/skip-permission-check.decorator';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @SkipPermissionCheck()
  getHello(): string {
    return this.appService.getHello();
  }
}
