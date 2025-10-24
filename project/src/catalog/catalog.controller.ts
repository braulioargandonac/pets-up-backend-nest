import { Controller, Get, UseInterceptors } from '@nestjs/common';
import { CatalogService } from './catalog.service';
import { CacheInterceptor } from '@nestjs/cache-manager';

@UseInterceptors(CacheInterceptor)
@Controller('catalog')
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Get('pet-species')
  getPetSpecies() {
    return this.catalogService.getPetSpecies();
  }

  @Get('pet-breeds')
  getPetBreeds() {
    return this.catalogService.getPetBreeds();
  }

  @Get('pet-sizes')
  getPetSizes() {
    return this.catalogService.getPetSizes();
  }

  @Get('energy-levels')
  getEnergyLevels() {
    return this.catalogService.getEnergyLevels();
  }

  @Get('home-types')
  getHomeTypes() {
    return this.catalogService.getHomeTypes();
  }

  @Get('pet-conditions')
  getPetConditions() {
    return this.catalogService.getPetConditions();
  }

  @Get('pet-hair-types')
  getPetHairTypes() {
    return this.catalogService.getPetHairTypes();
  }

  @Get('pet-statuses')
  getPetStatuses() {
    return this.catalogService.getPetStatuses();
  }

  @Get('regions')
  getRegions() {
    return this.catalogService.getRegions();
  }

  @Get('communes')
  getCommunes() {
    return this.catalogService.getCommunes();
  }
}
