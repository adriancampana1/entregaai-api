import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('germanos*10', 10);

  const admin = await prisma.admin.upsert({
    where: { nome: 'admin' },
    update: {},
    create: {
      nome: 'germanos',
      senha: hashedPassword,
    },
  });

  console.log(`Usuário admin criado: ${admin.nome}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error('Error disconnecting from database:', e);
    process.exit(1);
  });
