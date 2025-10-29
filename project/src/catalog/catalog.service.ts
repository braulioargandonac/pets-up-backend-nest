import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LogType } from '@prisma/client';

@Injectable()
export class CatalogService {
  constructor(private prisma: PrismaService) {}

  getPetSpecies() {
    return this.prisma.petSpecie.findMany({ orderBy: { id: 'asc' } });
  }

  getPetBreeds() {
    return this.prisma.petBreed.findMany({ orderBy: { id: 'asc' } });
  }

  getPetSizes() {
    return this.prisma.petSize.findMany({ orderBy: { id: 'asc' } });
  }

  getEnergyLevels() {
    return this.prisma.energyLevel.findMany({ orderBy: { id: 'asc' } });
  }

  getHomeTypes() {
    return this.prisma.homeType.findMany({ orderBy: { id: 'asc' } });
  }

  getPetConditions() {
    return this.prisma.petCondition.findMany({ orderBy: { id: 'asc' } });
  }

  getPetHairTypes() {
    return this.prisma.petHairType.findMany({ orderBy: { id: 'asc' } });
  }

  getPetStatuses() {
    return this.prisma.petStatus.findMany({ orderBy: { id: 'asc' } });
  }

  getRegions() {
    return this.prisma.region.findMany({ orderBy: { id: 'asc' } });
  }

  getCommunes() {
    return this.prisma.commune.findMany({ orderBy: { id: 'asc' } });
  }

  getLogTypes() {
    return Object.values(LogType);
  }
}
