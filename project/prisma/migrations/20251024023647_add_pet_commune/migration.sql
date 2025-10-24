-- AlterTable
ALTER TABLE "Pet" ADD COLUMN     "communeId" INTEGER;

-- AddForeignKey
ALTER TABLE "Pet" ADD CONSTRAINT "Pet_communeId_fkey" FOREIGN KEY ("communeId") REFERENCES "Commune"("id") ON DELETE SET NULL ON UPDATE CASCADE;
