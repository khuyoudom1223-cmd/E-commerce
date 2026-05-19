import { Schema, model, Document } from 'mongoose';

/**
 * TypeScript interface representing individual items in an Order
 */
export interface IOrderItem {
  productId: Schema.Types.ObjectId;
  price: number;
  quantity: number;
}

/**
 * TypeScript interface representing Order Document in MongoDB
 */
export interface IOrder extends Document {
  userId: Schema.Types.ObjectId | string; // References User model (or string ID)
  vendorId: string; // References Vendor profile
  items: IOrderItem[];
  totalAmount: number;
  discountAmount: number;
  deliveryFee: number;
  couponCode?: string;
  status: 'pending' | 'confirmed' | 'packing' | 'shipping' | 'out_for_delivery' | 'delivered' | 'cancelled' | 'returned';
  createdAt: Date;
  updatedAt: Date;
}

/**
 * MongoDB Order Schema with timestamps and nested sub-documents
 */
const OrderItemSchema = new Schema<IOrderItem>({
  productId: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
    required: [true, 'Product ID is required']
  },
  price: {
    type: Number,
    required: [true, 'Item unit price is required'],
    min: [0, 'Item price cannot be negative']
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [1, 'Quantity must be at least 1']
  }
}, { _id: false });

const OrderSchema = new Schema<IOrder>(
  {
    userId: {
      type: Schema.Types.Mixed, // Accommodate both standard Mongoose ObjectIds and mock string IDs
      required: [true, 'User ID is required'],
      index: true
    },
    vendorId: {
      type: String,
      required: [true, 'Vendor ID is required'],
      index: true
    },
    items: {
      type: [OrderItemSchema],
      required: [true, 'Order must contain at least one item']
    },
    totalAmount: {
      type: Number,
      required: [true, 'Total amount is required'],
      min: [0, 'Total amount cannot be negative']
    },
    discountAmount: {
      type: Number,
      default: 0,
      min: [0, 'Discount amount cannot be negative']
    },
    deliveryFee: {
      type: Number,
      default: 0,
      min: [0, 'Delivery fee cannot be negative']
    },
    couponCode: {
      type: String,
      trim: true
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'packing', 'shipping', 'out_for_delivery', 'delivered', 'cancelled', 'returned'],
      default: 'pending',
      index: true
    }
  },
  {
    // Automatically creates and manages 'createdAt' and 'updatedAt' fields
    timestamps: true,
    versionKey: false
  }
);

export const Order = model<IOrder>('Order', OrderSchema);
export default Order;
