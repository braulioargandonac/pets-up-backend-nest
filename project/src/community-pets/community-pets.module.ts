import { Module } from '@nestjs/common';
import { CommunityPetsController } from './community-pets.controller';
import { CommunityPetsService } from './community-pets.service';

@Module({
  controllers: [CommunityPetsController],
  providers: [CommunityPetsService],
})
export class CommunityPetsModule {}
