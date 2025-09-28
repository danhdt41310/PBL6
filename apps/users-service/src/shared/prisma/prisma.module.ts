import { Module } from "@nestjs/common";
import { PrismaService } from "src/shared/prisma/prisma.service";

@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}