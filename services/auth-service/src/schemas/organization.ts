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
    name: z.enum(
        ["BACHELOR_OF_TECHNOLOGY", "MASTER_OF_TECHNOLOGY", "BACHELOR_OF_COMPUTER_APPLICATIONS", "MASTER_OF_COMPUTER_APPLICATIONS"],
        { 
            message: "Course name must be one of: BACHELOR_OF_TECHNOLOGY, MASTER_OF_TECHNOLOGY, BACHELOR_OF_COMPUTER_APPLICATIONS, MASTER_OF_COMPUTER_APPLICATIONS" 
        }
    ),
    shortName: z.enum(
        ["BTECH", "MTECH", "BCA", "MCA"],
        { 
            message: "Course short name must be one of: BTECH, MTECH, BCA, MCA" 
        }
    ),
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




enum BatchType {
    BTECH = 4,
    MTECH = 2,
    MBA   = 2,
    BBA   = 2,
    BCA   = 3,
    MCA   = 3,
  }
  
  // ------------------------------------------------------------------
  // 2. Helper: extract the allowed enum keys as a string literal union
  // ------------------------------------------------------------------
  type BatchTypeKey = keyof typeof BatchType; // "BTECH" | "MTECH" | ...
  
  // ------------------------------------------------------------------
  // 3. The schema
  // ------------------------------------------------------------------
  export const addBatchSchema = z.object({
    // ---- courseId -------------------------------------------------
    courseId: z.string({ message: "Course ID is required" })
      .min(1, { message: "Course ID is required" })
      .trim()
      .nonempty({ message: "Course ID is required" }),
    
    // ---- batchYear -------------------------------------------------
    batchYear: z
      .string({ message: "Batch year is required" })
      .min(1, { message: "Batch year is required" })
      .trim()
      .refine((val) => /^\d{4}-\d{4}$/.test(val), {
        message: "Invalid batch year format – expected YYYY-YYYY",
      })
      .nonempty({ message: "Batch year is required" })
      .max(100, { message: "Batch year must be at most 100 characters" })
      // ---- calculate duration & validate it -------------------------
      .refine(
        (val) => {
          const parts = val.split("-");
          if (parts.length !== 2) return false;
          const [start, end] = parts.map(Number);
          if (!start || !end || isNaN(start) || isNaN(end)) return false;
          const calculated = end - start;
          return Number.isInteger(calculated) && calculated > 0;
        },
        { message: "Start year must be before end year" }
      ),
  
    // ---- batchType -------------------------------------------------
    batchType: z.enum(
      // enum keys are the only allowed values
      Object.keys(BatchType) as [BatchTypeKey, ...BatchTypeKey[]],
      { message: "Batch type is required" }
    ),
  })
  // ---- cross-field validation: duration must match enum value ---
  .refine(
    (data) => {
      const parts = data.batchYear.split("-");
      if (parts.length !== 2) return false;
      const [start, end] = parts.map(Number);
      if (!start || !end || isNaN(start) || isNaN(end)) return false;
      const calculatedDuration = end - start;
      const expectedDuration = BatchType[data.batchType as BatchTypeKey];
      return calculatedDuration === expectedDuration;
    },
    {
      message: "Batch duration must match the specified batch type duration",
    }
  );


export const addSectionSchema = z.object({
    no_of_section: z.number({ message: "Number of section is required" })
        .min(1,{message:"Number of section must be at least 1"})
        .int({message:"Number of section must be an integer"})
        .positive({message:"Number of section must be a positive number"})
        .max(10,{message:"Number of section must be at most 10"}),
    department_id: z.string({ message: "Department ID is required" })
        .min(1, { message: "Department ID is required" })
        .trim()
        .nonempty({ message: "Department ID is required" })
        .trim(),
    batch_id: z.string({ message: "Batch ID is required" })
        .min(1, { message: "Batch ID is required" })
        .trim()
        .nonempty({ message: "Batch ID is required" })
})



