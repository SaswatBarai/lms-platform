export interface IProducerPayload {
  action: "auth-otp";
  type: "org-otp" ;
  subType?:"create-account";
  data: any;
}
