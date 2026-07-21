-- CreateEnum
CREATE TYPE "ImageStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "Image" (
    "id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "filepath" TEXT NOT NULL,
    "mimeType" TEXT,
    "sizeBytes" INTEGER,
    "status" "ImageStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Image_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Analysis" (
    "id" TEXT NOT NULL,
    "imageId" TEXT NOT NULL,
    "blurScore" DOUBLE PRECISION,
    "isBlurry" BOOLEAN,
    "brightness" DOUBLE PRECISION,
    "brightnessOk" BOOLEAN,
    "perceptualHash" TEXT,
    "isDuplicate" BOOLEAN DEFAULT false,
    "duplicateOfId" TEXT,
    "ocrText" TEXT,
    "numberPlate" TEXT,
    "numberPlateValid" BOOLEAN,
    "width" INTEGER,
    "height" INTEGER,
    "dimensionsOk" BOOLEAN,
    "metadata" JSONB,
    "metadataOk" BOOLEAN,
    "confidence" DOUBLE PRECISION,
    "issues" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "failureReason" TEXT,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Analysis_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Image_status_idx" ON "Image"("status");

-- CreateIndex
CREATE INDEX "Image_createdAt_idx" ON "Image"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Analysis_imageId_key" ON "Analysis"("imageId");

-- CreateIndex
CREATE INDEX "Analysis_perceptualHash_idx" ON "Analysis"("perceptualHash");

-- CreateIndex
CREATE INDEX "Analysis_numberPlate_idx" ON "Analysis"("numberPlate");

-- AddForeignKey
ALTER TABLE "Analysis" ADD CONSTRAINT "Analysis_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "Image"("id") ON DELETE CASCADE ON UPDATE CASCADE;
