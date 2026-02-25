import { Router } from 'express';
import {
  createApiKey,
  listApiKeys,
  revokeApiKey
} from '../controller/api-key/api-key.controller.js';
import { AuthenticatedUser } from "../middleware/authValidator.js";
import { restrictTo } from "../middleware/restrictTo.middleware.js";
import { normalizeAuthUser } from "../middleware/normalizeAuthUser.js";

const router: Router = Router();

// All routes require authentication and role-based access
router.use(AuthenticatedUser.checkOrganization);
router.use(normalizeAuthUser);
router.use(restrictTo('admin', 'college_admin', 'organization')); 

router
  .route('/')
  .post(createApiKey)
  .get(listApiKeys);

router
  .route('/:id')
  .delete(revokeApiKey);

export default router;