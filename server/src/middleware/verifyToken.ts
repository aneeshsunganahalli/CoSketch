import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
}

export const authenticateToken = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  try {
    // Get token from cookie instead of Authorization header
    const token = req.cookies?.auth_token;

    if (!token) {
      res.status(401).json({ success: false, message: 'Access token is required' });
      return;
    }

    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET is not defined');
      res.status(500).json({ success: false, message: 'Server configuration error' });
      return;
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      issuer: 'cosketch-app',
      audience: 'cosketch-users'
    }) as { id: string; email: string };

    // Add user info to request object
    req.user = {
      id: decoded.id,
      email: decoded.email
    };

    next();
    
  } catch (error: any) {
    console.error('Token verification failed:', error.message);
    
    if (error.name === 'TokenExpiredError') {
      res.status(401).json({ success: false, message: 'Token has expired' });
      return;
    }
    
    if (error.name === 'JsonWebTokenError') {
      res.status(401).json({ success: false, message: 'Invalid token' });
      return;
    }

    res.status(500).json({ success: false, message: 'Token verification failed' });
  }
};