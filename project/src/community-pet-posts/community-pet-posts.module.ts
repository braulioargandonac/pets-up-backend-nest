import { Module } from '@nestjs/common';
import { CommunityPetPostsController } from './community-pet-posts.controller';
import { CommunityPetPostsService } from './community-pet-posts.service';

@Module({
  controllers: [CommunityPetPostsController],
  providers: [CommunityPetPostsService],
  exports: [CommunityPetPostsService],
})
export class CommunityPetPostsModule {}
