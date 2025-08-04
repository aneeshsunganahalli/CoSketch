import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../types/room.types";


// Optional auth middleware - sets req.user if token exists, but doesn't require it
const optionalAuth = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  const token = req.cookies?.auth_token;
  if (token) {
    try {
      // Try to authenticate, but don't send error response if it fails
      const jwt = require('jsonwebtoken');
      const UserModel = require('../models/user.model').default;
      
      if (!process.env.JWT_SECRET) {
        return next(); // Continue as guest if no JWT secret
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET, {
        issuer: 'cosketch-app',
        audience: 'cosketch-users'
      }) as { id: string; email: string };

      const user = await UserModel.findById(decoded.id).select('_id name email');
      
      if (user) {
        req.user = {
          id: user._id.toString(),
          name: user.name,
          email: user.email
        };
      }
    } catch (error: any) {
      // If auth fails, continue as guest (don't send error response)
      console.log('Optional auth failed, continuing as guest:', error.message);
    }
  }
  next();
};

export default optionalAuth;