export const studentDetailsSchema = z.object({
    name: z.string({ message: "Name is required" })
        .min(3, { message: "Name must be at least 3 characters" })
        .max(255, { message: "Name must be at most 255 characters" })
        .trim()
        .nonempty({ message: "Name is required" }),
    email: z.string({ message: "Email is required" })
        .email({ message: "Invalid email address" })
        .max(255, { message: "Email must be at most 255 characters" })
        .toLowerCase()
        .trim(),
    phone: z.string({ message: "Phone number is required" })
        .min(1, { message: "Phone number is required" })
        .regex(/^\+?[\d\s\-\(\)]{10,20}$/, { message: "Invalid phone number format" })
        .max(20, { message: "Phone number must be at most 20 characters" })
        .trim(),
    gender: z.enum(["MALE", "FEMALE", "OTHER"], {
        message: "Gender must be one of: MALE, FEMALE, OTHER"
    })
})

export const createStudentBulkSchema = z.object({
    students: z.array(studentDetailsSchema).min(1, {
        message: "Must provide at least one student."
    })
    .max(500,{
        message: "Cannot create more than 500 students at once."
    }),
    batchId: z.string({ message: "Batch ID is required" })
        .min(1, { message: "Batch ID is required" })
        .trim()
        .nonempty({ message: "Batch ID is required" }),
    departmentId: z.string({ message: "Department ID is required" })
        .min(1, { message: "Department ID is required" })
        .trim()
        .nonempty({ message: "Department ID is required" }),
    dryRun: z.boolean().optional().default(false)  // Preview mode - see allocation without creating
})

// Student Login Schema - can login with email OR registration number
export const loginStudentSchema = z.object({
    identifier: z.string({ message: "Email or Registration Number is required" })
        .min(1, { message: "Email or Registration Number is required" })
        .trim()
        .nonempty({ message: "Email or Registration Number is required" }),
    password: z.string({ message: "Password is required" })
        .min(1, { message: "Password is required" })
        .trim()
})

