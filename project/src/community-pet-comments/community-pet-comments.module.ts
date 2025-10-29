import { Module } from '@nestjs/common';
import { CommunityPetCommentsController } from './community-pet-comments.controller';
import { CommunityPetCommentsService } from './community-pet-comments.service';

@Module({
  controllers: [CommunityPetCommentsController],
  providers: [CommunityPetCommentsService]
})
export class CommunityPetCommentsModule {}
