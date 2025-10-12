CREATE TYPE "public"."user_role" AS ENUM('studentsection', 'regestral', 'adminstractor');--> statement-breakpoint
CREATE TABLE "colleges" (
	"id" text PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"organization_id" text NOT NULL,
	"email" varchar(255) NOT NULL,
	"dean_id" text,
	"password" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "colleges_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "deans" (
	"id" text PRIMARY KEY NOT NULL,
	"college_id" text NOT NULL,
	"mail_id" varchar(255) NOT NULL,
	"password" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "deans_mail_id_unique" UNIQUE("mail_id")
);
--> statement-breakpoint
CREATE TABLE "departments" (
	"id" text PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"short_name" varchar(50) NOT NULL,
	"hods" text,
	"college_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hods" (
	"id" text PRIMARY KEY NOT NULL,
	"college_id" text NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"password" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "hods_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "non_teaching_staff" (
	"id" text PRIMARY KEY NOT NULL,
	"college_id" text NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"password" varchar(255) NOT NULL,
	"role" "user_role" DEFAULT 'studentsection' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "non_teaching_staff_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "organizations" (
	"id" text PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"password" varchar(255) NOT NULL,
	"recovery_email" varchar(255) NOT NULL,
	"address" text NOT NULL,
	"phone" varchar(20) NOT NULL,
	"total_students" integer DEFAULT 0 NOT NULL,
	"total_teachers" integer DEFAULT 0 NOT NULL,
	"total_deans" integer DEFAULT 0 NOT NULL,
	"total_non_teaching_staff" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "organizations_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "colleges" ADD CONSTRAINT "colleges_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deans" ADD CONSTRAINT "deans_college_id_colleges_id_fk" FOREIGN KEY ("college_id") REFERENCES "public"."colleges"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "departments" ADD CONSTRAINT "departments_hods_hods_id_fk" FOREIGN KEY ("hods") REFERENCES "public"."hods"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "departments" ADD CONSTRAINT "departments_college_id_colleges_id_fk" FOREIGN KEY ("college_id") REFERENCES "public"."colleges"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hods" ADD CONSTRAINT "hods_college_id_colleges_id_fk" FOREIGN KEY ("college_id") REFERENCES "public"."colleges"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "non_teaching_staff" ADD CONSTRAINT "non_teaching_staff_college_id_colleges_id_fk" FOREIGN KEY ("college_id") REFERENCES "public"."colleges"("id") ON DELETE cascade ON UPDATE no action;