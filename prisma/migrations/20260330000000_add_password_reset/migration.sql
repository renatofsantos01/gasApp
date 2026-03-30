-- AlterTable: add password reset fields to user
ALTER TABLE "user" ADD COLUMN "passwordresetcode" TEXT;
ALTER TABLE "user" ADD COLUMN "passwordresetexpiresat" TIMESTAMP(3);
