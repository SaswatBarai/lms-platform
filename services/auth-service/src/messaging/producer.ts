import { Producer } from "kafkajs";
import { kafka } from "./kafka.js";
import { NotificationPayload, NotificationAction, NotificationType, NotificationSubType } from "../types/notification.types.js";

export class KafkaProducer {
  private producer: Producer | null = null;
  private connected: boolean = false;
  private static instance: KafkaProducer | null = null;

  private constructor() {
    // Private constructor for singleton pattern
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): KafkaProducer {
    if (!this.instance) {
      this.instance = new KafkaProducer();
    }
    return this.instance;
  }

  /**
   * Ensure Kafka producer is connected
   */
  private async ensureConnected(): Promise<void> {
    if (!this.producer) {
      this.producer = kafka.producer();
    }
    if (!this.connected) {
      await this.producer.connect();
      this.connected = true;
      console.log("[KafkaProducer] ✅ Producer connected");
    }
  }

  /**
   * Generic method to send notification message
   */
  private async sendMessage(topic: string, payload: NotificationPayload): Promise<boolean> {
    try {
      await this.ensureConnected();
      
      const result = await this.producer!.send({
        topic,
        messages: [{
          value: JSON.stringify(payload)
        }],
      });

      if (result && result.length > 0) {
        console.log(`[KafkaProducer] ✅ Message sent to ${topic}: ${payload.action}-${payload.type}`);
        return true;
      }

      console.error(`[KafkaProducer] ❌ Failed to send message to ${topic}`);
      return false;

    } catch (error) {
      console.error(`[KafkaProducer] ❌ Error sending message to ${topic}:`, error);
      return false;
    }
  }

  /**
   * Send OTP email notification
   */
  public async sendOTP(email: string, otp: string): Promise<boolean> {
    const payload: NotificationPayload = {
      action: NotificationAction.AUTH_OTP,
      type: NotificationType.ORG_OTP,
      subType: NotificationSubType.CREATE_ACCOUNT,
      data: { email, otp }
    };

    return this.sendMessage("otp-messages", payload);
  }

  /**
   * Send college welcome email
   */
  public async sendCollegeWelcomeEmail(email: string, collegeName: string, loginUrl: string): Promise<boolean> {
    const payload: NotificationPayload = {
      action: NotificationAction.EMAIL_NOTIFICATION,
      type: NotificationType.WELCOME_EMAIL,
      subType: NotificationSubType.CREATE_ACCOUNT,
      data: { email, collegeName, loginUrl }
    };

    return this.sendMessage("welcome-messages", payload);
  }

  /**
   * Send staff welcome email
   */
  public async sendStaffWelcomeEmail(
    email: string,
    name: string,
    tempPassword: string,
    loginUrl: string,
    collegeName:string
  ): Promise<boolean> {
    const payload: NotificationPayload = {
      action: NotificationAction.EMAIL_NOTIFICATION,
      type: NotificationType.STAFF_WELCOME_EMAIL,
      subType: NotificationSubType.CREATE_ACCOUNT,
      data: { email, name, tempPassword, loginUrl, collegeName }
    };

    return this.sendMessage("welcome-messages", payload);
  }

  /**
   * Send hod welcome email
   */
  public async sendHodWelcomeEmail(
    email:string,
    name:string,
    tempPassword:string,
    collegeName:string,
    loginUrl:string
  ):Promise<boolean> {
    const payload:NotificationPayload = {
      action:NotificationAction.EMAIL_NOTIFICATION,
      type:NotificationType.HOD_WELCOME_EMAIL,  
      subType:NotificationSubType.CREATE_ACCOUNT,
      data:{email,name,tempPassword,collegeName,loginUrl}
    }
    return this.sendMessage("welcome-messages",payload);
  }

  /**
   * Send teacher welcome email
   */
  public async sendTeacherWelcomeEmail(
    email: string,
    name: string,
    tempPassword: string,
    employeeNo: string,
    collegeName: string,
    loginUrl: string
  ): Promise<boolean> {
    const payload: NotificationPayload = {
      action: NotificationAction.EMAIL_NOTIFICATION,
      type: NotificationType.TEACHER_WELCOME_EMAIL,
      subType: NotificationSubType.CREATE_ACCOUNT,
      data: { email, name, tempPassword, employeeNo, collegeName, loginUrl }
    };

    return this.sendMessage("welcome-messages", payload);
  }




  /**
   * Send organization forgot password email
   */
  public async sendOrganizationForgotPassword(email: string, sessionToken: string): Promise<boolean> {
    const payload: NotificationPayload = {
      action: NotificationAction.FORGOT_PASSWORD,
      type: NotificationType.ORG_FORGOT_PASSWORD,
      data: { email, sessionToken }
    };

    return this.sendMessage("forgot-password-messages", payload);
  }
  /**
   * Send non-teaching staff forgot password email
   */

