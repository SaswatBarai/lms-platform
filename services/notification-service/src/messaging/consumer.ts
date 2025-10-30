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
      await consumer.subscribe({ topic: "otp-auth", fromBeginning: false });
      await consumer.subscribe({ topic: "forgot-password-messages", fromBeginning: false });
      console.log("[NotificationConsumer] 📥 Subscribed to notification topics");
      
      await consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
          try {
            if (!message.value) {
              console.log("[NotificationConsumer] Received empty message");
              return;
            }

            const payload: NotificationPayload = JSON.parse(message.value.toString());
            await this.processMessage(payload);

          } catch (error) {
            console.error("[NotificationConsumer] Error processing message:", error);
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
  private static async processMessage(payload: NotificationPayload): Promise<void> {
    const { action, type, data } = payload;
    console.log(`[NotificationConsumer] Processing: ${action} - ${type}`);

    try {
      switch (action) {
        case NotificationAction.AUTH_OTP:
          await this.handleAuthOTP(type, data);
          break;

        case NotificationAction.EMAIL_NOTIFICATION:
          await this.handleEmailNotification(type, data);
          break;

        case NotificationAction.FORGOT_PASSWORD:
          await this.handleForgotPassword(type, data);
          break;

        default:
          console.log(`[NotificationConsumer] Unknown action: ${action}`);
      }
    } catch (error) {
      console.error(`[NotificationConsumer] Error handling message:`, error);
    }
  }

  /**
   * Handle authentication OTP messages
   */
  private static async handleAuthOTP(type: NotificationType, data: any): Promise<void> {
    if (type === NotificationType.ORG_OTP) {
      await OTPHandler.handleOTPEmail(data);
    } else {
      console.log(`[NotificationConsumer] Unknown OTP type: ${type}`);
    }
  }

  /**
   * Handle email notification messages
   */
  private static async handleEmailNotification(type: NotificationType, data: any): Promise<void> {
    switch (type) {
      case NotificationType.WELCOME_EMAIL:
        await WelcomeEmailHandler.handleCollegeWelcome(data);
        break;

      case NotificationType.STAFF_WELCOME_EMAIL:
        await WelcomeEmailHandler.handleStaffWelcome(data);
        break;

      default:
        console.log(`[NotificationConsumer] Unknown email notification type: ${type}`);
    }
  }

  /**
   * Handle forgot password messages
   */
  private static async handleForgotPassword(type: NotificationType, data: any): Promise<void> {
    switch (type) {
      case NotificationType.ORG_FORGOT_PASSWORD:
        await PasswordResetHandler.handleOrganizationPasswordReset(data);
        break;

      case NotificationType.COLLEGE_FORGOT_PASSWORD:
        await PasswordResetHandler.handleCollegePasswordReset(data);
        break;

      default:
        console.log(`[NotificationConsumer] Unknown forgot password type: ${type}`);
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
