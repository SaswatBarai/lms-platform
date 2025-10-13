import { AppError } from "../../utils/AppError.js";
import { asyncHandler } from "../../utils/asyncHandler.js";


export const createOrganization = asyncHandler(
    async(req,res) => {
        throw new AppError("Not implemented", 501);
    }
)