/*
  Warnings:

  - You are about to drop the column `temperament` on the `CommunityPet` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "Temperament" AS ENUM ('JUGUETON', 'TIMIDO', 'TRANQUILO', 'REACTIVO_PERROS', 'REACTIVO_HUMANOS', 'BUENO_CON_NINOS', 'BUENO_CON_GATOS', 'GUARDIAN', 'OTRO');

-- AlterTable
ALTER TABLE "CommunityPet" DROP COLUMN "temperament",
ADD COLUMN     "temperamentTags" "Temperament"[];
