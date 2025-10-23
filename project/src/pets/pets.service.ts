import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePetDto } from './dto/create-pet.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class PetsService {
  constructor(private prisma: PrismaService) {}

  async create(
    createPetDto: CreatePetDto,
    ownerId: number,
    fileUrls: string[],
  ) {
    try {
      const {
        sizeId,
        energyLevelId,
        homeTypeId,
        conditionId,
        statusId,
        specieId,
        breedId,
        hairTypeId,
        ...primitiveData
      } = createPetDto;

      const newPet = await this.prisma.$transaction(async (tx) => {
        const petData: Prisma.PetCreateInput = {
          ...primitiveData,
          owner: {
            connect: { id: ownerId },
          },
          ...(sizeId && { size: { connect: { id: sizeId } } }),
          ...(energyLevelId && {
            energyLevel: { connect: { id: energyLevelId } },
          }),
          ...(homeTypeId && { homeType: { connect: { id: homeTypeId } } }),
          ...(conditionId && {
            condition: { connect: { id: conditionId } },
          }),
          ...(statusId && { status: { connect: { id: statusId } } }),
          ...(specieId && { specie: { connect: { id: specieId } } }),
          ...(breedId && { breed: { connect: { id: breedId } } }),
          ...(hairTypeId && { hairType: { connect: { id: hairTypeId } } }),
        };

        const pet = await tx.pet.create({
          data: petData,
        });

        const imagesData = fileUrls.map((url, index) => ({
          petId: pet.id,
          imageUrl: url,
          caption:
            index === 0
              ? `Foto principal de ${pet.name}`
              : `Foto ${index + 1} de ${pet.name}`,
        }));

        await tx.image.createMany({
          data: imagesData,
        });

        return pet;
      });

      return newPet;
    } catch (error) {
      console.error('Error al crear la mascota:', error);
      if (error instanceof Prisma.PrismaClientValidationError) {
        throw new InternalServerErrorException(
          `Error de validación de Prisma: ${error.message}`,
        );
      }
      throw new InternalServerErrorException(
        'Error al crear la mascota en la base de datos.',
      );
    }
  }

  /**
   * Devuelve una lista de mascotas para el feed principal.
   * Incluye la imagen principal y datos básicos.
   */
  async findAll() {
    return this.prisma.pet.findMany({
      where: {
        statusId: 1,
      },
      include: {
        images: {
          take: 1,
          orderBy: { createdAt: 'asc' },
        },
        specie: true,
        breed: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Devuelve el perfil completo de UNA mascota.
   */
  async findOne(id: number) {
    const pet = await this.prisma.pet.findUnique({
      where: { id: id },
      include: {
        images: true,
        owner: {
          select: {
            id: true,
            name: true,
            phone: true,
            shortDescription: true,
          },
        },
        size: true,
        energyLevel: true,
        homeType: true,
        condition: true,
        status: true,
        specie: true,
        breed: true,
        hairType: true,
      },
    });

    if (!pet) {
      throw new NotFoundException(`Mascota con ID ${id} no encontrada`);
    }

    return pet;
  }
}
