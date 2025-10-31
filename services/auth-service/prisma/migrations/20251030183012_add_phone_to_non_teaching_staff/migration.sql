-- AlterTable
ALTER TABLE "NonTeachingStaff" ADD COLUMN     "phone" VARCHAR(20) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "NonTeachingStaff_phone_key" ON "NonTeachingStaff"("phone");


