import { Schema, model, Document } from 'mongoose';

/**
 * TypeScript interface representing Category Document in MongoDB
 */
export interface ICategory extends Document {
  name: string;
  slug: string;
  icon?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * MongoDB Category Schema with timestamps and slug indexing
 */
const CategorySchema = new Schema<ICategory>(
  {
    name: {
      type: String,
      required: [true, 'Category name is required'],
      unique: true,
      trim: true,
      maxlength: [50, 'Category name cannot exceed 50 characters']
    },
    slug: {
      type: String,
      required: [true, 'Slug is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true
    },
    icon: {
      type: String,
      default: 'ShoppingBag'
    }
  },
  {
    // Automatically creates and manages 'createdAt' and 'updatedAt' fields
    timestamps: true,
    versionKey: false
  }
);

// Pre-validate middleware to auto-generate slug from name if not provided
CategorySchema.pre('validate', function () {
  if (this.name && !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
});

export const Category = model<ICategory>('Category', CategorySchema);
export default Category;
