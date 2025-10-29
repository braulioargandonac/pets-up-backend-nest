/*
  Warnings:

  - You are about to drop the column `petId` on the `CommunityPet` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."CommunityPet" DROP CONSTRAINT "CommunityPet_petId_fkey";

-- AlterTable
ALTER TABLE "CommunityPet" DROP COLUMN "petId";

-- AlterTable
ALTER TABLE "PetImage" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true;
