import { Controller, Get, Inject } from "@nestjs/common";
import { MaterialsService } from "./materials.service";
import { MessagePattern, Payload } from "@nestjs/microservices";

@Controller("materials")
export class MaterialsController {
  constructor(
    @Inject(MaterialsService)
    private readonly materialsService: MaterialsService
  ) {}

  @Get("hello")
  getHello(): string {
    return "Hello from Materials Controller!";
  }

  @MessagePattern("materials.all")
  async all(@Payload() class_id: number) {
    return this.materialsService.all(class_id);
  }

  @MessagePattern("materials.findOne")
  async findOne(@Payload() materialId: number) {
    return this.materialsService.findOne(materialId);
  }

  @MessagePattern("materials.create")
  async create(
    @Payload()
    data: {
      classId: number;
      materials: Array<{
        title: string;
        file_url: string;
        file_name: string;
        file_path: string;
        file_size: number;
        mime_type: string;
        uploaded_by: number;
      }>;
      postId?: number;
    }
  ) {
    return this.materialsService.create(data);
  }

  @MessagePattern("materials.delete")
  async delete(@Payload() materialId: number) {
    return this.materialsService.delete(materialId);
  }
}
