-- AlterTable
ALTER TABLE "NonTeachingStaff" ADD COLUMN     "phone" VARCHAR(20) NOT NULL DEFAULT '';

-- CreateIndex
CREATE UNIQUE INDEX "NonTeachingStaff_phone_key" ON "NonTeachingStaff"("phone");

