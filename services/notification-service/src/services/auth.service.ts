import { OrganizationAction } from "actions/org.action.js";

interface data {
    email: string;
    otp?: string;
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
                    const {email} = data;
                    if (!email) {
                        console.error("[notification] Missing email in data for welcome email");
                        return;
                    }
                    // Call the appropriate action to send welcome email
                    console.log(`[notification] Sending welcome email to ${email}`);
                    // Example: await OrganizationAction.sendWelcomeEmail(email);
                    const sucess = await OrganizationAction.sendCollegeAccountCreatedEmail("Student","College",email,"https://lms-platform.com/login");
                    if(!sucess){
                        console.log("Successfully college create ")
                    }
                    else {
                        console.log("Error in craetion of college")
                    }
                }
                break;
            default:
                console.log(`[notification] Unknown email notification type: ${type}`);
        }
        
    } catch (error) {
        
    }
}



