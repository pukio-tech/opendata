import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

/** Apps del panel (deben coincidir con los `id` de lib/apps.ts del panel). */
const PANEL_APPS = [
  { id: 'opendata', name: 'OpenData Perú', description: 'Turismo y datos abiertos' },
  { id: 'gym', name: 'Gym Manager', description: 'Gestión de gimnasios (multiempresa)' },
];

async function main() {
  for (const app of PANEL_APPS) {
    await prisma.panelApp.upsert({
      where: { id: app.id },
      update: { name: app.name, description: app.description },
      create: app,
    });
  }
  console.log(`✅ Apps del panel: ${PANEL_APPS.map((a) => a.id).join(', ')}`);

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
