import { Module } from '@nestjs/common';
import { CommunityPetPostsController } from './community-pet-posts.controller';
import { CommunityPetPostsService } from './community-pet-posts.service';
import { CommunityPetCommentsModule } from 'src/community-pet-comments/community-pet-comments.module';

@Module({
  imports: [CommunityPetCommentsModule],
  controllers: [CommunityPetPostsController],
  providers: [CommunityPetPostsService],
  exports: [CommunityPetPostsService],
})
export class CommunityPetPostsModule {}
