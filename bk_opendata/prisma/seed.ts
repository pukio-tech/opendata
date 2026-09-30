import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.INITIAL_ADMIN_EMAIL || 'admin@opendata.pe';
  const adminPassword = process.env.INITIAL_ADMIN_PASSWORD || 'Admin123456!';

  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    const admin = await prisma.user.create({
      data: {
        email: adminEmail,
        password: hashedPassword,
        name: 'Administrador OpenData',
        role: Role.ADMIN,
      },
    });
    console.log(`✅ Usuario administrador creado: ${admin.email}`);
  } else {
    console.log(`ℹ️ El administrador ${adminEmail} ya existe.`);
  }
}

main()
  .catch((e) => {
    console.error('❌ Error ejecutando seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
