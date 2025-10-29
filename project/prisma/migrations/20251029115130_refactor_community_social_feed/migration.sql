/*
  Warnings:

  - You are about to drop the column `communityPetId` on the `CommunityPetComment` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `CommunityPetComment` table. All the data in the column will be lost.
  - Added the required column `postId` to the `CommunityPetComment` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."CommunityPetComment" DROP CONSTRAINT "CommunityPetComment_communityPetId_fkey";

-- AlterTable
ALTER TABLE "CommunityPetComment" DROP COLUMN "communityPetId",
DROP COLUMN "updatedAt",
ADD COLUMN     "postId" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "CommunityPetPost" (
    "id" SERIAL NOT NULL,
    "communityPetId" INTEGER NOT NULL,
    "authorId" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "imageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommunityPetPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommunityPetPostLike" (
    "id" SERIAL NOT NULL,
    "postId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "CommunityPetPostLike_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CommunityPetPost_communityPetId_createdAt_idx" ON "CommunityPetPost"("communityPetId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "CommunityPetPostLike_postId_userId_key" ON "CommunityPetPostLike"("postId", "userId");

-- CreateIndex
CREATE INDEX "CommunityPetComment_postId_createdAt_idx" ON "CommunityPetComment"("postId", "createdAt");

-- AddForeignKey
ALTER TABLE "CommunityPetPost" ADD CONSTRAINT "CommunityPetPost_communityPetId_fkey" FOREIGN KEY ("communityPetId") REFERENCES "CommunityPet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityPetPost" ADD CONSTRAINT "CommunityPetPost_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityPetPostLike" ADD CONSTRAINT "CommunityPetPostLike_postId_fkey" FOREIGN KEY ("postId") REFERENCES "CommunityPetPost"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityPetPostLike" ADD CONSTRAINT "CommunityPetPostLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityPetComment" ADD CONSTRAINT "CommunityPetComment_postId_fkey" FOREIGN KEY ("postId") REFERENCES "CommunityPetPost"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
