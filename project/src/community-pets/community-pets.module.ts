import { Module } from '@nestjs/common';
import { CommunityPetsController } from './community-pets.controller';
import { CommunityPetsService } from './community-pets.service';
import { CommunityPetPostsModule } from 'src/community-pet-posts/community-pet-posts.module';

@Module({
  imports: [CommunityPetPostsModule],
  controllers: [CommunityPetsController],
  providers: [CommunityPetsService],
})
export class CommunityPetsModule {}
