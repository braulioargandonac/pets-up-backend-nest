import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker/locale/es_MX';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Empezando el poblado (seeding)...');

  let user = await prisma.user.findFirst({
    where: { email: 'prueba@test.com' },
  });

  if (!user) {
    const saltOrRounds = 10;
    const hashedPassword = await bcrypt.hash('password123', saltOrRounds);

    user = await prisma.user.create({
      data: {
        email: 'prueba@test.com',
        name: 'Usuario de Prueba',
        password: hashedPassword,
        communeId: 135,
      },
    });
    console.log('👤 Creado usuario de prueba (owner).');
  }

  const communeIds = (
    await prisma.commune.findMany({ select: { id: true } })
  ).map((c) => c.id);
  const statusId = (await prisma.petStatus.findFirst({
    where: { name: 'En adopción' },
  }))!.id;
  const specieId = (await prisma.petSpecie.findFirst({
    where: { name: 'Perro' },
  }))!.id;
  const breedId = (await prisma.petBreed.findFirst({
    where: { name: 'Mestizo / Quiltro' },
  }))!.id;
  const sizeId = (await prisma.petSize.findFirst({
    where: { name: 'Mediano' },
  }))!.id;

  if (communeIds.length === 0 || !statusId || !specieId || !breedId) {
    console.error(
      'Error: Faltan datos de catálogo (Comunas, Status, Especies, Razas).',
    );
    return;
  }

  console.log(`🐾 Creando 20 mascotas de prueba...`);

  for (let i = 0; i < 20; i++) {
    const getRandomImageUrl = (seed: string) =>
      `https://loremflickr.com/500/500/dog?lock=${seed}`;

    await prisma.pet.create({
      data: {
        name: faker.animal.dog(),
        description: faker.lorem.paragraphs(2),
        shortDescription: faker.lorem.sentence(),
        color: faker.color.human(),
        distinguishingMarks: `Lunar en ${faker.animal.cat()}`,
        gender: faker.helpers.arrayElement(['Macho', 'Hembra']),

        isActive: true,
        ownerId: user.id,
        communeId: faker.helpers.arrayElement(communeIds),
        statusId: statusId,
        specieId: specieId,
        breedId: breedId,
        sizeId: sizeId,

        images: {
          createMany: {
            data: [
              { imageUrl: getRandomImageUrl(String(i * 4 + 1)), order: 0 },
              { imageUrl: getRandomImageUrl(String(i * 4 + 2)), order: 1 },
              { imageUrl: getRandomImageUrl(String(i * 4 + 3)), order: 2 },
              { imageUrl: getRandomImageUrl(String(i * 4 + 4)), order: 3 },
            ],
          },
        },
      },
    });
  }

  console.log('✅ Poblado (seeding) completado.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
