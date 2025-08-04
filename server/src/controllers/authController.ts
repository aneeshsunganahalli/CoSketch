import { Request, Response } from 'express';
import validator from 'validator';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import UserModel, { IUser } from '../models/user.model';

// Cookie configuration
const COOKIE_OPTIONS = {
  httpOnly: true, // Prevents XSS attacks
  secure: process.env.NODE_ENV === 'production', // HTTPS only in production
  sameSite: 'strict' as const, // CSRF protection
  maxAge: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
  path: '/', // Available on all paths
};

const registerUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password } = req.body;

    // Input validations with more specific checks
    if (!name || !email || !password) {
      res.status(400).json({ success: false, message: "All fields are required" });
      return;
    }

    // Sanitize and validate name
    const sanitizedName = name.trim();
    if (sanitizedName.length < 2 || sanitizedName.length > 50) {
      res.status(400).json({ success: false, message: "Name must be between 2 and 50 characters" });
      return;
    }

    // Validate email format and normalize
    const normalizedEmail = email.toLowerCase().trim();
    if (!validator.isEmail(normalizedEmail)) {
      res.status(400).json({ success: false, message: "Please enter a valid email address" });
      return;
    }

    // Enhanced password validation
    if (password.length < 8) {
      res.status(400).json({ success: false, message: "Password must be at least 8 characters long" });
      return;
    }

    if (password.length > 128) {
      res.status(400).json({ success: false, message: "Password must be less than 128 characters" });
      return;
    }

    // Check password strength
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);

    if (!(hasUpperCase && hasLowerCase && hasNumbers)) {
      res.status(400).json({ 
        success: false, 
        message: "Password must contain at least one uppercase letter, one lowercase letter, and one number" 
      });
      return;
    }

    // Check if user already exists
    const existingUser = await UserModel.findOne({ email: normalizedEmail });
    if (existingUser) {
      res.status(409).json({ success: false, message: "An account with this email already exists" });
      return;
    }

    // Hash password with higher salt rounds for better security
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user with sanitized data
    const userData: Partial<IUser> = {
      name: sanitizedName,
      email: normalizedEmail,
      password: hashedPassword,
    };

    const newUser = new UserModel(userData);
    const user = await newUser.save();

    // Verify JWT_SECRET exists
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET is not defined in environment variables');
      res.status(500).json({ success: false, message: "Server configuration error" });
      return;
    }

    // Generate JWT token with shorter expiry for better security
    const token = jwt.sign(
      { 
        id: user._id,
        email: user.email 
      }, 
      process.env.JWT_SECRET,
      {
        expiresIn: '24h', // Shorter expiry time
        issuer: 'cosketch-app',
        audience: 'cosketch-users'
      }
    );

    // Set JWT as HTTP-only cookie
    res.cookie('auth_token', token, COOKIE_OPTIONS);

    res.status(201).json({ 
      success: true, 
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });

  } catch (error: any) {
    console.error('Registration error:', error);
    
    // Handle specific MongoDB errors
    if (error.code === 11000) {
      res.status(409).json({ success: false, message: "An account with this email already exists" });
      return;
    }
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map((err: any) => err.message);
      res.status(400).json({ success: false, message: validationErrors.join(', ') });
      return;
    }

    res.status(500).json({ success: false, message: "An error occurred during registration. Please try again." });
  }
};

const loginUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Input validation
    if (!email || !password) {
      res.status(400).json({ success: false, message: "Email and password are required" });
      return;
    }

    // Normalize email
    const normalizedEmail = email.toLowerCase().trim();
    
    // Validate email format
    if (!validator.isEmail(normalizedEmail)) {
      res.status(400).json({ success: false, message: "Please enter a valid email address" });
      return;
    }

    // Find user by email
    const user = await UserModel.findOne({ email: normalizedEmail });
    if (!user) {
      // Use same response time to prevent email enumeration
      await new Promise(resolve => setTimeout(resolve, 100));
      res.status(401).json({ success: false, message: "Invalid email or password" });
      return;
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      // Use same response time to prevent timing attacks
      await new Promise(resolve => setTimeout(resolve, 100));
      res.status(401).json({ success: false, message: "Invalid email or password" });
      return;
    }

    // Verify JWT_SECRET exists
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET is not defined in environment variables');
      res.status(500).json({ success: false, message: "Server configuration error" });
      return;
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: user._id,
        email: user.email 
      }, 
      process.env.JWT_SECRET,
      {
        expiresIn: '24h',
        issuer: 'cosketch-app',
        audience: 'cosketch-users'
      }
    );

     res.cookie('auth_token', token, COOKIE_OPTIONS);

    // Update last login time (you might want to add this field to your user model)
    // await UserModel.findByIdAndUpdate(user._id, { lastLogin: new Date() });

    res.status(200).json({ 
      success: true, 
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });

  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: "An error occurred during login. Please try again." });
  }
};

const logoutUser = async (req: Request, res: Response): Promise<void> => {
  try {
    // Clear the authentication cookie
    res.clearCookie('auth_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
    });

    res.status(200).json({ 
      success: true, 
      message: "Logged out successfully" 
    });
  } catch (error: any) {
    console.error('Logout error:', error);
    res.status(500).json({ success: false, message: "An error occurred during logout" });
  }
};

const verifyUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const token = req.cookies?.auth_token;

    if (!token) {
      res.status(401).json({ success: false, message: "No authentication token found" });
      return;
    }

    // Verify JWT_SECRET exists
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET is not defined in environment variables');
      res.status(500).json({ success: false, message: "Server configuration error" });
      return;
    }

    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET) as { id: string; email: string };

    // Find the user to make sure they still exist
    const user = await UserModel.findById(decoded.id);
    if (!user) {
      res.status(401).json({ success: false, message: "User not found" });
      return;
    }

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });

  } catch (error: any) {
    console.error('Token verification error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      res.status(401).json({ success: false, message: "Invalid authentication token" });
      return;
    }
    
    if (error.name === 'TokenExpiredError') {
      res.status(401).json({ success: false, message: "Authentication token has expired" });
      return;
    }
    
    res.status(500).json({ success: false, message: "Authentication verification failed" });
  }
};


export { registerUser, loginUser, logoutUser, verifyUser };