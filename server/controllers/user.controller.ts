import { Request, Response } from 'express';
import { userRepository } from '../repositories/user.repository.js';
import mongoose from 'mongoose';

export class UserController {
  /**
   * CREATE User
   * POST /api/v2/users
   */
  public async createUser(req: Request, res: Response) {
    try {
      const { name, email, password, role } = req.body;
      if (!name || !email || !password) {
        return res.status(400).json({ success: false, message: 'Name, email, and password are required' });
      }

      // Check if email already registered
      const existing = await userRepository.findByEmail(email);
      if (existing) {
        return res.status(400).json({ success: false, message: 'Email address already registered' });
      }

      // Password hashing placeholder - in production, hash password using bcrypt
      const passwordHash = `pbkdf2_hashed_${password}`;
      
      const userData = {
        name,
        email,
        passwordHash,
        role: role || 'customer',
        phone: req.body.phone,
        avatarUrl: req.body.avatarUrl
      };

      const user = await userRepository.create(userData as any);
      return res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
          avatarUrl: user.avatarUrl
        }
      });
    } catch (error: any) {
      console.error('[UserController] Error in createUser:', error);
      return res.status(500).json({ success: false, message: 'Server error registering user', error: error.message });
    }
  }

  /**
   * READ Users
   * GET /api/v2/users
   */
  public async getUsers(req: Request, res: Response) {
    try {
      const { role } = req.query;
      let users;
      
      if (role) {
        users = await userRepository.findByRole(role as any);
      } else {
        users = await userRepository.find({});
      }

      return res.status(200).json({ success: true, count: users.length, data: users });
    } catch (error: any) {
      console.error('[UserController] Error in getUsers:', error);
      return res.status(500).json({ success: false, message: 'Error retrieving users', error: error.message });
    }
  }

  /**
   * READ User by ID
   * GET /api/v2/users/:id
   */
  public async getUserById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ success: false, message: 'Invalid user ID format' });
      }

      const user = await userRepository.findById(id);
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      return res.status(200).json({ success: true, data: user });
    } catch (error: any) {
      console.error('[UserController] Error in getUserById:', error);
      return res.status(500).json({ success: false, message: 'Error fetching user details', error: error.message });
    }
  }

  /**
   * UPDATE User
   * PUT /api/v2/users/:id
   */
  public async updateUser(req: Request, res: Response) {
    try {
      const { id } = req.params;
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ success: false, message: 'Invalid user ID format' });
      }

      // Prevent updating password direct through this route
      const { password, passwordHash, email, ...updateFields } = req.body;

      const updated = await userRepository.update(id, updateFields);
      if (!updated) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      return res.status(200).json({ success: true, message: 'User updated successfully', data: updated });
    } catch (error: any) {
      console.error('[UserController] Error in updateUser:', error);
      return res.status(500).json({ success: false, message: 'Error updating user profile', error: error.message });
    }
  }

  /**
   * DELETE User
   * DELETE /api/v2/users/:id
   */
  public async deleteUser(req: Request, res: Response) {
    try {
      const { id } = req.params;
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ success: false, message: 'Invalid user ID format' });
      }

      const success = await userRepository.delete(id);
      if (!success) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      return res.status(200).json({ success: true, message: 'User deleted successfully' });
    } catch (error: any) {
      console.error('[UserController] Error in deleteUser:', error);
      return res.status(500).json({ success: false, message: 'Error deleting user account', error: error.message });
    }
  }
}

export const userController = new UserController();
export default userController;
