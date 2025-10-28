export interface IProducerPayload {
  action: "auth-otp" | "email-notification" | "forgot-password";
  type: "org-otp" |"welcome-email" | "college-forgot-password" | "org-forgot-password";
  subType?: "create-account";
  data: any;
}
