import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { PetsModule } from './pets/pets.module';
import { CacheModule } from '@nestjs/cache-manager';
import { UsersModule } from './users/users.module';
import { LostPetsModule } from './lost-pets/lost-pets.module';
import { CatalogModule } from './catalog/catalog.module';
import { CommunityPetsModule } from './community-pets/community-pets.module';
import { CommunityPetLogsModule } from './community-pet-logs/community-pet-logs.module';
import { CommunityPetTasksModule } from './community-pet-tasks/community-pet-tasks.module';
import { CommunityPetPostsModule } from './community-pet-posts/community-pet-posts.module';
import { CommunityPetCommentsModule } from './community-pet-comments/community-pet-comments.module';

@Module({
  imports: [
    CacheModule.register({
      isGlobal: true,
      ttl: 60 * 60 * 24,
    }),
    ConfigModule.forRoot({
      envFilePath: `.env.${process.env.NODE_ENV || 'development'}`,
      isGlobal: true,
    }),
    PrismaModule,
    AuthModule,
    CatalogModule,
    UsersModule,
    PetsModule,
    LostPetsModule,
    CommunityPetsModule,
    CommunityPetLogsModule,
    CommunityPetTasksModule,
    CommunityPetPostsModule,
    CommunityPetCommentsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
