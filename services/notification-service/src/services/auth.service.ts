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
        
    }
    
}