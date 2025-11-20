/*
  Warnings:

  - You are about to drop the column `latitude` on the `CommunityPet` table. All the data in the column will be lost.
  - You are about to drop the column `longitude` on the `CommunityPet` table. All the data in the column will be lost.
  - You are about to drop the column `latitude` on the `LostPet` table. All the data in the column will be lost.
  - You are about to drop the column `longitude` on the `LostPet` table. All the data in the column will be lost.
  - You are about to drop the column `latitude` on the `LostPetSighting` table. All the data in the column will be lost.
  - You are about to drop the column `longitude` on the `LostPetSighting` table. All the data in the column will be lost.
  - Added the required column `location` to the `CommunityPet` table without a default value. This is not possible if the table is not empty.
  - Added the required column `location` to the `LostPet` table without a default value. This is not possible if the table is not empty.
  - Added the required column `location` to the `LostPetSighting` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "public"."CommunityPet_latitude_longitude_idx";

-- DropIndex
DROP INDEX "public"."LostPet_latitude_longitude_idx";

-- DropIndex
DROP INDEX "public"."LostPetSighting_latitude_longitude_idx";

-- AlterTable
ALTER TABLE "CommunityPet" DROP COLUMN "latitude",
DROP COLUMN "longitude",
ADD COLUMN     "location" geography(Point, 4326) NOT NULL;

-- AlterTable
ALTER TABLE "LostPet" DROP COLUMN "latitude",
DROP COLUMN "longitude",
ADD COLUMN     "location" geography(Point, 4326) NOT NULL;

-- AlterTable
ALTER TABLE "LostPetSighting" DROP COLUMN "latitude",
DROP COLUMN "longitude",
ADD COLUMN     "location" geography(Point, 4326) NOT NULL;

-- CreateIndex
CREATE INDEX "CommunityPet_location_idx" ON "CommunityPet" USING GIST ("location");

-- CreateIndex
CREATE INDEX "LostPet_location_idx" ON "LostPet" USING GIST ("location");

-- CreateIndex
CREATE INDEX "LostPetSighting_location_idx" ON "LostPetSighting" USING GIST ("location");
