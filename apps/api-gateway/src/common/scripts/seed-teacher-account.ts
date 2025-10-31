import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcrypt'
import { config } from 'dotenv'
config()

const prisma: PrismaClient = new PrismaClient({
  datasourceUrl: process.env.USERS_DATABASE_URL,
})

async function seedTeacherAccount() {
  console.log('Starting to seed teacher account...')

  try {
    // Get teacher role
    const teacherRole = await prisma.role.findUnique({
      where: { name: 'teacher' },
    })

    if (!teacherRole) {
      console.error('Teacher role not found. Please run seed-roles-permissions.ts first.')
      throw new Error('Teacher role not found')
    }

    // Get teacher credentials from environment (or use defaults based on admin)
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com'
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123'
    const adminFullName = process.env.ADMIN_FULLNAME || 'Admin Account'
    
    // Create teacher email by adding 5 to the username part
    const emailParts = adminEmail.split('@')
    const teacherEmail = `${emailParts[0]}+5@${emailParts[1]}`
    const teacherPassword = adminPassword // Same password as admin
    const teacherFullName = `${adminFullName.replace('Admin', 'Teacher')} (Full Permissions)`

    console.log(`Ensuring teacher user exists with email: ${teacherEmail}, fullname: ${teacherFullName}`)

    // Check if teacher user exists
    let teacherUser = await prisma.user.findUnique({
      where: { email: teacherEmail },
    })

    if (!teacherUser) {
      // Create teacher user
      const hashedPassword = await bcrypt.hash(teacherPassword, 10)
      teacherUser = await prisma.user.create({
        data: {
          email: teacherEmail,
          password: hashedPassword,
          full_name: teacherFullName,
          status: 'active',
        }
      })
      console.log(`Created teacher user: ${teacherEmail}`)
    } else {
      console.log(`Teacher user already exists: ${teacherEmail}`)
    }

    // Assign teacher role to user
    const existingUserRole = await prisma.userRole.findFirst({
      where: {
        user_id: teacherUser.user_id,
        role_id: teacherRole.role_id,
      },
    })

    if (!existingUserRole) {
      await prisma.userRole.create({
        data: {
          user_id: teacherUser.user_id,
          role_id: teacherRole.role_id,
        },
      })
      console.log('Assigned teacher role to teacher user')
    } else {
      console.log('Teacher user already has teacher role')
    }

    // Assign all permissions to teacher role
    const permissions = await prisma.permission.findMany()
    console.log(`Found ${permissions.length} permissions in database`)

    if (permissions.length > 0) {
      // Get existing role permissions
      const existingRolePermissions = await prisma.rolePermission.findMany({
        where: { role_id: teacherRole.role_id },
        select: { permission_id: true },
      })

      const existingPermissionIds = new Set(existingRolePermissions.map(rp => rp.permission_id))
      
      // Filter out permissions that already exist
      const newRolePermissions = permissions
        .filter(p => !existingPermissionIds.has(p.permission_id))
        .map((permission) => ({
          role_id: teacherRole.role_id,
          permission_id: permission.permission_id,
        }))

      if (newRolePermissions.length > 0) {
        await prisma.rolePermission.createMany({
          data: newRolePermissions,
          skipDuplicates: true,
        })
        console.log(`Added ${newRolePermissions.length} new permissions to teacher role`)
      } else {
        console.log(`Teacher role already has all ${permissions.length} permissions`)
      }
    } else {
      console.log('No permissions found in database')
    }

    // Verification
    const assignedCount = await prisma.rolePermission.count({
      where: { role_id: teacherRole.role_id },
    })

    console.log(`\n=== Teacher Account Summary ===`)
    console.log(`Email: ${teacherEmail}`)
    console.log(`Password: ${teacherPassword}`)
    console.log(`Full Name: ${teacherFullName}`)
    console.log(`Role: teacher`)
    console.log(`Permissions: ${assignedCount}`)
    console.log(`Status: active`)
    console.log(`=============================\n`)
    
    console.log('Teacher account seeding completed successfully')
  } catch (error) {
    console.error('Error during teacher account seeding:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run if this file is executed directly
if (require.main === module) {
  seedTeacherAccount()
    .then(() => process.exit(0))
    .catch(() => process.exit(1))
}

export { seedTeacherAccount }
