import { Router } from "express";
import {createOrganizationController} from "@controller/organization/auth.controller.js"

const router: Router = Router();

router.post("/create-organization",createOrganizationController)



export default router;