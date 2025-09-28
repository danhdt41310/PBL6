import { Global, Module } from "@nestjs/common";
import { EmailModule } from "src/shared/email/email.module";
import { PrismaModule } from "src/shared/prisma/prisma.module";

@Global()
@Module({
  imports: [EmailModule, PrismaModule],
  exports: [EmailModule, PrismaModule],
})
export class SharedModule {}