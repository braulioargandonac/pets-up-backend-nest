/*
  Warnings:

  - You are about to drop the `Image` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `name` to the `CommunityPet` table without a default value. This is not possible if the table is not empty.
  - Added the required column `specieId` to the `CommunityPet` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "LogType" AS ENUM ('HEALTH', 'VET_VISIT', 'FOOD', 'BEHAVIOR', 'EVENT', 'OTHER');

-- DropForeignKey
ALTER TABLE "public"."CommunityPet" DROP CONSTRAINT "CommunityPet_petId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Image" DROP CONSTRAINT "Image_petId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Image" DROP CONSTRAINT "Image_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Image" DROP CONSTRAINT "Image_vetId_fkey";

-- DropIndex
DROP INDEX "public"."CommunityPet_petId_key";

-- AlterTable
ALTER TABLE "CommunityPet" ADD COLUMN     "breedId" INTEGER,
ADD COLUMN     "careInstructions" TEXT,
ADD COLUMN     "color" TEXT,
ADD COLUMN     "distinguishingMarks" TEXT,
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "specieId" INTEGER NOT NULL,
ADD COLUMN     "temperament" TEXT,
ALTER COLUMN "petId" DROP NOT NULL;

-- DropTable
DROP TABLE "public"."Image";

-- CreateTable
CREATE TABLE "UserImage" (
    "id" SERIAL NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "caption" TEXT,
    "userId" INTEGER NOT NULL,
    "isProfile" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PetImage" (
    "id" SERIAL NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "caption" TEXT,
    "petId" INTEGER NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PetImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommunityPetImage" (
    "id" SERIAL NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "caption" TEXT,
    "communityPetId" INTEGER NOT NULL,
    "uploadedById" INTEGER NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommunityPetImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommunityPetComment" (
    "id" SERIAL NOT NULL,
    "communityPetId" INTEGER NOT NULL,
    "authorId" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommunityPetComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommunityPetLog" (
    "id" SERIAL NOT NULL,
    "communityPetId" INTEGER NOT NULL,
    "authorId" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "logType" "LogType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommunityPetLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommunityPetTask" (
    "id" SERIAL NOT NULL,
    "communityPetId" INTEGER NOT NULL,
    "authorId" INTEGER NOT NULL,
    "assigneeId" INTEGER,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "CommunityPetTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VetImage" (
    "id" SERIAL NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "caption" TEXT,
    "vetId" INTEGER NOT NULL,
    "isLogo" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VetImage_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "UserImage" ADD CONSTRAINT "UserImage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PetImage" ADD CONSTRAINT "PetImage_petId_fkey" FOREIGN KEY ("petId") REFERENCES "Pet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityPet" ADD CONSTRAINT "CommunityPet_specieId_fkey" FOREIGN KEY ("specieId") REFERENCES "PetSpecie"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityPet" ADD CONSTRAINT "CommunityPet_breedId_fkey" FOREIGN KEY ("breedId") REFERENCES "PetBreed"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityPet" ADD CONSTRAINT "CommunityPet_petId_fkey" FOREIGN KEY ("petId") REFERENCES "Pet"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityPetImage" ADD CONSTRAINT "CommunityPetImage_communityPetId_fkey" FOREIGN KEY ("communityPetId") REFERENCES "CommunityPet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityPetImage" ADD CONSTRAINT "CommunityPetImage_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityPetComment" ADD CONSTRAINT "CommunityPetComment_communityPetId_fkey" FOREIGN KEY ("communityPetId") REFERENCES "CommunityPet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityPetComment" ADD CONSTRAINT "CommunityPetComment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityPetLog" ADD CONSTRAINT "CommunityPetLog_communityPetId_fkey" FOREIGN KEY ("communityPetId") REFERENCES "CommunityPet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityPetLog" ADD CONSTRAINT "CommunityPetLog_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityPetTask" ADD CONSTRAINT "CommunityPetTask_communityPetId_fkey" FOREIGN KEY ("communityPetId") REFERENCES "CommunityPet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityPetTask" ADD CONSTRAINT "CommunityPetTask_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityPetTask" ADD CONSTRAINT "CommunityPetTask_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VetImage" ADD CONSTRAINT "VetImage_vetId_fkey" FOREIGN KEY ("vetId") REFERENCES "Vet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
