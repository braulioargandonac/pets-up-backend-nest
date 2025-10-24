import { Module } from '@nestjs/common';
import { PetsController } from './pets.controller';
import { PetsService } from './pets.service';
import { LostPetsModule } from 'src/lost-pets/lost-pets.module';

@Module({
  imports: [LostPetsModule],
  controllers: [PetsController],
  providers: [PetsService],
})
export class PetsModule {}
