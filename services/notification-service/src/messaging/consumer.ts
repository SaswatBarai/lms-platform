import { kafka } from "./kafka.js";
import { NotificationPayload, NotificationAction, NotificationType } from "../types/notification.types.js";
import { OTPHandler, WelcomeEmailHandler, PasswordResetHandler } from "../handlers/index.js";

export class NotificationConsumer {
  private static consumerInstance: any = null;

  /**
   * Start the Kafka consumer for notification processing
   */
  public static async start(): Promise<void> {
    try {
      const consumer = kafka.consumer({ 
        groupId: process.env.KAFKA_GROUP_ID || "notification-group",
        sessionTimeout: 30000,
        heartbeatInterval: 3000,
      });

      this.consumerInstance = consumer;
      
      await consumer.connect();
      console.log("[NotificationConsumer] ✅ Kafka consumer connected successfully");
      
      // Subscribe to notification topics
      await consumer.subscribe({ topic: "otp-messages", fromBeginning: false });
      await consumer.subscribe({ topic: "forgot-password-messages", fromBeginning: false });
      await consumer.subscribe({ topic: "welcome-messages", fromBeginning: false });
      console.log("[NotificationConsumer] 📥 Subscribed to notification topics");
      
      await consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
          try {
            if (!message.value) {
              console.log(`[NotificationConsumer] Received empty message from topic: ${topic}`);
              return;
            }

            const payload: NotificationPayload = JSON.parse(message.value.toString());
            console.log(`[NotificationConsumer] 📨 Message received from topic: ${topic}, partition: ${partition}`);
            await this.processMessage(payload, topic);

          } catch (error) {
            console.error(`[NotificationConsumer] ❌ Error processing message from topic ${topic}:`, error);
          }
        },
      });
    } catch (error) {
      console.error("[NotificationConsumer] Error starting consumer:", error);
      // Retry after 5 seconds
      setTimeout(() => {
        console.log("[NotificationConsumer] Retrying to start consumer...");
        this.start();
      }, 5000);
    }
  }

  /**
   * Process incoming notification message
   */
  private static async processMessage(payload: NotificationPayload, topic: string): Promise<void> {
    const { action, type, data } = payload;
    console.log(`[NotificationConsumer] 🔄 Processing message from ${topic}: ${action} - ${type}`);

    try {
      switch (action) {
        case NotificationAction.AUTH_OTP:
          if (topic === "otp-messages") {
            await this.handleAuthOTP(type, data);
          } else {
            console.warn(`[NotificationConsumer] ⚠️  AUTH_OTP action received from unexpected topic: ${topic}`);
          }
          break;

        case NotificationAction.EMAIL_NOTIFICATION:
          if (topic === "welcome-messages") {
            await this.handleEmailNotification(type, data);
          } else {
            console.warn(`[NotificationConsumer] ⚠️  EMAIL_NOTIFICATION action received from unexpected topic: ${topic}`);
          }
          break;

        case NotificationAction.FORGOT_PASSWORD:
          if (topic === "forgot-password-messages") {
            await this.handleForgotPassword(type, data);
          } else {
            console.warn(`[NotificationConsumer] ⚠️  FORGOT_PASSWORD action received from unexpected topic: ${topic}`);
          }
          break;

        default:
          console.log(`[NotificationConsumer] ❓ Unknown action: ${action} from topic: ${topic}`);
      }
    } catch (error) {
      console.error(`[NotificationConsumer] ❌ Error handling message from ${topic}:`, error);
      throw error; // Re-throw to allow caller to handle if needed
    }
  }

  /**
   * Handle authentication OTP messages from otp-messages topic
   */
  private static async handleAuthOTP(type: NotificationType, data: any): Promise<void> {
    console.log(`[NotificationConsumer] 🔐 Processing OTP notification: ${type}`);
    
    if (type === NotificationType.ORG_OTP) {
      console.log(`[NotificationConsumer] 📧 Sending OTP email to: ${data.email}`);
      await OTPHandler.handleOTPEmail(data);
      console.log(`[NotificationConsumer] ✅ OTP email sent successfully`);
    } else {
      console.log(`[NotificationConsumer] ❓ Unknown OTP type: ${type}`);
    }
  }

  /**
   * Handle email notification messages from welcome-messages topic
   */
  private static async handleEmailNotification(type: NotificationType, data: any): Promise<void> {
    console.log(`[NotificationConsumer] 📧 Processing email notification: ${type}`);
    
    switch (type) {
      case NotificationType.WELCOME_EMAIL:
        console.log(`[NotificationConsumer] 👋 Sending college welcome email to: ${data.email}`);
        await WelcomeEmailHandler.handleCollegeWelcome(data);
        console.log(`[NotificationConsumer] ✅ College welcome email sent successfully`);
        break;

      case NotificationType.STAFF_WELCOME_EMAIL:
        console.log(`[NotificationConsumer] 👋 Sending staff welcome email to: ${data.email}`);
        await WelcomeEmailHandler.handleStaffWelcome(data);
        console.log(`[NotificationConsumer] ✅ Staff welcome email sent successfully`);
        break;
      case NotificationType.HOD_WELCOME_EMAIL:
        await WelcomeEmailHandler.handleHodWelcome(data)
        break;

        

      default:
        console.log(`[NotificationConsumer] ❓ Unknown email notification type: ${type}`);
    }
  }

  /**
   * Handle forgot password messages from forgot-password-messages topic
   */
  private static async handleForgotPassword(type: NotificationType, data: any): Promise<void> {
    console.log(`[NotificationConsumer] 🔑 Processing password reset notification: ${type}`);
    
    switch (type) {
      case NotificationType.ORG_FORGOT_PASSWORD:
        console.log(`[NotificationConsumer] 📧 Sending organization password reset email to: ${data.email}`);
        await PasswordResetHandler.handleOrganizationPasswordReset(data);
        console.log(`[NotificationConsumer] ✅ Organization password reset email sent successfully`);
        break;

      case NotificationType.COLLEGE_FORGOT_PASSWORD:
        console.log(`[NotificationConsumer] 📧 Sending college password reset email to: ${data.email}`);
        await PasswordResetHandler.handleCollegePasswordReset(data);
        console.log(`[NotificationConsumer] ✅ College password reset email sent successfully`);
        break;
      case NotificationType.NON_TEACHING_STAFF_FORGOT_PASSWORD:
        console.log(`[NotificationConsumer] 📧 Sending non-teaching staff password reset email to: ${data.email}`);
        await PasswordResetHandler.handleNonTeachingStaffPasswordReset(data);
        console.log(`[NotificationConsumer] ✅ Non-teaching staff password reset email sent successfully`);
        break;
      case NotificationType.HOD_FORGOT_PASSWORD:
        console.log(`[NotificationConsumer] 📧 Sending HOD password reset email to: ${data.email}`);
        await PasswordResetHandler.handleHodPasswordReset(data);
        console.log(`[NotificationConsumer] ✅ HOD password reset email sent successfully`);
        break;
      
        

      default:
        console.log(`[NotificationConsumer] ❓ Unknown forgot password type: ${type}`);
    }
  }

  

  /**
   * Gracefully shutdown the consumer
   */
  public static async shutdown(): Promise<void> {
    if (this.consumerInstance) {
      await this.consumerInstance.disconnect();
      console.log("[NotificationConsumer] Consumer disconnected");
    }
  }
}
