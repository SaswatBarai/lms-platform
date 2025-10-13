import {Router} from "express"

import { createOrganization } from "../controller/organization/auth.controller.js"

const router: Router = Router()

router.get("/create", createOrganization)





export default router