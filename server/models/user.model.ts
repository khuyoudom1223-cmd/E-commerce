import { Schema, model, Document } from 'mongoose';

/**
 * TypeScript interface representing User Document in MongoDB
 */
export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  role: 'admin' | 'vendor' | 'rider' | 'customer';
  phone?: string;
  avatarUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * MongoDB User Schema with timestamps and performance indexes
 */
const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters']
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address']
    },
    passwordHash: {
      type: String,
      required: [true, 'Password hash is required'],
      select: false // Exclude password hash from standard queries by default for safety
    },
    role: {
      type: String,
      enum: ['admin', 'vendor', 'rider', 'customer'],
      default: 'customer',
      index: true
    },
    phone: {
      type: String,
      trim: true
    },
    avatarUrl: {
      type: String,
      default: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'
    }
  },
  {
    // Automatically creates and manages 'createdAt' and 'updatedAt' fields
    timestamps: true,
    versionKey: false // Disable '__v' field in Mongo documents
  }
);

// Create and export User Model
export const User = model<IUser>('User', UserSchema);
export default User;
