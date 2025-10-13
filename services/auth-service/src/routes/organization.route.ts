import {Router} from "express"
import { Request, Response } from "express"

import { createOrganization } from "../controller/organization/auth.controller.js"

const router: Router = Router()


router.post("/create", createOrganization);


export default router