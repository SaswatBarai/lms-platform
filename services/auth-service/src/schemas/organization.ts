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

export const loginOrganizationSchema = z.object({
    email: z.string({ message: "Invalid email address" })
        .email({ message: "Invalid email address" })
        .max(255, { message: "Email must be at most 255 characters" })
        .toLowerCase()
        .trim(),
    password: z.string({ message: "Password is required" })
        .min(1, { message: "Password is required" })
        .trim(),
})


export const createCollegeSchema = z.object({
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
    organizationId: z.string({ message: "Organization ID is required" })
        .min(1, { message: "Organization ID is required" })
        .trim()
        .nonempty({ message: "Organization ID is required" }),

    recoveryEmail: z.string({ message: "Recovery email is required" })
        .min(1, { message: "Recovery email is required" })
        .email({ message: "Invalid recovery email address" })
        .max(255, { message: "Recovery email must be at most 255 characters" })
        .toLowerCase()
        .trim()
        .optional(),
    phone: z.string({ message: "Phone number is required" })
        .min(1, { message: "Phone number is required" })
        .regex(/^\+?[\d\s\-\(\)]{10,20}$/, { message: "Invalid phone number format" })
        .max(20, { message: "Phone number must be at most 20 characters" })
        .trim(),
})

export const loginCollegeSchema = z.object({
    email: z.string({ message: "Invalid email address" })
        .email({ message: "Invalid email address" })
        .max(255, { message: "Email must be at most 255 characters" })
        .toLowerCase()
        .trim(),
    password: z.string({ message: "Password is required" })
        .min(1, { message: "Password is required" })
        .trim(),
})

