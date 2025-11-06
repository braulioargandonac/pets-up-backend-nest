/*
  Warnings:

  - You are about to drop the column `communityPetId` on the `Report` table. All the data in the column will be lost.
  - You are about to drop the column `imageUrl` on the `Report` table. All the data in the column will be lost.
  - You are about to drop the column `petId` on the `Report` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `Report` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `Report` table. All the data in the column will be lost.
  - Added the required column `reporterId` to the `Report` table without a default value. This is not possible if the table is not empty.
  - Made the column `description` on table `Report` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "public"."Report" DROP CONSTRAINT "Report_communityPetId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Report" DROP CONSTRAINT "Report_petId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Report" DROP CONSTRAINT "Report_userId_fkey";

-- DropIndex
DROP INDEX "public"."Report_typeId_isResolved_idx";

-- AlterTable
ALTER TABLE "Report" DROP COLUMN "communityPetId",
DROP COLUMN "imageUrl",
DROP COLUMN "petId",
DROP COLUMN "title",
DROP COLUMN "userId",
ADD COLUMN     "reportedCommentId" INTEGER,
ADD COLUMN     "reportedCommunityPetId" INTEGER,
ADD COLUMN     "reportedPetId" INTEGER,
ADD COLUMN     "reportedPostId" INTEGER,
ADD COLUMN     "reportedUserId" INTEGER,
ADD COLUMN     "reporterId" INTEGER NOT NULL,
ALTER COLUMN "description" SET NOT NULL;

-- CreateIndex
CREATE INDEX "Report_reportedPetId_idx" ON "Report"("reportedPetId");

-- CreateIndex
CREATE INDEX "Report_reportedCommunityPetId_idx" ON "Report"("reportedCommunityPetId");

-- CreateIndex
CREATE INDEX "Report_reportedPostId_idx" ON "Report"("reportedPostId");

-- CreateIndex
CREATE INDEX "Report_reportedCommentId_idx" ON "Report"("reportedCommentId");

-- CreateIndex
CREATE INDEX "Report_reportedUserId_idx" ON "Report"("reportedUserId");

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_reportedPetId_fkey" FOREIGN KEY ("reportedPetId") REFERENCES "Pet"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_reportedCommunityPetId_fkey" FOREIGN KEY ("reportedCommunityPetId") REFERENCES "CommunityPet"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_reportedPostId_fkey" FOREIGN KEY ("reportedPostId") REFERENCES "CommunityPetPost"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_reportedCommentId_fkey" FOREIGN KEY ("reportedCommentId") REFERENCES "CommunityPetComment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_reportedUserId_fkey" FOREIGN KEY ("reportedUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
