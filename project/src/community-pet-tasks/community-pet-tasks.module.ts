import { Module } from '@nestjs/common';
import { CommunityPetTasksController } from './community-pet-tasks.controller';
import { CommunityPetTasksService } from './community-pet-tasks.service';

@Module({
  controllers: [CommunityPetTasksController],
  providers: [CommunityPetTasksService]
})
export class CommunityPetTasksModule {}
