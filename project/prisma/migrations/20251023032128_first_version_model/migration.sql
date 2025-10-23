-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "phone" TEXT,
    "address" TEXT,
    "communeId" INTEGER NOT NULL,
    "shortDescription" TEXT,
    "description" TEXT,
    "reportCount" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Region" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Region_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Commune" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "regionId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Commune_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Role" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Permission" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RolePermission" (
    "id" SERIAL NOT NULL,
    "roleId" INTEGER NOT NULL,
    "permissionId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserRole" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "roleId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserRole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reward" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Reward_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserReward" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "rewardId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserReward_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PetReward" (
    "id" SERIAL NOT NULL,
    "petId" INTEGER NOT NULL,
    "rewardId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PetReward_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommunityPetReward" (
    "id" SERIAL NOT NULL,
    "communityPetId" INTEGER NOT NULL,
    "rewardId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommunityPetReward_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pet" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "shortDescription" TEXT,
    "birthDate" TIMESTAMP(3),
    "gender" TEXT,
    "reportCount" INTEGER NOT NULL DEFAULT 0,
    "visitsCount" INTEGER NOT NULL DEFAULT 0,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "ownerId" INTEGER,
    "sizeId" INTEGER,
    "energyLevelId" INTEGER,
    "homeTypeId" INTEGER,
    "conditionId" INTEGER,
    "statusId" INTEGER,
    "specieId" INTEGER,
    "breedId" INTEGER,
    "hairTypeId" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isPetFriendly" BOOLEAN NOT NULL DEFAULT true,
    "isKidFriendly" BOOLEAN NOT NULL DEFAULT true,
    "isSterilized" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "Pet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PetSize" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PetSize_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EnergyLevel" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EnergyLevel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HomeType" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HomeType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PetCondition" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PetCondition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PetStatus" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PetStatus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PetSpecie" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PetSpecie_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PetBreed" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PetBreed_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PetHairType" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PetHairType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Image" (
    "id" SERIAL NOT NULL,
    "petId" INTEGER,
    "userId" INTEGER,
    "vetId" INTEGER,
    "imageUrl" TEXT NOT NULL,
    "caption" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Image_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LostPet" (
    "id" SERIAL NOT NULL,
    "petId" INTEGER NOT NULL,
    "reportedById" INTEGER NOT NULL,
    "communeId" INTEGER NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "foundAt" TIMESTAMP(3),
    "lostAt" TIMESTAMP(3) NOT NULL,
    "description" TEXT,
    "reportCount" INTEGER NOT NULL DEFAULT 0,
    "visitsCount" INTEGER NOT NULL DEFAULT 0,
    "isResolved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LostPet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LostPetSighting" (
    "id" SERIAL NOT NULL,
    "lostPetId" INTEGER NOT NULL,
    "sightedById" INTEGER NOT NULL,
    "description" TEXT,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "sightingDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "imageUrl" TEXT NOT NULL,

    CONSTRAINT "LostPetSighting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Report" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "petId" INTEGER,
    "communityPetId" INTEGER,
    "typeId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isResolved" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReportType" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "ReportType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommunityPet" (
    "id" SERIAL NOT NULL,
    "petId" INTEGER NOT NULL,
    "communeId" INTEGER NOT NULL,
    "address" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommunityPet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vet" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "communeId" INTEGER,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "howToGoCount" INTEGER NOT NULL,
    "visitsCount" INTEGER NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Vet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Service" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Service_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VetService" (
    "id" SERIAL NOT NULL,
    "vetId" INTEGER NOT NULL,
    "serviceId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VetService_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DayOfWeek" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DayOfWeek_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VetOpeningTime" (
    "id" SERIAL NOT NULL,
    "vetId" INTEGER NOT NULL,
    "dayOfWeekId" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VetOpeningTime_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_isActive_idx" ON "User"("isActive");

-- CreateIndex
CREATE INDEX "Region_name_idx" ON "Region"("name");

-- CreateIndex
CREATE INDEX "Commune_name_idx" ON "Commune"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Role_name_key" ON "Role"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Permission_name_key" ON "Permission"("name");

-- CreateIndex
CREATE UNIQUE INDEX "RolePermission_roleId_permissionId_key" ON "RolePermission"("roleId", "permissionId");

-- CreateIndex
CREATE UNIQUE INDEX "UserRole_userId_roleId_key" ON "UserRole"("userId", "roleId");

-- CreateIndex
CREATE UNIQUE INDEX "UserReward_userId_rewardId_key" ON "UserReward"("userId", "rewardId");

-- CreateIndex
CREATE UNIQUE INDEX "PetReward_petId_rewardId_key" ON "PetReward"("petId", "rewardId");

-- CreateIndex
CREATE UNIQUE INDEX "CommunityPetReward_communityPetId_rewardId_key" ON "CommunityPetReward"("communityPetId", "rewardId");

-- CreateIndex
CREATE INDEX "Pet_name_idx" ON "Pet"("name");

-- CreateIndex
CREATE INDEX "Pet_statusId_idx" ON "Pet"("statusId");

-- CreateIndex
CREATE INDEX "Pet_isActive_idx" ON "Pet"("isActive");

-- CreateIndex
CREATE INDEX "Pet_specieId_breedId_idx" ON "Pet"("specieId", "breedId");

-- CreateIndex
CREATE INDEX "Pet_statusId_isActive_specieId_idx" ON "Pet"("statusId", "isActive", "specieId");

-- CreateIndex
CREATE UNIQUE INDEX "PetSize_name_key" ON "PetSize"("name");

-- CreateIndex
CREATE UNIQUE INDEX "EnergyLevel_name_key" ON "EnergyLevel"("name");

-- CreateIndex
CREATE UNIQUE INDEX "HomeType_name_key" ON "HomeType"("name");

-- CreateIndex
CREATE UNIQUE INDEX "PetCondition_name_key" ON "PetCondition"("name");

-- CreateIndex
CREATE UNIQUE INDEX "PetStatus_name_key" ON "PetStatus"("name");

-- CreateIndex
CREATE UNIQUE INDEX "PetSpecie_name_key" ON "PetSpecie"("name");

-- CreateIndex
CREATE UNIQUE INDEX "PetBreed_name_key" ON "PetBreed"("name");

-- CreateIndex
CREATE UNIQUE INDEX "PetHairType_name_key" ON "PetHairType"("name");

-- CreateIndex
CREATE UNIQUE INDEX "LostPet_petId_key" ON "LostPet"("petId");

-- CreateIndex
CREATE INDEX "LostPet_isResolved_idx" ON "LostPet"("isResolved");

-- CreateIndex
CREATE INDEX "LostPet_communeId_isResolved_idx" ON "LostPet"("communeId", "isResolved");

-- CreateIndex
CREATE INDEX "LostPet_latitude_longitude_idx" ON "LostPet"("latitude", "longitude");

-- CreateIndex
CREATE INDEX "LostPet_lostAt_idx" ON "LostPet"("lostAt");

-- CreateIndex
CREATE INDEX "LostPetSighting_sightingDate_idx" ON "LostPetSighting"("sightingDate");

-- CreateIndex
CREATE INDEX "LostPetSighting_latitude_longitude_idx" ON "LostPetSighting"("latitude", "longitude");

-- CreateIndex
CREATE INDEX "Report_isResolved_idx" ON "Report"("isResolved");

-- CreateIndex
CREATE INDEX "Report_typeId_isResolved_idx" ON "Report"("typeId", "isResolved");

-- CreateIndex
CREATE UNIQUE INDEX "ReportType_name_key" ON "ReportType"("name");

-- CreateIndex
CREATE UNIQUE INDEX "CommunityPet_petId_key" ON "CommunityPet"("petId");

-- CreateIndex
CREATE INDEX "CommunityPet_latitude_longitude_idx" ON "CommunityPet"("latitude", "longitude");

-- CreateIndex
CREATE INDEX "Vet_name_idx" ON "Vet"("name");

-- CreateIndex
CREATE INDEX "Vet_isVerified_idx" ON "Vet"("isVerified");

-- CreateIndex
CREATE INDEX "Vet_communeId_isVerified_idx" ON "Vet"("communeId", "isVerified");

-- CreateIndex
CREATE INDEX "Vet_latitude_longitude_idx" ON "Vet"("latitude", "longitude");

-- CreateIndex
CREATE UNIQUE INDEX "VetService_vetId_serviceId_key" ON "VetService"("vetId", "serviceId");

-- CreateIndex
CREATE UNIQUE INDEX "DayOfWeek_name_key" ON "DayOfWeek"("name");

-- CreateIndex
CREATE INDEX "VetOpeningTime_vetId_idx" ON "VetOpeningTime"("vetId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_communeId_fkey" FOREIGN KEY ("communeId") REFERENCES "Commune"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Commune" ADD CONSTRAINT "Commune_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserReward" ADD CONSTRAINT "UserReward_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserReward" ADD CONSTRAINT "UserReward_rewardId_fkey" FOREIGN KEY ("rewardId") REFERENCES "Reward"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PetReward" ADD CONSTRAINT "PetReward_petId_fkey" FOREIGN KEY ("petId") REFERENCES "Pet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PetReward" ADD CONSTRAINT "PetReward_rewardId_fkey" FOREIGN KEY ("rewardId") REFERENCES "Reward"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityPetReward" ADD CONSTRAINT "CommunityPetReward_communityPetId_fkey" FOREIGN KEY ("communityPetId") REFERENCES "CommunityPet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityPetReward" ADD CONSTRAINT "CommunityPetReward_rewardId_fkey" FOREIGN KEY ("rewardId") REFERENCES "Reward"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pet" ADD CONSTRAINT "Pet_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pet" ADD CONSTRAINT "Pet_sizeId_fkey" FOREIGN KEY ("sizeId") REFERENCES "PetSize"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pet" ADD CONSTRAINT "Pet_energyLevelId_fkey" FOREIGN KEY ("energyLevelId") REFERENCES "EnergyLevel"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pet" ADD CONSTRAINT "Pet_homeTypeId_fkey" FOREIGN KEY ("homeTypeId") REFERENCES "HomeType"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pet" ADD CONSTRAINT "Pet_conditionId_fkey" FOREIGN KEY ("conditionId") REFERENCES "PetCondition"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pet" ADD CONSTRAINT "Pet_statusId_fkey" FOREIGN KEY ("statusId") REFERENCES "PetStatus"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pet" ADD CONSTRAINT "Pet_specieId_fkey" FOREIGN KEY ("specieId") REFERENCES "PetSpecie"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pet" ADD CONSTRAINT "Pet_breedId_fkey" FOREIGN KEY ("breedId") REFERENCES "PetBreed"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pet" ADD CONSTRAINT "Pet_hairTypeId_fkey" FOREIGN KEY ("hairTypeId") REFERENCES "PetHairType"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Image" ADD CONSTRAINT "Image_petId_fkey" FOREIGN KEY ("petId") REFERENCES "Pet"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Image" ADD CONSTRAINT "Image_vetId_fkey" FOREIGN KEY ("vetId") REFERENCES "Vet"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Image" ADD CONSTRAINT "Image_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LostPet" ADD CONSTRAINT "LostPet_petId_fkey" FOREIGN KEY ("petId") REFERENCES "Pet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LostPet" ADD CONSTRAINT "LostPet_reportedById_fkey" FOREIGN KEY ("reportedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LostPet" ADD CONSTRAINT "LostPet_communeId_fkey" FOREIGN KEY ("communeId") REFERENCES "Commune"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LostPetSighting" ADD CONSTRAINT "LostPetSighting_lostPetId_fkey" FOREIGN KEY ("lostPetId") REFERENCES "LostPet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LostPetSighting" ADD CONSTRAINT "LostPetSighting_sightedById_fkey" FOREIGN KEY ("sightedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_petId_fkey" FOREIGN KEY ("petId") REFERENCES "Pet"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_communityPetId_fkey" FOREIGN KEY ("communityPetId") REFERENCES "CommunityPet"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_typeId_fkey" FOREIGN KEY ("typeId") REFERENCES "ReportType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityPet" ADD CONSTRAINT "CommunityPet_petId_fkey" FOREIGN KEY ("petId") REFERENCES "Pet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityPet" ADD CONSTRAINT "CommunityPet_communeId_fkey" FOREIGN KEY ("communeId") REFERENCES "Commune"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vet" ADD CONSTRAINT "Vet_communeId_fkey" FOREIGN KEY ("communeId") REFERENCES "Commune"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vet" ADD CONSTRAINT "Vet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VetService" ADD CONSTRAINT "VetService_vetId_fkey" FOREIGN KEY ("vetId") REFERENCES "Vet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VetService" ADD CONSTRAINT "VetService_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VetOpeningTime" ADD CONSTRAINT "VetOpeningTime_vetId_fkey" FOREIGN KEY ("vetId") REFERENCES "Vet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VetOpeningTime" ADD CONSTRAINT "VetOpeningTime_dayOfWeekId_fkey" FOREIGN KEY ("dayOfWeekId") REFERENCES "DayOfWeek"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
