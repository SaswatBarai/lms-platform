import { Router } from "express";
import {createOrganizationController} from "@controller/organization/auth.controller.js"
import {validate} from "@middleware/validate.js"
import {createOrganizationSchema} from "@schemas/organization.js"

const router: Router = Router();

router.post("/create-organization",validate({body: createOrganizationSchema}),createOrganizationController)



export default router;