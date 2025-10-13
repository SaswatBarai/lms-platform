import { Router } from "express";
import { 
    createOrganization, 
   
} from "../controller/organization/auth.controller.js";

const router: Router = Router();

// ===============================
// ORGANIZATION CRUD ROUTES
// ===============================

// POST /organizations - Create a new organization
router.post("/", createOrganization);


// POST /create - Legacy create endpoint
router.post("/create", createOrganization);



export default router;