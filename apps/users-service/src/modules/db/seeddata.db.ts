import { PrismaService } from "../../shared/prisma/prisma.service";
import { VerificationPurpose, UserStatus } from "@prisma/users-client";
import * as bcrypt from "bcrypt";

export class SeedData {
  constructor(private readonly prisma: PrismaService) {}

  async clearAll() {
    // Delete dependents first then parents to avoid FK issues
    await this.prisma.$transaction([
      this.prisma.rolePermission.deleteMany({ where: {} }),
      this.prisma.userRole.deleteMany({ where: {} }),
      this.prisma.verificationCode.deleteMany({ where: {} }),
      this.prisma.permission.deleteMany({ where: {} }),
      this.prisma.role.deleteMany({ where: {} }),
      this.prisma.user.deleteMany({ where: {} }),
    ]);
  }

  async seed() {
    // Idempotent: clear prior seeded data
    await this.clearAll();

    // Simple hashed password used for all seeded users
    const hashedPassword = await bcrypt.hash("Password123!", 10);

    // Create roles
    const adminRole = await this.prisma.role.create({
      data: { name: "admin", description: "Administrator role with full access" },
    });
    const teacherRole = await this.prisma.role.create({
      data: { name: "teacher", description: "Teacher role" },
    });
    const studentRole = await this.prisma.role.create({
      data: { name: "student", description: "Student role" },
    });

    // Create some permissions
    const permCreateUser = await this.prisma.permission.create({
      data: {
        key: "user:create",
        name: "Create user",
        description: "Ability to create users",
        resource: "user",
        action: "create",
      },
    });

    const permManageRoles = await this.prisma.permission.create({
      data: {
        key: "role:manage",
        name: "Manage roles",
        description: "Manage roles and permissions",
        resource: "role",
        action: "manage",
      },
    });

    // Assign permissions to roles
    await this.prisma.rolePermission.createMany({
      data: [
        { role_id: adminRole.role_id, permission_id: permCreateUser.permission_id },
        { role_id: adminRole.role_id, permission_id: permManageRoles.permission_id },
        { role_id: teacherRole.role_id, permission_id: permCreateUser.permission_id },
      ],
    });

    // Create users
    const adminUser = await this.prisma.user.create({
      data: {
        full_name: "Admin User",
        email: "admin@example.com",
        password: hashedPassword,
        phone: "0123456789",
        address: "Admin address",
        status: UserStatus.active,
      },
    });

    const teacherUser = await this.prisma.user.create({
      data: {
        full_name: "Teacher One",
        email: "teacher@example.com",
        password: hashedPassword,
        phone: "0123456789",
        status: UserStatus.active,
      },
    });

    const studentUser = await this.prisma.user.create({
      data: {
        full_name: "Student One",
        email: "student@example.com",
        password: hashedPassword,
        phone: "0987654321",
        status: UserStatus.active,
      },
    });

    // Assign roles to users
    await this.prisma.userRole.createMany({
      data: [
        { user_id: adminUser.user_id, role_id: adminRole.role_id },
        { user_id: teacherUser.user_id, role_id: teacherRole.role_id },
        { user_id: studentUser.user_id, role_id: studentRole.role_id },
      ],
    });

    // Create a verification code for the student (example)
    await this.prisma.verificationCode.create({
      data: {
        code: "ABC12345",
        purpose: VerificationPurpose.EMAIL_VERIFICATION,
        expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24), // 24 hours
        user_id: studentUser.user_id,
      },
    });

    console.log(
      `Seeded users-service: users (${adminUser.user_id}, ${teacherUser.user_id}, ${studentUser.user_id}), roles (${adminRole.role_id}, ${teacherRole.role_id}, ${studentRole.role_id})`,
    );
  }
}


const prisma = new PrismaService()
const seeder = new SeedData(prisma)
seeder.seed()