import * as z from "zod";

export const createOrganizationSchema = z.object({
    name: z.string({ message: "Name is required" })
        .min(3, { message: "Name must be at least 3 characters" })
        .max(255, { message: "Name must be at most 255 characters" })
        .trim().nonempty({ message: "Name is required" }),
    email: z.string({ message: "Invalid email address" })
        .email({ message: "Invalid email address" })
        .max(255, { message: "Email must be at most 255 characters" })
        .toLowerCase()
        .trim(),
    password: z.string({ message: "Password is required" })
        .min(1, { message: "Password is required" })
        .min(8, { message: "Password must be at least 8 characters" })
        .refine((val) => /[A-Z]/.test(val), { message: "Must include at least one uppercase letter" })
        .refine((val) => /[a-z]/.test(val), { message: "Must include at least one lowercase letter" })
        .refine((val) => /[0-9]/.test(val), { message: "Must include at least one number" })
        .refine((val) => /[!@#$%^&*]/.test(val), { message: "Must include at least one special character" }),
    recoveryEmail: z.string({ message: "Recovery email is required" })
        .min(1, { message: "Recovery email is required" })
        .email({ message: "Invalid recovery email address" })
        .max(255, { message: "Recovery email must be at most 255 characters" })
        .toLowerCase()
        .trim(),
    address: z.string()
        .min(5, { message: "Address must be at least 5 characters" })
        .max(500, { message: "Address must be at most 500 characters" })
        .trim()
        .optional(),
    phone: z.string({ message: "Phone number is required" })
        .min(1, { message: "Phone number is required" })
        .regex(/^\+?[\d\s\-\(\)]{10,20}$/, { message: "Invalid phone number format" })
        .max(20, { message: "Phone number must be at most 20 characters" })
        .trim(),
});

export const verifyOrganizationOtpSchema = z.object({
    email: z.string({ message: "Invalid email address" })
        .email({ message: "Invalid email address" })
        .max(255, { message: "Email must be at most 255 characters" })
        .toLowerCase()
        .trim(),
    otp: z.string({ message: "OTP is required" })
        .min(1, { message: "OTP is required" })
        .length(6, { message: "OTP must be 6 characters" })
        .trim(),
    sessionToken: z.string({ message: "Session token is required" })
        .min(1, { message: "Session token is required" })
        .trim(),
})

export const resendOrganizationOtpSchema = z.object({
    email: z.string({ message: "Invalid email address" })
        .email({ message: "Invalid email address" })
        .max(255, { message: "Email must be at most 255 characters" })
        .toLowerCase()
        .trim(),
})
