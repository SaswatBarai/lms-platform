export enum NotificationAction {
  AUTH_OTP = "auth-otp",
  EMAIL_NOTIFICATION = "email-notification",
  FORGOT_PASSWORD = "forgot-password",
  NEW_DEVICE_LOGIN = "new-device-login"
}

export enum NotificationType {
  ORG_OTP = "org-otp",
  WELCOME_EMAIL = "welcome-email",
  STAFF_WELCOME_EMAIL = "staff-welcome-email",
  TEACHER_WELCOME_EMAIL = "teacher-welcome-email",
  STUDENT_WELCOME_EMAIL = "student-welcome-email",
  DEAN_WELCOME_EMAIL = "dean-welcome-email",
  HOD_WELCOME_EMAIL = "hod-welcome-email",
  COLLEGE_FORGOT_PASSWORD = "college-forgot-password",
  ORG_FORGOT_PASSWORD = "org-forgot-password",
  NON_TEACHING_STAFF_FORGOT_PASSWORD = "non-teaching-staff-forgot-password",
  HOD_FORGOT_PASSWORD = "hod-forgot-password",
  STUDENT_FORGOT_PASSWORD = "student-forgot-password",
  TEACHER_FORGOT_PASSWORD = "teacher-forgot-password",
  DEAN_FORGOT_PASSWORD = "dean-forgot-password",
  ORG_NEW_DEVICE_LOGIN = "org-new-device-login",
  COLLEGE_NEW_DEVICE_LOGIN = "college-new-device-login",
  STUDENT_NEW_DEVICE_LOGIN = "student-new-device-login",
  TEACHER_NEW_DEVICE_LOGIN = "teacher-new-device-login",
  HOD_NEW_DEVICE_LOGIN = "hod-new-device-login",
  DEAN_NEW_DEVICE_LOGIN = "dean-new-device-login",
  NON_TEACHING_STAFF_NEW_DEVICE_LOGIN = "non-teaching-staff-new-device-login"
}
export enum NotificationSubType {
  CREATE_ACCOUNT = "create-account"
}

export interface NotificationPayload {
  action: NotificationAction;
  type: NotificationType;
  subType?: NotificationSubType;
  data: Record<string, any>;
}

// Specific payload types for better type safety
export interface OTPData {
  email: string;
  otp: string;
}

export interface WelcomeEmailData {
  email: string;
  collegeName?: string;
  loginUrl?: string;
}

export interface StaffWelcomeEmailData {
  email: string;
  name: string;
  tempPassword: string;
  collegeName?: string;
  loginUrl?: string;
}

export interface HodWelcomeEmailData {
  email: string;
  name: string;
  tempPassword: string;
  collegeName: string;
  loginUrl: string;
}

export interface TeacherWelcomeEmailData {
  email: string;
  name: string;
  tempPassword: string;
  employeeNo: string;
  collegeName: string;
  loginUrl: string;
}

export interface StudentWelcomeEmailData {
  email: string;
  name: string;
  regNo: string;
  tempPassword: string;
  collegeName: string;
  departmentName: string;
  loginUrl: string;
}

export interface DeanWelcomeEmailData {
  email: string;
  name: string;
  tempPassword: string;
  collegeName: string;
  loginUrl: string;
}

export interface ForgotPasswordData {
  email: string;
  sessionToken: string;
}

export interface StudentForgotPasswordData {
  email: string;
  sessionToken: string;
  name: string;
  regNo: string;
  collegeName: string;
  departmentName: string;
}

export interface TeacherForgotPasswordData {
  email: string;
  sessionToken: string;
  name: string;
  employeeNo: string;
  collegeName: string;
  departmentName: string;
}

export interface DeanForgotPasswordData {
  email: string;
  sessionToken: string;
  collegeName: string;
}

export interface NewDeviceLoginData {
  email: string;
  name: string;
  userType: string;
  deviceType?: string;
  browser?: string;
  os?: string;
  ipAddress?: string;
  location?: string;
  loginTime: string;
  loginUrl?: string;
  collegeName?: string;
  departmentName?: string;
  regNo?: string;
  employeeNo?: string;
}

