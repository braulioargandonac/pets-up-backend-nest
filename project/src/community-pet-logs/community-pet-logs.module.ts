import { Module } from '@nestjs/common';
import { CommunityPetLogsController } from './community-pet-logs.controller';
import { CommunityPetLogsService } from './community-pet-logs.service';

@Module({
  controllers: [CommunityPetLogsController],
  providers: [CommunityPetLogsService]
})
export class CommunityPetLogsModule {}
