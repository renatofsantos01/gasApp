-- AlterTable: add LGPD and deliverer location fields to user
ALTER TABLE "user" ADD COLUMN "lgpdacceptedat" TIMESTAMP(3);
ALTER TABLE "user" ADD COLUMN "available" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "user" ADD COLUMN "latitude" DOUBLE PRECISION;
ALTER TABLE "user" ADD COLUMN "longitude" DOUBLE PRECISION;
ALTER TABLE "user" ADD COLUMN "locationupdatedat" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "user_available_idx" ON "user"("available");
