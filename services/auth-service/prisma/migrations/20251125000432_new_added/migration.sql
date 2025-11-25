/*
  Warnings:

  - A unique constraint covering the columns `[phone]` on the table `Student` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `gender` to the `Student` table without a default value. This is not possible if the table is not empty.
  - Added the required column `phone` to the `Student` table without a default value. This is not possible if the table is not empty.
  - Added the required column `gender` to the `Teacher` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER');

-- AlterTable
ALTER TABLE "Student" ADD COLUMN     "gender" "Gender" NOT NULL,
ADD COLUMN     "phone" VARCHAR(20) NOT NULL;

-- AlterTable
ALTER TABLE "Teacher" ADD COLUMN     "gender" "Gender" NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Student_phone_key" ON "Student"("phone");