// Student Reset Password Schema (after login)
export const resetPasswordStudentSchema = z.object({
    oldPassword: z.string({ message: "Current password is required" })
        .min(1, { message: "Current password is required" })
        .trim(),
    newPassword: z.string({ message: "New password is required" })
        .min(8, { message: "New password must be at least 8 characters" })
        .refine((val) => /[A-Z]/.test(val), { message: "Must include at least one uppercase letter" })
        .refine((val) => /[a-z]/.test(val), { message: "Must include at least one lowercase letter" })
        .refine((val) => /[0-9]/.test(val), { message: "Must include at least one number" })
        .refine((val) => /[!@#$%^&*]/.test(val), { message: "Must include at least one special character" })
})

// Student Forgot Password Schema (request reset)
export const forgotPasswordStudentSchema = z.object({
    identifier: z.string({ message: "Email or Registration Number is required" })
        .min(1, { message: "Email or Registration Number is required" })
        .trim()
        .nonempty({ message: "Email or Registration Number is required" })
})

// Student Reset Forgot Password Schema (with token)
export const resetForgotPasswordStudentSchema = z.object({
    email: z.string({ message: "Email is required" })
        .email({ message: "Invalid email format" })
        .toLowerCase()
        .trim(),
    password: z.string({ message: "Password is required" })
        .min(8, { message: "Password must be at least 8 characters" })
        .refine((val) => /[A-Z]/.test(val), { message: "Must include at least one uppercase letter" })
        .refine((val) => /[a-z]/.test(val), { message: "Must include at least one lowercase letter" })
        .refine((val) => /[0-9]/.test(val), { message: "Must include at least one number" })
        .refine((val) => /[!@#$%^&*]/.test(val), { message: "Must include at least one special character" }),
    token: z.string({ message: "Reset token is required" })
        .length(64, { message: "Invalid reset token" })
        .trim()
})

export const teacherDetailsSchema = z.object({
    name: z.string({ message: "Name is required" })
        .min(3, { message: "Name must be at least 3 characters" })
        .max(255, { message: "Name must be at most 255 characters" })
        .trim()
        .nonempty({ message: "Name is required" }),
    email: z.string({ message: "Email is required" })
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
        .trim(),
    departmentId: z.string({ message: "Department ID is required" })
        .min(1, { message: "Department ID is required" })
        .trim()
        .nonempty({ message: "Department ID is required" }),
    gender: z.enum(["MALE", "FEMALE", "OTHER"], {
        message: "Gender must be one of: MALE, FEMALE, OTHER"
    }),
    employeeNo: z.string({ message: "Employee number is required" })
        .min(1, { message: "Employee number is required" })
        .trim()
        .nonempty({ message: "Employee number is required" })
})

export const createTeacherBulkSchema = z.object({
    teachers: z.array(teacherDetailsSchema).min(1, {
        message: "Must provide at least one teacher."
    })
    .max(500,{
        message: "Cannot create more than 500 teachers at once."
    }),
    collegeId: z.string({ message: "College ID is required" })
        .min(1, { message: "College ID is required" })
        .trim()
        .nonempty({ message: "College ID is required" })
})


export const loginTeacherSchema = z.object({
    identifier: z.string({ message: "Email or Registration number is required" })
        .min(1, { message: "Email or Registration number is required" })
        .trim()
        .nonempty({ message: "Email or Registration number is required" }),
    password: z.string({ message: "Password is required" })
        .min(1, { message: "Password is required" })
        .trim()
})


export const updatePasswordTeacherSchema = z.object({
    oldPassword: z.string({ message: "Old password is required" })
        .min(1, { message: "Old password is required" })
        .trim(),
    newPassword: z.string({ message: "New password is required" })
        .min(8, { message: "New password must be at least 8 characters" })
        .refine((val) => /[A-Z]/.test(val), { message: "Must include at least one uppercase letter" })
        .refine((val) => /[a-z]/.test(val), { message: "Must include at least one lowercase letter" })
        .refine((val) => /[0-9]/.test(val), { message: "Must include at least one number" })
        .refine((val) => /[!@#$%^&*]/.test(val), { message: "Must include at least one special character" })
})


export const forgotPasswordTeacherSchema = z.object({
    email: z.email({ message: "Invalid email address" })
        .max(255, { message: "Email must be at most 255 characters" })
        .toLowerCase()
        .trim()
})

export const resetForgotPasswordTeacherSchema = z.object({
    email: z.string({ message: "Email is required" })
        .email({ message: "Invalid email address" })
        .toLowerCase()
        .trim(),
    sessionToken: z.string({ message: "Session token is required" })
        .min(1, { message: "Session token is required" }),
    newPassword: z.string({ message: "New password is required" })
        .min(8, { message: "New password must be at least 8 characters" })
})


export const createDeanSchema = z.object({
    mailId: z.string({ message: "Email is required" })
        .email({ message: "Invalid email address" })
        .max(255, { message: "Email must be at most 255 characters" })
        .toLowerCase()
        .trim(),
});

export const loginDeanSchema = z.object({
    mailId: z.string({ message: "Email is required" })
        .email({ message: "Invalid email address" })
        .toLowerCase()
        .trim(),
    password: z.string({ message: "Password is required" })
        .min(1, { message: "Password is required" })
        .trim()
});

export const forgotPasswordDeanSchema = z.object({
    mailId: z.string({ message: "Email is required" })
        .email({ message: "Invalid email address" })
        .toLowerCase()
        .trim()
});

export const resetForgotPasswordDeanSchema = z.object({
    mailId: z.string({ message: "Email is required" })
        .email({ message: "Invalid email address" })
        .toLowerCase()
        .trim(),
    sessionToken: z.string({ message: "Session token is required" })
        .min(1, { message: "Session token is required" }),
    newPassword: z.string({ message: "New password is required" })
        .min(8, { message: "New password must be at least 8 characters" })
});