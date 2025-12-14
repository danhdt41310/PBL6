/**
 * Database Seed Script
 * Seeds initial data for users-service database
 * 
 * Usage: npx ts-node src/common/scripts/seed.ts
 */

import { PrismaClient, VerificationPurpose, UserStatus } from '@prisma/users-client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

/**
 * Seed Data Class
 * Handles database seeding operations
 */
class SeedData {
  /**
   * Clear all existing data (in correct order to avoid FK violations)
   */
  async clearAll(): Promise<void> {
    console.log('🗑️  Clearing existing data...');
    
    await prisma.$transaction([
      prisma.rolePermission.deleteMany({}),
      prisma.userRole.deleteMany({}),
      prisma.verificationCode.deleteMany({}),
      prisma.permission.deleteMany({}),
      prisma.role.deleteMany({}),
      prisma.user.deleteMany({}),
    ]);
    
    console.log('✅ Data cleared successfully');
  }

  /**
   * Seed all data
   */
  async seed(): Promise<void> {
    console.log('🌱 Starting database seed...\n');

    // Clear prior seeded data for idempotency
    await this.clearAll();

    // Hash password for all seeded users
    const hashedPassword = await bcrypt.hash('Password123!', 10);

    // ==================== SEED ROLES ====================
    console.log('📋 Creating roles...');
    
    const adminRole = await prisma.role.create({
      data: { 
        name: 'admin', 
        description: 'Administrator role with full access' 
      },
    });
    
    const teacherRole = await prisma.role.create({
      data: { 
        name: 'teacher', 
        description: 'Teacher role with teaching permissions' 
      },
    });
    
    const studentRole = await prisma.role.create({
      data: { 
        name: 'student', 
        description: 'Student role with basic permissions' 
      },
    });

    console.log(`   ✅ Created roles: admin, teacher, student`);

    // ==================== SEED PERMISSIONS ====================
    console.log('🔐 Creating permissions...');

    const permissions = await prisma.permission.createMany({
      data: [
        // User permissions
        { key: 'user:create', name: 'Create User', description: 'Ability to create users', resource: 'user', action: 'create' },
        { key: 'user:read', name: 'Read User', description: 'Ability to read users', resource: 'user', action: 'read' },
        { key: 'user:update', name: 'Update User', description: 'Ability to update users', resource: 'user', action: 'update' },
        { key: 'user:delete', name: 'Delete User', description: 'Ability to delete users', resource: 'user', action: 'delete' },
        
        // Role permissions
        { key: 'role:manage', name: 'Manage Roles', description: 'Manage roles and permissions', resource: 'role', action: 'manage' },
        
        // Class permissions
        { key: 'class:create', name: 'Create Class', description: 'Ability to create classes', resource: 'class', action: 'create' },
        { key: 'class:read', name: 'Read Class', description: 'Ability to read classes', resource: 'class', action: 'read' },
        { key: 'class:update', name: 'Update Class', description: 'Ability to update classes', resource: 'class', action: 'update' },
        { key: 'class:delete', name: 'Delete Class', description: 'Ability to delete classes', resource: 'class', action: 'delete' },
        
        // Exam permissions
        { key: 'exam:create', name: 'Create Exam', description: 'Ability to create exams', resource: 'exam', action: 'create' },
        { key: 'exam:grade', name: 'Grade Exam', description: 'Ability to grade exams', resource: 'exam', action: 'grade' },
      ],
    });

    console.log(`   ✅ Created ${permissions.count} permissions`);

    // Get permission IDs for role assignments
    const allPermissions = await prisma.permission.findMany();
    const permissionMap = new Map(allPermissions.map(p => [p.key, p.permission_id]));

    // ==================== ASSIGN PERMISSIONS TO ROLES ====================
    console.log('🔗 Assigning permissions to roles...');

    // Admin gets all permissions
    const adminPermissions = allPermissions.map(p => ({
      role_id: adminRole.role_id,
      permission_id: p.permission_id,
    }));

    // Teacher gets specific permissions
    const teacherPermissionKeys = ['user:read', 'class:create', 'class:read', 'class:update', 'exam:create', 'exam:grade'];
    const teacherPermissions = teacherPermissionKeys
      .filter(key => permissionMap.has(key))
      .map(key => ({
        role_id: teacherRole.role_id,
        permission_id: permissionMap.get(key)!,
      }));

    // Student gets read permissions only
    const studentPermissionKeys = ['class:read'];
    const studentPermissions = studentPermissionKeys
      .filter(key => permissionMap.has(key))
      .map(key => ({
        role_id: studentRole.role_id,
        permission_id: permissionMap.get(key)!,
      }));

    await prisma.rolePermission.createMany({
      data: [...adminPermissions, ...teacherPermissions, ...studentPermissions],
    });

    console.log(`   ✅ Assigned permissions to roles`);

    // ==================== SEED USERS ====================
    console.log('👤 Creating users...');

    const adminUser = await prisma.user.create({
      data: {
        full_name: 'Admin User',
        email: 'admin@example.com',
        password: hashedPassword,
        phone: '0123456789',
        address: 'Admin Address, City',
        status: UserStatus.active,
        gender: 'male',
      },
    });

    const teacherUser = await prisma.user.create({
      data: {
        full_name: 'Teacher One',
        email: 'teacher@example.com',
        password: hashedPassword,
        phone: '0123456788',
        status: UserStatus.active,
        gender: 'female',
      },
    });

    const studentUser = await prisma.user.create({
      data: {
        full_name: 'Student One',
        email: 'student@example.com',
        password: hashedPassword,
        phone: '0987654321',
        status: UserStatus.active,
        gender: 'male',
      },
    });

    console.log(`   ✅ Created users: admin, teacher, student`);

    // ==================== ASSIGN ROLES TO USERS ====================
    console.log('🔗 Assigning roles to users...');

    await prisma.userRole.createMany({
      data: [
        { user_id: adminUser.user_id, role_id: adminRole.role_id },
        { user_id: teacherUser.user_id, role_id: teacherRole.role_id },
        { user_id: studentUser.user_id, role_id: studentRole.role_id },
      ],
    });

    console.log(`   ✅ Assigned roles to users`);

    // ==================== SEED VERIFICATION CODES (for testing) ====================
    console.log('🔑 Creating sample verification code...');

    await prisma.verificationCode.create({
      data: {
        code: '123456',
        purpose: VerificationPurpose.EMAIL_VERIFICATION,
        expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24), // 24 hours
        user_id: studentUser.user_id,
      },
    });

    console.log(`   ✅ Created sample verification code`);

    // ==================== SUMMARY ====================
    console.log('\n========================================');
    console.log('🎉 Database seeded successfully!');
    console.log('========================================');
    console.log(`\n📊 Summary:`);
    console.log(`   - Roles: 3 (admin, teacher, student)`);
    console.log(`   - Permissions: ${permissions.count}`);
    console.log(`   - Users: 3 (admin@example.com, teacher@example.com, student@example.com)`);
    console.log(`   - Password for all users: Password123!`);
    console.log('========================================\n');
  }
}

/**
 * Main execution
 */
async function main(): Promise<void> {
  const seeder = new SeedData();
  
  try {
    await seeder.seed();
  } catch (error) {
    console.error('❌ Seed failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Execute if run directly
main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

export { SeedData };
