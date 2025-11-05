import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcrypt'
import { config } from 'dotenv'
config()

const prisma: PrismaClient = new PrismaClient({
  datasourceUrl: process.env.USERS_DATABASE_URL,
})

async function seedAdminAccount() {
  console.log('Starting to seed admin account...')

  try {
    // Get admin role
    const adminRole = await prisma.role.findUnique({
      where: { name: 'admin' },
    })

    if (!adminRole) {
      console.error('Admin role not found. Please run seed-roles-permissions.ts first.')
      throw new Error('Admin role not found')
    }

    // Get admin credentials from environment
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com'
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123'
    const adminFullName = process.env.ADMIN_FULLNAME || 'Admin Account'

    console.log(`Ensuring admin user exists with email: ${adminEmail}, fullname: ${adminFullName}`)

    // Check if admin user exists
    let adminUser = await prisma.user.findUnique({
      where: { email: adminEmail },
    })

    if (!adminUser) {
      // Create admin user
      const hashedPassword = await bcrypt.hash(adminPassword, 10)
      adminUser = await prisma.user.create({
        data: {
          email: adminEmail,
          password: hashedPassword,
          full_name: adminFullName,
          status: 'active',
        }
      })
      console.log(`Created admin user: ${adminEmail}`)
    } else {
      console.log(`Admin user already exists: ${adminEmail}`)
    }

    // Assign admin role to user
    const existingUserRole = await prisma.userRole.findFirst({
      where: {
        user_id: adminUser.user_id,
        role_id: adminRole.role_id,
      },
    })

    if (!existingUserRole) {
      await prisma.userRole.create({
        data: {
          user_id: adminUser.user_id,
          role_id: adminRole.role_id,
        },
      })
      console.log('Assigned admin role to admin user')
    } else {
      console.log('Admin user already has admin role')
    }

    // Assign all permissions to admin role
    const permissions = await prisma.permission.findMany()
    console.log(`Found ${permissions.length} permissions in database`)

    if (permissions.length > 0) {
      // Get existing role permissions
      const existingRolePermissions = await prisma.rolePermission.findMany({
        where: { role_id: adminRole.role_id },
        select: { permission_id: true },
      })

      const existingPermissionIds = new Set(existingRolePermissions.map(rp => rp.permission_id))
      
      // Filter out permissions that already exist
      const newRolePermissions = permissions
        .filter(p => !existingPermissionIds.has(p.permission_id))
        .map((permission) => ({
          role_id: adminRole.role_id,
          permission_id: permission.permission_id,
        }))

      if (newRolePermissions.length > 0) {
        await prisma.rolePermission.createMany({
          data: newRolePermissions,
          skipDuplicates: true,
        })
        console.log(`Added ${newRolePermissions.length} new permissions to admin role`)
      } else {
        console.log(`Admin role already has all ${permissions.length} permissions`)
      }
    } else {
      console.log('No permissions found in database')
    }

    // Verification
    const assignedCount = await prisma.rolePermission.count({
      where: { role_id: adminRole.role_id },
    })

    console.log(`\n=== Admin Account Summary ===`)
    console.log(`Email: ${adminEmail}`)
    console.log(`Full Name: ${adminFullName}`)
    console.log(`Role: admin`)
    console.log(`Permissions: ${assignedCount}`)
    console.log(`Status: active`)
    console.log(`=============================\n`)
    
    console.log('Admin account seeding completed successfully')
  } catch (error) {
    console.error('Error during admin account seeding:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run if this file is executed directly
if (require.main === module) {
  seedAdminAccount()
    .then(() => process.exit(0))
    .catch(() => process.exit(1))
}

export { seedAdminAccount }
