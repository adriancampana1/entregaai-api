import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('germanos*10', 10);

  const admin = await prisma.admin.upsert({
    where: { nome: 'germanos' },
    update: {
      senha: hashedPassword,
    },
    create: {
      nome: 'germanos',
      senha: hashedPassword,
    },
  });

  console.log(`Usuário admin criado/atualizado: ${admin.nome}`);
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