  public async sendNonTeachingStaffForgotPassword(email:string, sessionToken:string,name:string,collegeName:string):Promise<boolean> {
    const payload:NotificationPayload = {
      action:NotificationAction.FORGOT_PASSWORD,
      type:NotificationType.NON_TEACHING_STAFF_FORGOT_PASSWORD,
      data:{email,sessionToken,name,collegeName}
    }
    return this.sendMessage("forgot-password-messages",payload);
  }

  /**
   * Send college forgot password email
   */
  public async sendCollegeForgotPassword(email: string, sessionToken: string): Promise<boolean> {
    const payload: NotificationPayload = {
      action: NotificationAction.FORGOT_PASSWORD,
      type: NotificationType.COLLEGE_FORGOT_PASSWORD,
      data: { email, sessionToken }
    };

    return this.sendMessage("forgot-password-messages", payload);
  }

  /**
   * Send hod forgot password email
   */
  public async sendHodForgotPassword(
    email:string,
    sessionToken:string,
    collegeName:string,
    departmentName:string,
    departmentShortName:string,
    name:string
  ):Promise<boolean> {
    const payload:NotificationPayload = {
      action:NotificationAction.FORGOT_PASSWORD,
      type:NotificationType.HOD_FORGOT_PASSWORD,
      data:{email,sessionToken,collegeName,departmentName,departmentShortName,name}
    }
    return this.sendMessage("forgot-password-messages",payload);
  }

  /**
   * Send student welcome email with registration number and password
   */
  public async sendStudentWelcomeEmail(
    email: string,
    name: string,
    regNo: string,
    tempPassword: string,
    collegeName: string,
    departmentName: string,
    loginUrl: string
  ): Promise<boolean> {
    const payload: NotificationPayload = {
      action: NotificationAction.EMAIL_NOTIFICATION,
      type: NotificationType.STUDENT_WELCOME_EMAIL,
      subType: NotificationSubType.CREATE_ACCOUNT,
      data: { email, name, regNo, tempPassword, collegeName, departmentName, loginUrl }
    };

    return this.sendMessage("welcome-messages", payload);
  }

  /**
   * Send student forgot password email
   */
  public async sendStudentForgotPassword(
    email: string,
    sessionToken: string,
    name: string,
    regNo: string,
    collegeName: string,
    departmentName: string
  ): Promise<boolean> {
    const payload: NotificationPayload = {
      action: NotificationAction.FORGOT_PASSWORD,
      type: NotificationType.STUDENT_FORGOT_PASSWORD,
      data: { email, sessionToken, name, regNo, collegeName, departmentName }
    };

    return this.sendMessage("forgot-password-messages", payload);
  }

  /**
   * Send teacher forgot password email
   */
  public async sendTeacherForgotPassword(
    email: string,
    sessionToken: string,
    name: string,
    employeeNo: string,
    collegeName: string,
    departmentName: string
  ): Promise<boolean> {
    const payload: NotificationPayload = {
      action: NotificationAction.FORGOT_PASSWORD,
      type: NotificationType.TEACHER_FORGOT_PASSWORD,
      data: { email, sessionToken, name, employeeNo, collegeName, departmentName }
    };

    return this.sendMessage("forgot-password-messages", payload);
  }

  /**
   * Send dean welcome email
   */
  public async sendDeanWelcomeEmail(
    email: string,
    name: string,
    tempPassword: string,
    collegeName: string,
    loginUrl: string
  ): Promise<boolean> {
    const payload: NotificationPayload = {
      action: NotificationAction.EMAIL_NOTIFICATION,
      type: NotificationType.DEAN_WELCOME_EMAIL,
      subType: NotificationSubType.CREATE_ACCOUNT,
      data: { email, name, tempPassword, collegeName, loginUrl }
    };

    return this.sendMessage("welcome-messages", payload);
  }

  /**
   * Send dean forgot password email
   */
  public async sendDeanForgotPassword(
    email: string,
    sessionToken: string,
    collegeName: string
  ): Promise<boolean> {
    const payload: NotificationPayload = {
      action: NotificationAction.FORGOT_PASSWORD,
      type: NotificationType.DEAN_FORGOT_PASSWORD,
      data: { email, sessionToken, collegeName }
    };

    return this.sendMessage("forgot-password-messages", payload);
  }

  /**
   * Send audit log event
   */
  public async sendAuditLog(event: any): Promise<boolean> {
    try {
      await this.ensureConnected();
      
      const result = await this.producer!.send({
        topic: 'auth.audit.events',
        messages: [{
          value: JSON.stringify({ ...event, timestamp: new Date().toISOString() })
        }]
      });

      if (result && result.length > 0) {
        console.log(`[KafkaProducer] ✅ Audit log sent: ${event.action || 'unknown'}`);
        return true;
      }

      console.error(`[KafkaProducer] ❌ Failed to send audit log`);
      return false;

    } catch (error) {
      console.error(`[KafkaProducer] ❌ Error sending audit log:`, error);
      return false;
    }
  }

  /**
   * Disconnect producer
   */
  public async disconnect(): Promise<void> {
    if (this.producer && this.connected) {
      await this.producer.disconnect();
      this.connected = false;
      console.log("[KafkaProducer] Producer disconnected");
    }
  }
}
