import { OrganizationAction } from "actions/org.action.js";
import { htmlForForgotPassword } from "html/index.js";
import env from "@config/env.js";
import { transporter } from "@config/mail.config.js";

interface data {
    email: string;
    otp?: string;
    collegeName?: string;
    loginUrl?: string;
    name?: string;
    tempPassword?: string;
}

interface IParameter {
    type: string;
    subType: string | undefined;
    data: data;

}

export const authOTP = async(
    {type,subType,data}:IParameter
) => {
    try {
        console.log(`[notification] Processing OTP request: ${type}-${subType}`);
        
        switch(type) {
            case "org-otp":
                if(subType === "create-account") {
                    const {email,otp} = data;
                    console.log("mark 1",otp,email);
                    if (!email || !otp) {
                        console.error("[notification] Missing email or OTP in data");
                        return;
                    }
                    
                    const success = await OrganizationAction.sendOrgCreateAccountOTP(email,otp);
                    if (success) {
                        console.log(`[notification] Successfully processed OTP for ${email}`);
                    } else {
                        console.error(`[notification] Failed to process OTP for ${email}`);
                    }
                }
                break;
            default:
                console.log(`[notification] Unknown OTP type: ${type}`);
        }
    } catch (error: any) {
        console.error(`[notification] Error in authOTP:`, error.message);
    }
}


export const emailNotification = async(
    {type,subType,data}:IParameter
) => {
    try {

        switch(type) {
            case "welcome-email":
                // Implement welcome email logic here
                if(subType === "create-account") {
                    console.log("mark 2",data,type,subType);    
                    const email = data.email;
                    const collegeName = data.collegeName;
                    const loginUrl = data.loginUrl;
                    if (!email) {
                        console.error("[notification] Missing email in data for welcome email");
                        return;
                    }
                    // Call the appropriate action to send welcome email
                    console.log(`[notification] Sending welcome email to ${email} for ${collegeName || 'College'}`);
                    
                    const success = await OrganizationAction.sendCollegeAccountCreatedEmail(
                        collegeName || "College",
                        email,
                        loginUrl || "http://localhost:8000/auth/api/login-college"
                    );
                    
                    if(success){
                        console.log(`[notification] Successfully sent welcome email to ${email}`);
                    }
                    else {
                        console.error(`[notification] Error sending welcome email to ${email}`);
                    }
                }
                break;

            case "staff-welcome-email":
                if (subType === "create-account") {
                    const { email, name, tempPassword, loginUrl } = data;
                    if (!email || !name || !tempPassword) {
                        console.error("[notification] Missing data for staff welcome email");
                        return;
                    }
                    console.log(`[notification] Sending staff welcome email to ${email}`);
                    
                    const success = await OrganizationAction.sendStaffWelcomeEmail(
                        name,
                        email,
                        tempPassword,
                        loginUrl || "http://localhost:8000/auth/api/login-staff"
                    );

                    if (success) {
                        console.log(`[notification] Successfully sent staff welcome email to ${email}`);
                    } else {
                        console.error(`[notification] Error sending staff welcome email to ${email}`);
                    }
                }
                break;

            default:
                console.log(`[notification] Unknown email notification type: ${type}`);
        }
        
    } catch (error) {
        
    }
}


export const forgotPasswordOrganization =  async(email:string,sessionToken:string) => {
    try {
        const resetLink = `http://localhost:8000/auth/api/reset-password-organization`;
        const html = htmlForForgotPassword("LMS Platform",resetLink, sessionToken);
        const result = await transporter.sendMail({
            from: `LMS Platform <${env.MAIL_USER}>`,
            to: email,
            subject: "Reset Your Password",
            html: html
        })
        if(result.rejected.length > 0){
            console.error(`[notification] Failed to send forgot password email to ${email}`);
            return false;
        }
        console.log(`[notification] Forgot password email sent successfully to ${email}`);
        return true;
    } catch (error) {
        console.error(`[notification] Error in forgotPasswordOrganization:`, error instanceof Error ? error.message : String(error));
        return false;
    }
}

export const forgotPasswordCollege = async(email:string,sessionToken:string) => {
    try {
        const resetLink = `http://localhost:8000/auth/api/reset-password-college`;
        const html = htmlForForgotPassword("LMS Platform",resetLink, sessionToken);
        const result = await transporter.sendMail({
            from: `LMS Platform <${env.MAIL_USER}>`,
            to: email,
            subject: "Reset Your Password",
            html: html
        })
        if(result.rejected.length > 0){
            console.error(`[notification] Failed to send forgot password email to ${email}`);
            return false;
        }
        console.log(`[notification] Forgot password email sent successfully to ${email}`);
        return true;
    } catch (error) {
        console.error(`[notification] Error in forgotPasswordCollege:`, error instanceof Error ? error.message : String(error));
        return false;
    }
}


















