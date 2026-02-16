import { kafka } from "./kafka.js";
import { NotificationPayload, NotificationAction, NotificationType } from "../types/notification.types.js";
import { OTPHandler, WelcomeEmailHandler, PasswordResetHandler, NewDeviceHandler } from "../handlers/index.js";
import { logger } from "../config/logger.js";

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
      logger.info("[NotificationConsumer] ✅ Kafka consumer connected successfully");
      
      // Subscribe to notification topics
      await consumer.subscribe({ topic: "otp-messages", fromBeginning: false });
      await consumer.subscribe({ topic: "forgot-password-messages", fromBeginning: false });
      await consumer.subscribe({ topic: "welcome-messages", fromBeginning: false });
      await consumer.subscribe({ topic: "new-device-login-messages", fromBeginning: false });
      logger.info("[NotificationConsumer] 📥 Subscribed to notification topics");
      
      await consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
          try {
            if (!message.value) {
              logger.info(`[NotificationConsumer] Received empty message from topic: ${topic}`);
              return;
            }

            const payload: NotificationPayload = JSON.parse(message.value.toString());
            logger.info(`[NotificationConsumer] 📨 Message received from topic: ${topic}, partition: ${partition}`);
            await this.processMessage(payload, topic);

          } catch (error) {
            logger.error(`[NotificationConsumer] ❌ Error processing message from topic ${topic}:`, error);
          }
        },
      });
    } catch (error) {
      logger.error("[NotificationConsumer] Error starting consumer:", error);
      // Retry after 5 seconds
      setTimeout(() => {
        logger.info("[NotificationConsumer] Retrying to start consumer...");
        this.start();
      }, 5000);
    }
  }

  /**
   * Process incoming notification message
   */
  private static async processMessage(payload: NotificationPayload, topic: string): Promise<void> {
    const { action, type, data } = payload;
    logger.info(`[NotificationConsumer] 🔄 Processing message from ${topic}: ${action} - ${type}`);

    try {
      switch (action) {
        case NotificationAction.AUTH_OTP:
          if (topic === "otp-messages") {
            await this.handleAuthOTP(type, data);
          } else {
            logger.warn(`[NotificationConsumer] ⚠️  AUTH_OTP action received from unexpected topic: ${topic}`);
          }
          break;

        case NotificationAction.EMAIL_NOTIFICATION:
          if (topic === "welcome-messages") {
            await this.handleEmailNotification(type, data);
          } else {
            logger.warn(`[NotificationConsumer] ⚠️  EMAIL_NOTIFICATION action received from unexpected topic: ${topic}`);
          }
          break;

        case NotificationAction.FORGOT_PASSWORD:
          if (topic === "forgot-password-messages") {
            await this.handleForgotPassword(type, data);
          } else {
            logger.warn(`[NotificationConsumer] ⚠️  FORGOT_PASSWORD action received from unexpected topic: ${topic}`);
          }
          break;

        case NotificationAction.NEW_DEVICE_LOGIN:
          if (topic === "new-device-login-messages") {
            await this.handleNewDeviceLogin(type, data);
          } else {
            logger.warn(`[NotificationConsumer] ⚠️  NEW_DEVICE_LOGIN action received from unexpected topic: ${topic}`);
          }
          break;

        default:
          logger.info(`[NotificationConsumer] ❓ Unknown action: ${action} from topic: ${topic}`);
      }
    } catch (error) {
      logger.error(`[NotificationConsumer] ❌ Error handling message from ${topic}:`, error);
      throw error; // Re-throw to allow caller to handle if needed
    }
  }

  /**
   * Handle authentication OTP messages from otp-messages topic
   */
  private static async handleAuthOTP(type: NotificationType, data: any): Promise<void> {
    logger.info(`[NotificationConsumer] 🔐 Processing OTP notification: ${type}`);
    
    if (type === NotificationType.ORG_OTP) {
      logger.info(`[NotificationConsumer] 📧 Sending OTP email to: ${data.email}`);
      await OTPHandler.handleOTPEmail(data);
      logger.info(`[NotificationConsumer] ✅ OTP email sent successfully`);
    } else {
      logger.info(`[NotificationConsumer] ❓ Unknown OTP type: ${type}`);
    }
  }

  /**
   * Handle email notification messages from welcome-messages topic
   */
  private static async handleEmailNotification(type: NotificationType, data: any): Promise<void> {
    logger.info(`[NotificationConsumer] 📧 Processing email notification: ${type}`);
    
    switch (type) {
      case NotificationType.WELCOME_EMAIL:
        logger.info(`[NotificationConsumer] 👋 Sending college welcome email to: ${data.email}`);
        await WelcomeEmailHandler.handleCollegeWelcome(data);
        logger.info(`[NotificationConsumer] ✅ College welcome email sent successfully`);
        break;

      case NotificationType.STAFF_WELCOME_EMAIL:
        logger.info(`[NotificationConsumer] 👋 Sending staff welcome email to: ${data.email}`);
        await WelcomeEmailHandler.handleStaffWelcome(data);
        logger.info(`[NotificationConsumer] ✅ Staff welcome email sent successfully`);
        break;

      case NotificationType.TEACHER_WELCOME_EMAIL:
        logger.info(`[NotificationConsumer] 👨‍🏫 Sending teacher welcome email to: ${data.email} (EmployeeNo: ${data.employeeNo})`);
        await WelcomeEmailHandler.handleTeacherWelcome(data);
        logger.info(`[NotificationConsumer] ✅ Teacher welcome email sent successfully`);
        break;

      case NotificationType.HOD_WELCOME_EMAIL:
        logger.info(`[NotificationConsumer] 👋 Sending HOD welcome email to: ${data.email}`);
        await WelcomeEmailHandler.handleHodWelcome(data);
        logger.info(`[NotificationConsumer] ✅ HOD welcome email sent successfully`);
        break;

      case NotificationType.STUDENT_WELCOME_EMAIL:
        logger.info(`[NotificationConsumer] 🎓 Sending student welcome email to: ${data.email} (RegNo: ${data.regNo})`);
        await WelcomeEmailHandler.handleStudentWelcome(data);
        logger.info(`[NotificationConsumer] ✅ Student welcome email sent successfully`);
        break;

      case NotificationType.DEAN_WELCOME_EMAIL:
        logger.info(`[NotificationConsumer] 🎓 Sending dean welcome email to: ${data.email}`);
        await WelcomeEmailHandler.handleDeanWelcome(data);
        logger.info(`[NotificationConsumer] ✅ Dean welcome email sent successfully`);
        break;

      default:
        logger.info(`[NotificationConsumer] ❓ Unknown email notification type: ${type}`);
    }
  }

  /**
   * Handle forgot password messages from forgot-password-messages topic
   */
  private static async handleForgotPassword(type: NotificationType, data: any): Promise<void> {
    logger.info(`[NotificationConsumer] 🔑 Processing password reset notification: ${type}`);
    
    switch (type) {
      case NotificationType.ORG_FORGOT_PASSWORD:
        logger.info(`[NotificationConsumer] 📧 Sending organization password reset email to: ${data.email}`);
        await PasswordResetHandler.handleOrganizationPasswordReset(data);
        logger.info(`[NotificationConsumer] ✅ Organization password reset email sent successfully`);
        break;

      case NotificationType.COLLEGE_FORGOT_PASSWORD:
        logger.info(`[NotificationConsumer] 📧 Sending college password reset email to: ${data.email}`);
        await PasswordResetHandler.handleCollegePasswordReset(data);
        logger.info(`[NotificationConsumer] ✅ College password reset email sent successfully`);
        break;
      case NotificationType.NON_TEACHING_STAFF_FORGOT_PASSWORD:
        logger.info(`[NotificationConsumer] 📧 Sending non-teaching staff password reset email to: ${data.email}`);
        await PasswordResetHandler.handleNonTeachingStaffPasswordReset(data);
        logger.info(`[NotificationConsumer] ✅ Non-teaching staff password reset email sent successfully`);
        break;
      case NotificationType.HOD_FORGOT_PASSWORD:
        logger.info(`[NotificationConsumer] 📧 Sending HOD password reset email to: ${data.email}`);
        await PasswordResetHandler.handleHodPasswordReset(data);
        logger.info(`[NotificationConsumer] ✅ HOD password reset email sent successfully`);
        break;
      
      case NotificationType.STUDENT_FORGOT_PASSWORD:
        logger.info(`[NotificationConsumer] 🎓 Sending student password reset email to: ${data.email} (RegNo: ${data.regNo})`);
        await PasswordResetHandler.handleStudentPasswordReset(data);
        logger.info(`[NotificationConsumer] ✅ Student password reset email sent successfully`);
        break;

      case NotificationType.TEACHER_FORGOT_PASSWORD:
        logger.info(`[NotificationConsumer] 👨‍🏫 Sending teacher password reset email to: ${data.email} (EmployeeNo: ${data.employeeNo})`);
        await PasswordResetHandler.handleTeacherPasswordReset(data);
        logger.info(`[NotificationConsumer] ✅ Teacher password reset email sent successfully`);
        break;

      case NotificationType.DEAN_FORGOT_PASSWORD:
        logger.info(`[NotificationConsumer] 🎓 Sending dean password reset email to: ${data.email}`);
        await PasswordResetHandler.handleDeanPasswordReset(data);
        logger.info(`[NotificationConsumer] ✅ Dean password reset email sent successfully`);
        break;

      default:
        logger.info(`[NotificationConsumer] ❓ Unknown forgot password type: ${type}`);
    }
  }

  /**
   * Handle new device login messages from new-device-login-messages topic
   */
  private static async handleNewDeviceLogin(type: NotificationType, data: any): Promise<void> {
    logger.info(`[NotificationConsumer] 🔒 Processing new device login notification: ${type}`);
    
    switch (type) {
      case NotificationType.ORG_NEW_DEVICE_LOGIN:
      case NotificationType.COLLEGE_NEW_DEVICE_LOGIN:
      case NotificationType.STUDENT_NEW_DEVICE_LOGIN:
      case NotificationType.TEACHER_NEW_DEVICE_LOGIN:
      case NotificationType.HOD_NEW_DEVICE_LOGIN:
      case NotificationType.DEAN_NEW_DEVICE_LOGIN:
      case NotificationType.NON_TEACHING_STAFF_NEW_DEVICE_LOGIN:
        logger.info(`[NotificationConsumer] 📧 Sending new device login email to: ${data.email}`);
        await NewDeviceHandler.handleNewDeviceLogin(data);
        logger.info(`[NotificationConsumer] ✅ New device login email sent successfully`);
        break;

      default:
        logger.info(`[NotificationConsumer] ❓ Unknown new device login type: ${type}`);
    }
  }

  /**
   * Gracefully shutdown the consumer
   */
  public static async shutdown(): Promise<void> {
    if (this.consumerInstance) {
      await this.consumerInstance.disconnect();
      logger.info("[NotificationConsumer] Consumer disconnected");
    }
  }
}
