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

