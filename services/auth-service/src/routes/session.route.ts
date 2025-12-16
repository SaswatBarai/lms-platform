import { Router, type Router as ExpressRouter } from "express";
import { AuthenticatedUser } from "../middleware/authValidator.js";
import { getCurrentSession, logoutAllSessions, forceLogoutUser } from "../controller/common/session.controller.js";

const router: ExpressRouter = Router();

// Student Session Routes
router.get("/student/me/session", AuthenticatedUser.checkStudent, getCurrentSession);
router.post("/student/me/logout-all", AuthenticatedUser.checkStudent, logoutAllSessions);

// Admin Routes (Protect with College/Org Admin check)
router.post("/admin/force-logout", AuthenticatedUser.checkCollege, forceLogoutUser);

export default router;