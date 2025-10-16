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
    switch(type) {
        case "org-otp":
            if(subType === "create-account") {
                const {email,otp} = data;
                OrganizationAction.sendOrgCreateAccountOTP(email,otp!);
            }

    }
    
}