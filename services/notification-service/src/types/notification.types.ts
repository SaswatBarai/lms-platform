export enum NotificationAction {
  AUTH_OTP = "auth-otp",
  EMAIL_NOTIFICATION = "email-notification",
  FORGOT_PASSWORD = "forgot-password"
}

export enum NotificationType {
  ORG_OTP = "org-otp",
  WELCOME_EMAIL = "welcome-email",
  STAFF_WELCOME_EMAIL = "staff-welcome-email",
  COLLEGE_FORGOT_PASSWORD = "college-forgot-password",
  ORG_FORGOT_PASSWORD = "org-forgot-password"
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
  loginUrl?: string;
}

export interface ForgotPasswordData {
  email: string;
  sessionToken: string;
}

