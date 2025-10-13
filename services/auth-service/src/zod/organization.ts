import * as z from "zod";

export const createOrganizationSchema = z.object({
    name: z.string({ error: "Name is required" }).min(3, { error: "Name must be at least 3 character" }).max(255, { error: "Name must be at most 255 characters" }).trim(),
    email: z.email({ error: "Invalid email address" }).max(255, { error: "Emaail must be at most 255 character" }).toLowerCase().trim(),
    password: z
        .string()
        .min(8, { error: "Password must be at least 8 characters" })
        .refine((val) => /[A-Z]/.test(val), { error: "Must include at least one uppercase letter" })
        .refine((val) => /[a-z]/.test(val), { error: "Must include at least one lowercase letter" })
        .refine((val) => /[0-9]/.test(val), { error: "Must include at least one number" })
        .refine((val) => /[!@#$%^&*]/.test(val), { error: "Must include at least one special character" }),
    recoveryEmail: z.string().email({ error: "Invalid recovery email address" }).max(255, { error: "Recovery email must be at most 255 character" }).toLowerCase().trim(),
    address: z.string().min(5, { error: "Address must be at least 5 character" }).max(500, { error: "Address must be at most 500 characters" }).trim().optional(),
    phone: z.string().regex(/^\+?[\d\s\-\(\)]{10,20}$/, { error: "Invalid phone number format" }).max(20, { error: "Phone number must be at most 20 characters" }).trim(),
})
