import { OrganizationAction } from "actions/org.action.js";

interface data {
    email: string;
    otp?: string;
    collegeName?: string;
    loginUrl?: string;
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
            default:
                console.log(`[notification] Unknown email notification type: ${type}`);
        }
        
    } catch (error) {
        
    }
}



