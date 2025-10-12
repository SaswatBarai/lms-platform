-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('studentsection', 'regestral', 'adminstractor');

-- CreateTable
CREATE TABLE "organizations" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "recovery_email" VARCHAR(255) NOT NULL,
    "address" TEXT NOT NULL,
    "phone" VARCHAR(20) NOT NULL,
    "total_students" INTEGER NOT NULL DEFAULT 0,
    "total_teachers" INTEGER NOT NULL DEFAULT 0,
    "total_deans" INTEGER NOT NULL DEFAULT 0,
    "total_non_teaching_staff" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "colleges" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "organization_id" TEXT NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "dean_id" TEXT,
    "password" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "colleges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deans" (
    "id" TEXT NOT NULL,
    "college_id" TEXT NOT NULL,
    "mail_id" VARCHAR(255) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "deans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hods" (
    "id" TEXT NOT NULL,
    "college_id" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "non_teaching_staff" (
    "id" TEXT NOT NULL,
    "college_id" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'studentsection',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "non_teaching_staff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "departments" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "short_name" VARCHAR(50) NOT NULL,
    "hods" TEXT,
    "college_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "departments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "organizations_email_key" ON "organizations"("email");

-- CreateIndex
CREATE UNIQUE INDEX "colleges_email_key" ON "colleges"("email");

-- CreateIndex
CREATE UNIQUE INDEX "deans_mail_id_key" ON "deans"("mail_id");

-- CreateIndex
CREATE UNIQUE INDEX "hods_email_key" ON "hods"("email");

-- CreateIndex
CREATE UNIQUE INDEX "non_teaching_staff_email_key" ON "non_teaching_staff"("email");

-- AddForeignKey
ALTER TABLE "colleges" ADD CONSTRAINT "colleges_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deans" ADD CONSTRAINT "deans_college_id_fkey" FOREIGN KEY ("college_id") REFERENCES "colleges"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hods" ADD CONSTRAINT "hods_college_id_fkey" FOREIGN KEY ("college_id") REFERENCES "colleges"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "non_teaching_staff" ADD CONSTRAINT "non_teaching_staff_college_id_fkey" FOREIGN KEY ("college_id") REFERENCES "colleges"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "departments" ADD CONSTRAINT "departments_college_id_fkey" FOREIGN KEY ("college_id") REFERENCES "colleges"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "departments" ADD CONSTRAINT "departments_hods_fkey" FOREIGN KEY ("hods") REFERENCES "hods"("id") ON DELETE SET NULL ON UPDATE CASCADE;
