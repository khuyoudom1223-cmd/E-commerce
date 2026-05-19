import { BaseRepository } from './base.repository.js';
import { Order, IOrder } from '../models/order.model.js';

export class OrderRepository extends BaseRepository<IOrder> {
  constructor() {
    super(Order);
  }

  /**
   * Find order history for a specific customer, fully populating products
   */
  public async findByCustomer(userId: string): Promise<IOrder[]> {
    return await this.find(
      { userId },
      { sort: { createdAt: -1 } },
      'items.productId'
    );
  }

  /**
   * Find orders placed with a specific vendor
   */
  public async findByVendor(vendorId: string): Promise<IOrder[]> {
    return await this.find(
      { vendorId },
      { sort: { createdAt: -1 } },
      'items.productId'
    );
  }

  /**
   * Custom query: Find orders with a specific status
   */
  public async findByStatus(status: string): Promise<IOrder[]> {
    return await this.find({ status });
  }
}

export const orderRepository = new OrderRepository();
export default orderRepository;
