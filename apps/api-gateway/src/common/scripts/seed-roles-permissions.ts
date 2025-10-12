import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasourceUrl: process.env.USERS_DATABASE_URL,
});

async function seedRoles() {
  console.log('Starting to seed roles...');

  try {
    // Create default roles
    const adminRole = await prisma.role.upsert({
      where: { name: 'admin' },
      update: {},
      create: {
        name: 'admin',
        description: 'Administrator with full system access',
      },
    });

    const teacherRole = await prisma.role.upsert({
      where: { name: 'teacher' },
      update: {},
      create: {
        name: 'teacher',
        description: 'Teacher with access to educational features',
      },
    });

    const userRole = await prisma.role.upsert({
      where: { name: 'user' },
      update: {},
      create: {
        name: 'user',
        description: 'Regular user with basic access',
      },
    });

    console.log('Default roles created/updated successfully');
    console.log('Seeding completed successfully');

  } catch (error) {
    console.error('Error during seeding:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if this file is executed directly
if (require.main === module) {
  seedRoles()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export { seedRoles };
