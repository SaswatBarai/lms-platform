import {
    pgTable,
    varchar,
    integer,
    pgEnum,
    text,
    timestamp,
} from "drizzle-orm/pg-core"
import cuid from "cuid"
import { email } from "zod"
//=====================================
// Organizations Table
//=====================================
export const organizations = pgTable("organizations",{
    id: text("id").primaryKey().$defaultFn(() => cuid()),
    name: varchar("name",{length:255}).notNull(),
    email: varchar("email",{length:255}).notNull().unique(),
    password: varchar("password",{length:255}).notNull(),
    recovery_email: varchar("recovery_email",{length:255}).notNull(),
    address: text("address").notNull(),
    phone: varchar("phone",{length:20}).notNull(),

    total_students: integer("total_students").notNull().default(0),
    total_teachers: integer("total_teachers").notNull().default(0),
    total_deans: integer("total_deans").notNull().default(0),
    total_non_teaching_staff: integer('total_non_teaching_staff').notNull(),

    created_at: timestamp("created_at").defaultNow().notNull(),
    updated_at: timestamp("updated_at").defaultNow().notNull(),
})

//=====================================
// College table
//=====================================


export const colleges = pgTable("colleges",{
    id: text("id").primaryKey().$defaultFn(() => cuid()),
    name: varchar("name",{length:255}).notNull(),
    org_id: text("organization_id").notNull().references(() => organizations.id,{
        onDelete:"cascade"
    }),
    email: varchar("email",{length:255}).notNull().unique(),
    dean_id:text("dean_id"),
    password: varchar("password",{length:255}).notNull(),
    created_at: timestamp("created_at").defaultNow().notNull(),
    updated_at: timestamp("updated_at").defaultNow().notNull(),
})

//=====================================
// Deans table
//=====================================

export const deans = pgTable("deans",{
    id: text("id").primaryKey().$defaultFn(() => cuid()),
    college_id: text("college_id").notNull().references(() => colleges.id,{
        onDelete:"cascade"
    }),
    mail_id: varchar("mail_id",{length:255}).notNull().unique(),
    password: varchar("password",{length:255}).notNull(),
    created_at: timestamp("created_at").defaultNow().notNull(),
    updated_at: timestamp("updated_at").defaultNow().notNull(),
})


//=====================================
// HOD table
//=====================================

export const hods = pgTable("hods",{
    id: text("id").primaryKey().$defaultFn(() => cuid()),
    college_id: text("college_id").notNull().references(() => colleges.id,{
        onDelete:"cascade"
    }),
    name: varchar("name",{length:255}).notNull(),
    email: varchar("email",{length:255}).notNull().unique(),
    password: varchar("password",{length:255}).notNull(),
    // dept_hod:varchar("dept_hod",{length:255}).references(() => departments.id),
    created_at: timestamp("created_at").defaultNow().notNull(),
    updated_at: timestamp("updated_at").defaultNow().notNull(),
})



//=====================================
// Non Teaching Staff table
//=====================================

export const userRole = pgEnum("user_role",["studentsection","regestral","adminstractor"])

export const non_teaching_staff = pgTable("non_teaching_staff",{
    id: text("id").primaryKey().$defaultFn(() => cuid()),   
    college_id: text("college_id").notNull().references(() => colleges.id,{
        onDelete:"cascade"
    }),
    name: varchar("name",{length:255}).notNull(),
    email: varchar("email",{length:255}).notNull().unique(),
    password: varchar("password",{length:255}).notNull(),
    role: userRole("role").default("studentsection").notNull(),
    created_at: timestamp("created_at").defaultNow().notNull(),
    updated_at: timestamp("updated_at").defaultNow().notNull(),
})


//=====================================
// Departments Table
//=====================================

export const departments = pgTable("departments",{
    id: text("id").primaryKey().$defaultFn(() => cuid()),
    name: varchar("name",{length:255}).notNull(),
    short_name: varchar("short_name",{length:50}).notNull(),
    hods: text("hods").references(() => hods.id),
    college_id: text("college_id").notNull().references(() => colleges.id,{
        onDelete:"cascade"
    }),

    created_at: timestamp("created_at").defaultNow().notNull(),
    updated_at: timestamp("updated_at").defaultNow().notNull(),
})
