import { Request, Response } from 'express';
import { orderRepository } from '../repositories/order.repository.js';
import mongoose from 'mongoose';

export class OrderController {
  /**
   * CREATE Order
   * POST /api/v2/orders
   */
  public async createOrder(req: Request, res: Response) {
    try {
      const { userId, vendorId, items, totalAmount } = req.body;

      if (!userId || !vendorId || !items || !Array.isArray(items) || items.length === 0 || totalAmount === undefined) {
        return res.status(400).json({
          success: false,
          message: 'Missing parameters: userId, vendorId, items (non-empty array), and totalAmount are required'
        });
      }

      // Check item IDs format
      for (const item of items) {
        if (!mongoose.Types.ObjectId.isValid(item.productId)) {
          return res.status(400).json({
            success: false,
            message: `Invalid product ID format: ${item.productId}`
          });
        }
      }

      const order = await orderRepository.create(req.body);
      return res.status(201).json({
        success: true,
        message: 'Order placed successfully',
        data: order
      });
    } catch (error: any) {
      console.error('[OrderController] Error in createOrder:', error);
      return res.status(500).json({ success: false, message: 'Server error placing order', error: error.message });
    }
  }

  /**
   * READ Orders
   * GET /api/v2/orders
   */
  public async getOrders(req: Request, res: Response) {
    try {
      const { userId, vendorId, status } = req.query;
      let orders;

      if (userId) {
        orders = await orderRepository.findByCustomer(userId as string);
      } else if (vendorId) {
        orders = await orderRepository.findByVendor(vendorId as string);
      } else if (status) {
        orders = await orderRepository.findByStatus(status as string);
      } else {
        orders = await orderRepository.find({}, {}, 'items.productId');
      }

      return res.status(200).json({ success: true, count: orders.length, data: orders });
    } catch (error: any) {
      console.error('[OrderController] Error in getOrders:', error);
      return res.status(500).json({ success: false, message: 'Error retrieving orders list', error: error.message });
    }
  }

  /**
   * READ Order by ID
   * GET /api/v2/orders/:id
   */
  public async getOrderById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ success: false, message: 'Invalid order ID format' });
      }

      const order = await orderRepository.findById(id, 'items.productId');
      if (!order) {
        return res.status(404).json({ success: false, message: 'Order not found' });
      }

      return res.status(200).json({ success: true, data: order });
    } catch (error: any) {
      console.error('[OrderController] Error in getOrderById:', error);
      return res.status(500).json({ success: false, message: 'Error fetching order details', error: error.message });
    }
  }

  /**
   * UPDATE Order Status or Details
   * PUT /api/v2/orders/:id
   */
  public async updateOrder(req: Request, res: Response) {
    try {
      const { id } = req.params;
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ success: false, message: 'Invalid order ID format' });
      }

      const updated = await orderRepository.update(id, req.body);
      if (!updated) {
        return res.status(404).json({ success: false, message: 'Order not found' });
      }

      return res.status(200).json({ success: true, message: 'Order status updated successfully', data: updated });
    } catch (error: any) {
      console.error('[OrderController] Error in updateOrder:', error);
      return res.status(500).json({ success: false, message: 'Error updating order parameters', error: error.message });
    }
  }

  /**
   * DELETE Order
   * DELETE /api/v2/orders/:id
   */
  public async deleteOrder(req: Request, res: Response) {
    try {
      const { id } = req.params;
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ success: false, message: 'Invalid order ID format' });
      }

      const success = await orderRepository.delete(id);
      if (!success) {
        return res.status(404).json({ success: false, message: 'Order not found' });
      }

      return res.status(200).json({ success: true, message: 'Order cancelled/deleted successfully' });
    } catch (error: any) {
      console.error('[OrderController] Error in deleteOrder:', error);
      return res.status(500).json({ success: false, message: 'Error deleting order record', error: error.message });
    }
  }
}

export const orderController = new OrderController();
export default orderController;
