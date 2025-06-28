const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function debugAuth() {
  try {
    console.log('🔍 [Debug] Checking database connection...')
    
    // Test database connection
    await prisma.$connect()
    console.log('✅ [Debug] Database connected successfully')
    
    // Check users in database
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        password: true,
        employeeId: true,
      }
    })
    
    console.log('📊 [Debug] Users in database:', users.length)
    users.forEach(user => {
      console.log(`  - ID: ${user.id}, Name: ${user.name}, Email: ${user.email}, Role: ${user.role}, HasPassword: ${!!user.password}`)
    })
    
    // Test password hashing
    if (users.length > 0) {
      const testUser = users[0]
      console.log('🔐 [Debug] Testing password hash for first user...')
      console.log(`  - Password hash: ${testUser.password?.substring(0, 20)}...`)
      
      // Try to create a test password
      const testPassword = 'test123'
      const hashedPassword = await bcrypt.hash(testPassword, 12)
      console.log(`  - Test hash: ${hashedPassword.substring(0, 20)}...`)
      
      const isMatch = await bcrypt.compare(testPassword, hashedPassword)
      console.log(`  - Hash verification test: ${isMatch ? 'PASS' : 'FAIL'}`)
    }
    
  } catch (error) {
    console.error('❌ [Debug] Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

debugAuth()