export const createNonTeachingStaffSchema = z.object({
    name: z.string({ message: "Name is required" })
        .min(3, { message: "Name must be at least 3 characters" })
        .max(255, { message: "Name must be at most 255 characters" })
        .trim()
        .nonempty({ message: "Name is required" }),
    email: z.string({ message: "Invalid email address" })
        .email({ message: "Invalid email address" })
        .max(255, { message: "Email must be at most 255 characters" })
        .toLowerCase()
        .trim(),
    phone: z.string({ message: "Phone number is required" })
        .min(1, { message: "Phone number is required" })
        .regex(/^\+?[\d\s\-\(\)]{10,20}$/, { message: "Invalid phone number format" })
        .max(20, { message: "Phone number must be at most 20 characters" })
        .trim(),
    password: z.string({ message: "Password is required" })
        .min(1, { message: "Password is required" })
        .min(8, { message: "Password must be at least 8 characters" })
        .refine((val) => /[A-Z]/.test(val), { message: "Must include at least one uppercase letter" })
        .refine((val) => /[a-z]/.test(val), { message: "Must include at least one lowercase letter" })
        .refine((val) => /[0-9]/.test(val), { message: "Must include at least one number" })
        .refine((val) => /[!@#$%^&*]/.test(val), { message: "Must include at least one special character" }),
    collegeId: z.string({ message: "College ID is required" })
        .min(1, { message: "College ID is required" })
        .trim()
        .nonempty({ message: "College ID is required" }),
    role: z.enum(["studentsection", "regestral", "adminstractor"], { 
        message: "Role must be one of: studentsection, regestral, adminstractor" 
    })
        .optional()
        .default("studentsection"),
})

// Schema for a single staff member in the bulk creation input array
const createNonTeachingStaffObjectSchema = z.object({
    name: z.string().min(3, { message: "Name must be at least 3 characters" }),
    email: z.string().email({ message: "Invalid email address" }),
    phone: z.string().regex(/^\+?[\d\s\-\(\)]{10,20}$/, { message: "Invalid phone number format" }),
    role: z.enum(["studentsection", "regestral", "adminstractor"], { 
        message: "Role must be one of: studentsection, regestral, adminstractor" 
    }).default("studentsection"),
});

// Schema for the bulk array
export const createNonTeachingStaffBulkSchema = z.array(createNonTeachingStaffObjectSchema).min(1, {
    message: "Must provide at least one staff member."
});


export const loginNonTeachingStaffSchema = z.object({
    email: z.string({ message: "Invalid email address" })
        .email({ message: "Invalid email address" })
        .max(255, { message: "Email must be at most 255 characters" })
        .toLowerCase()
        .trim(),
    password: z.string({ message: "Password is required" })
        .min(1, { message: "Password is required" })
        .trim(),
})


export const resetPasswordScehma = z.object({
    email: z.string({ message: "Invalid email address" })
        .email({ message: "Invalid email address" })
        .max(255, { message: "Email must be at most 255 characters" })
        .toLowerCase()
        .trim(),
    oldPassword: z.string({ message: "Password is required" })
        .min(1, { message: "Password is required" }),
    newPassword: z.string({ message: "Password is required" })
        .min(1, { message: "Password is required" })
        .min(8, { message: "Password must be at least 8 characters" })
        .refine((val) => /[A-Z]/.test(val), { message: "Must include at least one uppercase letter" })
        .refine((val) => /[a-z]/.test(val), { message: "Must include at least one lowercase letter" })  
        .refine((val) => /[0-9]/.test(val), { message: "Must include at least one number" })
        .refine((val) => /[!@#$%^&*]/.test(val), { message: "Must include at least one special character" }),
})

export const forgotResetPasswordSchema = z.object({
    email: z.string({ message: "Invalid email address" })
        .email({ message: "Invalid email address" })
        .max(255, { message: "Email must be at most 255 characters" })
        .toLowerCase()
        .trim(),
    token: z.string({ message: "Token is required" })
        .min(1, { message: "Session token is required" })
        .trim(),
    password: z.string({ message: "Password is required" })
    .min(1, { message: "Password is required" })
    .min(8, { message: "Password must be at least 8 characters" })
    .refine((val) => /[A-Z]/.test(val), { message: "Must include at least one uppercase letter" })
    .refine((val) => /[a-z]/.test(val), { message: "Must include at least one lowercase letter" })
    .refine((val) => /[0-9]/.test(val), { message: "Must include at least one number" })
    .refine((val) => /[!@#$%^&*]/.test(val), { message: "Must include at least one special character" }),
})


export const addDepartmentSchema = z.object({
    name: z.string({ message: "Name is required" })
        .min(3, { message: "Name must be at least 3 characters" })
        .max(255, { message: "Name must be at most 255 characters" })
        .trim()
        .nonempty({ message: "Name is required" }),
    shortName: z.string({ message: "Short name is required" })
        .min(2, { message: "Short name must be at least 3 characters" })
        .max(50, { message: "Short name must be at most 50 characters" })
        .trim()
        .nonempty({ message: "Short name is required" }),
    hodId: z.string({ message: "HOD ID is required" })
        .min(1, { message: "HOD ID is required" })
        .trim()
        .nonempty({ message: "HOD ID is required" })
        .optional(),
})

export const addDepartmentBulkSchema = z.array(addDepartmentSchema).min(1, {
    message: "Must provide at least one department."
});


export const addCourseSchema = z.object({
    name:z.string({ message: "Name is required" })
        .min(3, { message: "Name must be at least 3 characters" })
        .max(255, { message: "Name must be at most 255 characters" })
        .trim()
        .nonempty({ message: "Name is required" }),
    shortName:z.string({ message: "Short name is required" })
        .min(2, { message: "Short name must be at least 2 characters" })
        .max(50, { message: "Short name must be at most 50 characters" })
        .trim()
        .nonempty({ message: "Short name is required" }),
})

export const addCourseBulkSchema = z.array(addCourseSchema).min(1, {
    message: "Must provide at least one course."
});


export const createHodSchema = z.object({
    name: z.string({message: "Name is required"})
        .min(3, { message: "Name must be at least 3 characters" })
        .max(255, { message: "Name must be at most 255 characters" })
        .trim()
        .nonempty({ message: "Name is required" }),
    email: z.string({message: "Email is required"})
        .email({message: "Invalid email address"})
        .max(255, { message: "Email must be at most 255 characters" })
        .toLowerCase()
        .trim(),
    departmentId: z.string({message: "Department ID is required"})
        .min(1, { message: "Department ID is required" })
        .trim()
        .nonempty({ message: "Department ID is required" })
})


export const loginHodSchema = z.object({
    email: z.string({message: "Email is required"})
        .email({message: "Invalid email address"})
        .max(255, { message: "Email must be at most 255 characters" })
        .toLowerCase()
        .trim(),
    password: z.string({message: "Password is required"})
        .min(1, { message: "Password is required" })
        .trim(),
})