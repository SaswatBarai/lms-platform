import {Router} from "express"
import { Request, Response } from "express"

import { createOrganization } from "../controller/organization/auth.controller.js"

const router: Router = Router()

router.get("/create", (req:Request, res:Response) => {
    res.json({
        message:"Hello",
        success:true
    })
})





export default router