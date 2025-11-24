/*
  Warnings:

  - The `name` column on the `Course` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `shortName` column on the `Course` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "CourseShortName" AS ENUM ('BTECH', 'MTECH', 'BCA', 'MCA');

-- CreateEnum
CREATE TYPE "CourseName" AS ENUM ('Bachelor of Technology', 'Master of Technology', 'Bachelor of Computer Applications', 'Master of Computer Applications');

-- AlterTable
ALTER TABLE "Batch" ALTER COLUMN "batchYear" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "Course" DROP COLUMN "name",
ADD COLUMN     "name" "CourseName" NOT NULL DEFAULT 'Bachelor of Technology',
DROP COLUMN "shortName",
ADD COLUMN     "shortName" "CourseShortName" NOT NULL DEFAULT 'BTECH';
