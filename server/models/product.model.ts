import { Schema, model, Document } from 'mongoose';

/**
 * TypeScript interface representing Product Document in MongoDB
 */
export interface IProduct extends Document {
  vendorId: string; // References the Vendor (can be vendor profile string ID)
  categoryId: Schema.Types.ObjectId; // References Category model
  name: string;
  description?: string;
  price: number;
  compareAtPrice?: number;
  stock: number;
  rating: number;
  isFeatured: boolean;
  imageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * MongoDB Product Schema with timestamps, compound indexes, and numeric bounds
 */
const ProductSchema = new Schema<IProduct>(
  {
    vendorId: {
      type: String,
      required: [true, 'Vendor ID is required'],
      index: true
    },
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Product category is required'],
      index: true
    },
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      index: true,
      maxlength: [200, 'Product name cannot exceed 200 characters']
    },
    description: {
      type: String,
      trim: true
    },
    price: {
      type: Number,
      required: [true, 'Product price is required'],
      min: [0, 'Price cannot be negative']
    },
    compareAtPrice: {
      type: Number,
      min: [0, 'Compare price cannot be negative']
    },
    stock: {
      type: Number,
      default: 0,
      min: [0, 'Stock count cannot be negative']
    },
    rating: {
      type: Number,
      default: 0,
      min: [0, 'Rating cannot be negative'],
      max: [5, 'Rating cannot exceed 5']
    },
    isFeatured: {
      type: Boolean,
      default: false,
      index: true
    },
    imageUrl: {
      type: String,
      default: ''
    }
  },
  {
    // Automatically creates and manages 'createdAt' and 'updatedAt' fields
    timestamps: true,
    versionKey: false
  }
);

// Optimize query performance with text search index for name and description
ProductSchema.index({ name: 'text', description: 'text' });

export const Product = model<IProduct>('Product', ProductSchema);
export default Product;
