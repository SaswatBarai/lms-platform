
import { AppError } from "../../utils/AppError.js";
import { asyncHandler } from "../../utils/asyncHandler.js";


export const createOrganization = asyncHandler(
    async(req,res) => {
       const {name} = req.body;
       
    }
)