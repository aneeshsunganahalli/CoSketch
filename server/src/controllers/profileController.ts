import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import User from '../models/user.model';
import { AuthenticatedRequest } from '../types/room.types';

export const getProfile = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const userDoc = await User.findById(user.id).select('-password');
    
    if (!userDoc) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      id: userDoc._id,
      name: userDoc.name,
      email: userDoc.email,
      createdAt: userDoc.createdAt,
      updatedAt: userDoc.updatedAt
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateProfile = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user;
    const { name, email, currentPassword, newPassword } = req.body;

    if (!user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Validation
    if (!name || !email) {
      return res.status(400).json({ message: 'Name and email are required' });
    }

    if (name.trim().length < 2) {
      return res.status(400).json({ message: 'Name must be at least 2 characters long' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    const userDoc = await User.findById(user.id);
    
    if (!userDoc) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if email is already taken by another user
    if (email !== userDoc.email) {
      const existingUser = await User.findOne({ email, _id: { $ne: user.id } });
      if (existingUser) {
        return res.status(400).json({ message: 'Email already in use' });
      }
    }

    // Handle password update
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ message: 'Current password is required to update password' });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ message: 'New password must be at least 6 characters long' });
      }

      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, userDoc.password);
      if (!isCurrentPasswordValid) {
        return res.status(400).json({ message: 'Current password is incorrect' });
      }

      // Hash new password
      const saltRounds = 10;
      const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);
      userDoc.password = hashedNewPassword;
    }

    // Update user fields
    userDoc.name = name.trim();
    userDoc.email = email.trim().toLowerCase();
    userDoc.updatedAt = new Date();

    await userDoc.save();

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: userDoc._id,
        name: userDoc.name,
        email: userDoc.email,
        updatedAt: userDoc.updatedAt
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteAccount = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user;
    const { password, confirmDeletion } = req.body;

    if (!user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (!password || !confirmDeletion) {
      return res.status(400).json({ message: 'Password and confirmation are required' });
    }

    if (confirmDeletion !== 'DELETE') {
      return res.status(400).json({ message: 'Please type DELETE to confirm account deletion' });
    }

    const userDoc = await User.findById(user.id);
    
    if (!userDoc) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, userDoc.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Password is incorrect' });
    }

    // Note: Rooms are now handled in-memory only, no database cleanup needed

    // Delete the user account
    await User.findByIdAndDelete(user.id);

    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const changePassword = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user;
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ message: 'All password fields are required' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: 'New passwords do not match' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters long' });
    }

    const userDoc = await User.findById(user.id);
    
    if (!userDoc) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, userDoc.password);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // Hash new password
    const saltRounds = 10;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);
    
    userDoc.password = hashedNewPassword;
    userDoc.updatedAt = new Date();
    await userDoc.save();

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
