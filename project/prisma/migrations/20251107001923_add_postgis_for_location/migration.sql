/*
  Warnings:

  - You are about to drop the column `latitude` on the `Vet` table. All the data in the column will be lost.
  - You are about to drop the column `longitude` on the `Vet` table. All the data in the column will be lost.

*/
-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "postgis";

-- DropIndex
DROP INDEX "public"."Vet_latitude_longitude_idx";

-- AlterTable
ALTER TABLE "Vet" DROP COLUMN "latitude",
DROP COLUMN "longitude",
ADD COLUMN     "googleMapsUrl" TEXT,
ADD COLUMN     "location" geography(Point, 4326);

-- CreateIndex
CREATE INDEX "Vet_location_idx" ON "Vet" USING GIST ("location");
