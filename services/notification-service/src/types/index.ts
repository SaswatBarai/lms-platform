export interface IProducerPayload {
  action: "auth-otp" | "email-notification";
  type: "org-otp" |"welcome-email";
  subType?: "create-account";
  data: any;
}
