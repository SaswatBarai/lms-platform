export enum NotificationAction {
  AUTH_OTP = "auth-otp",
  EMAIL_NOTIFICATION = "email-notification",
  FORGOT_PASSWORD = "forgot-password"
}

export enum NotificationType {
  ORG_OTP = "org-otp",
  WELCOME_EMAIL = "welcome-email",
  STAFF_WELCOME_EMAIL = "staff-welcome-email",
  DEAN_WELCOME_EMAIL = "dean-welcome-email",
  HOD_WELCOME_EMAIL = "hod-welcome-email",
  COLLEGE_FORGOT_PASSWORD = "college-forgot-password",
  ORG_FORGOT_PASSWORD = "org-forgot-password",
  NON_TEACHING_STAFF_FORGOT_PASSWORD = "non-teaching-staff-forgot-password",
  HOD_FORGOT_PASSWORD = "hod-forgot-password"
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

