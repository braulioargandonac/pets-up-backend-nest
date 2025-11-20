import { PrismaClient, Prisma, Temperament } from '@prisma/client';
import { faker } from '@faker-js/faker/locale/es_MX';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const BASE_LAT = -33.6119;
const BASE_LON = -70.5763;

const getRandomLocation = () => {
  const r = 0.04;
  return {
    latitude: BASE_LAT + (Math.random() - 0.5) * r,
    longitude: BASE_LON + (Math.random() - 0.5) * r,
  };
};

async function main() {
  console.log('🌱 Empezando el poblado con PostGIS...');
  const saltOrRounds = 10;
  const hashedPassword = await bcrypt.hash('password123', saltOrRounds);

  let user = await prisma.user.findFirst({
    where: { email: 'prueba@test.com' },
  });
  if (!user) {
    user = await prisma.user.create({
      data: {
        email: 'prueba@test.com',
        name: 'Usuario de Prueba',
        password: hashedPassword,
        communeId: 135,
        phone: '+56912345678',
        shortDescription: 'Rescatista activo de Puente Alto.',
      },
    });
    await prisma.userRole.create({ data: { userId: user.id, roleId: 2 } });
    console.log('👤 Usuario creado: prueba@test.com');
  }

  let vetUser = await prisma.user.findFirst({
    where: { email: 'vet@test.com' },
  });
  if (!vetUser) {
    vetUser = await prisma.user.create({
      data: {
        email: 'vet@test.com',
        name: 'Dr. Veterinario',
        password: hashedPassword,
        communeId: 135,
        phone: '+56987654321',
      },
    });
    await prisma.userRole.create({ data: { userId: vetUser.id, roleId: 3 } });
    console.log('👨‍⚕️ Usuario Vet creado: vet@test.com');
  }

  const communeIds = (
    await prisma.commune.findMany({ select: { id: true } })
  ).map((c) => c.id);
  const dogSpecie = await prisma.petSpecie.findFirst({
    where: { name: 'Perro' },
  });
  const catSpecie = await prisma.petSpecie.findFirst({
    where: { name: 'Gato' },
  });
  const statusAdoption = await prisma.petStatus.findFirst({
    where: { name: 'En adopción' },
  });
  const statusLost = await prisma.petStatus.findFirst({
    where: { name: 'Perdido' },
  });

  const breeds = await prisma.petBreed.findMany();
  const sizes = await prisma.petSize.findMany();
  const energyLevels = await prisma.energyLevel.findMany();
  const homeTypes = await prisma.homeType.findMany();
  const conditions = await prisma.petCondition.findMany();
  const hairTypes = await prisma.petHairType.findMany();

  if (!dogSpecie || !statusAdoption)
    return console.error('❌ Faltan catálogos.');

  console.log(`🐾 Generando 60 mascotas...`);

  for (let i = 0; i < 60; i++) {
    const isDog = Math.random() > 0.3;
    const specie = isDog ? dogSpecie : catSpecie;
    const keyword = isDog ? 'dog' : 'cat';

    const randStatus = Math.random();
    let statusId = statusAdoption.id;
    if (randStatus > 0.7) statusId = statusLost!.id;

    const getRandomImageUrl = (seed: string) =>
      `https://loremflickr.com/500/500/${keyword}?lock=${seed}`;

    const pet = await prisma.pet.create({
      data: {
        name: isDog ? faker.animal.dog() : faker.animal.cat(),
        description: faker.lorem.paragraph(),
        shortDescription: faker.lorem.sentence(),
        birthDate: faker.date.past({ years: 8 }),
        gender: faker.helpers.arrayElement(['Macho', 'Hembra']),
        color: faker.color.human(),
        distinguishingMarks: 'Ninguna',

        isActive: true,
        isSterilized: true,
        isKidFriendly: true,
        isPetFriendly: true,

        ownerId: user.id,
        communeId: faker.helpers.arrayElement(communeIds),
        statusId: statusId,
        specieId: specie?.id,
        breedId: faker.helpers.arrayElement(breeds).id,
        sizeId: faker.helpers.arrayElement(sizes).id,
        energyLevelId: faker.helpers.arrayElement(energyLevels).id,
        homeTypeId: faker.helpers.arrayElement(homeTypes).id,
        conditionId: faker.helpers.arrayElement(conditions).id,
        hairTypeId: faker.helpers.arrayElement(hairTypes).id,

        images: {
          createMany: {
            data: [
              {
                imageUrl: getRandomImageUrl(String(i * 10 + 1)),
                order: 0,
                isActive: true,
              },
              {
                imageUrl: getRandomImageUrl(String(i * 10 + 2)),
                order: 1,
                isActive: true,
              },
            ],
          },
        },
      },
    });

    if (statusId === statusLost!.id) {
      const loc = getRandomLocation();
      const locationQuery = Prisma.sql`ST_SetSRID(ST_MakePoint(${loc.longitude}, ${loc.latitude}), 4326)`;
      const lostAtDate = faker.date.recent({ days: 10 }).toISOString();

      await prisma.$queryRaw`
        INSERT INTO "LostPet" (
          "petId", "reportedById", "communeId", "location", 
          "lostAt", "description", "isResolved", "createdAt"
        ) VALUES (
          ${pet.id}, ${user.id}, ${pet.communeId}, ${locationQuery},
          ${lostAtDate}::timestamp, 'Se escapó de la casa.', false, NOW()
        )
      `;
    }
  }

  console.log(`🏘️ Generando 10 mascotas comunitarias...`);
  for (let i = 0; i < 10; i++) {
    const loc = getRandomLocation();
    const keyword = 'dog';
    const locationQuery = Prisma.sql`ST_SetSRID(ST_MakePoint(${loc.longitude}, ${loc.latitude}), 4326)`;

    const temperaments = [Temperament.JUGUETON, Temperament.BUENO_CON_NINOS];

    const result = await prisma.$queryRaw<[{ id: number }]>`
      INSERT INTO "CommunityPet" (
        "name", "description", "color", "careInstructions", 
        "communeId", "address", "location", 
        "specieId", "createdById", "isActive", "temperamentTags", "createdAt"
      ) VALUES (
        ${`Comunitario ${faker.person.firstName()}`}, 'El perro del barrio', ${faker.color.human()}, 'No dar dulces',
        135, ${faker.location.streetAddress()}, ${locationQuery},
        ${dogSpecie.id}, ${user.id}, true, ${temperaments}::"Temperament"[], NOW()
      )
      RETURNING id
    `;
    const comPetId = result[0].id;

    await prisma.communityPetImage.create({
      data: {
        communityPetId: comPetId,
        uploadedById: user.id,
        imageUrl: `https://loremflickr.com/500/500/${keyword}?lock=${900 + i}`,
        order: 0,
        isActive: true,
      },
    });
  }

  console.log(`🏥 Generando 5 veterinarias...`);
  const vetServices = await prisma.service.findMany();

  for (let i = 0; i < 5; i++) {
    const loc = getRandomLocation();
    const name = `${faker.company.name()} Vet`;
    const locationQuery = Prisma.sql`ST_SetSRID(ST_MakePoint(${loc.longitude}, ${loc.latitude}), 4326)`;

    const vetResult = await prisma.$queryRaw<[{ id: number }]>`
      INSERT INTO "Vet" (
        "name", "address", "phone", "email", "description", 
        "communeId", "userId", "location", 
        "isVerified", "isActive", "howToGoCount", "visitsCount"
      ) VALUES (
        ${name}, ${faker.location.streetAddress()}, ${faker.phone.number()}, ${faker.internet.email()}, 
        ${faker.lorem.sentence()}, 
        135, ${vetUser.id}, ${locationQuery}, 
        true, true, 0, 0
      )
      RETURNING id
    `;
    const vetId = vetResult[0].id;

    await prisma.vetService.create({
      data: { vetId, serviceId: vetServices[0].id },
    });
    for (let d = 1; d <= 5; d++) {
      await prisma.vetOpeningTime.create({
        data: { vetId, dayOfWeekId: d, startTime: '09:00', endTime: '18:00' },
      });
    }
    await prisma.vetImage.create({
      data: {
        vetId,
        imageUrl: `https://loremflickr.com/300/300/business,logo?lock=${i}`,
        isLogo: true,
      },
    });
  }

  console.log('✅ SEED COMPLETADO.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
