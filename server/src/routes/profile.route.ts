import { Router } from 'express';
import { authenticateToken } from '../middleware/verifyToken';
import {
  getProfile,
  updateProfile,
  deleteAccount,
  changePassword
} from '../controllers/profileController';

const router = Router();

// All profile routes require authentication
router.use(authenticateToken);

// GET /api/profile - Get user profile
router.get('/', getProfile);

// PUT /api/profile - Update user profile
router.put('/', updateProfile);

// PUT /api/profile/password - Change password
router.put('/password', changePassword);

// DELETE /api/profile - Delete user account
router.delete('/', deleteAccount);

export default router;
