// Script to create admin user with password 123456
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('123456', 10);
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@viettung.vn' },
    update: { password: hashedPassword },
    create: {
      email: 'admin@viettung.vn',
      password: hashedPassword,
      name: 'Admin',
      isActive: true,
    },
  });
  
  console.log('Admin user created:', admin.email);
  
  // Create ADMIN role if not exists
  const role = await prisma.role.upsert({
    where: { name: 'ADMIN' },
    update: {},
    create: {
      name: 'ADMIN',
      description: 'Administrator with full access',
    },
  });
  
  // Link admin to role
  await prisma.user.update({
    where: { id: admin.id },
    data: { roleId: role.id },
  });
  
  console.log('Admin linked to ADMIN role');
  
  // Create default accounts
  const accounts = [
    { name: 'Tiền mặt', code: 'CASH' },
    { name: 'Tài khoản công ty', code: 'BANK' },
  ];
  
  for (const acc of accounts) {
    await prisma.account.upsert({
      where: { code: acc.code },
      update: {},
      create: acc,
    });
  }
  
  console.log('Default accounts created');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
