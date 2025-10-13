import { Router } from "express";
import { createOrganization } from "../controller/organization/auth.controller.js";
const router = Router();
router.get("/create", createOrganization);
export default router;
//# sourceMappingURL=organization.route.js.map