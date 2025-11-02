/*
  Warnings:

  - You are about to drop the `Branch` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."Branch" DROP CONSTRAINT "Branch_collegeId_fkey";

-- DropTable
DROP TABLE "public"."Branch";

-- CreateTable
CREATE TABLE "Course" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "shortName" VARCHAR(50) NOT NULL,
    "collegeId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Course_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Course" ADD CONSTRAINT "Course_collegeId_fkey" FOREIGN KEY ("collegeId") REFERENCES "College"("id") ON DELETE CASCADE ON UPDATE CASCADE;
