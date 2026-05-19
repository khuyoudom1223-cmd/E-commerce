import { Request, Response } from 'express';
import { productRepository } from '../repositories/product.repository.js';
import mongoose from 'mongoose';

export class ProductController {
  /**
   * CREATE a new product
   * POST /api/v2/products
   */
  public async createProduct(req: Request, res: Response) {
    try {
      const { name, price, categoryId, vendorId } = req.body;

      // Basic field validation
      if (!name || !price || !categoryId || !vendorId) {
        return res.status(400).json({
          success: false,
          message: 'Missing required parameters: name, price, categoryId, vendorId'
        });
      }

      // Validate Mongoose ObjectId format
      if (!mongoose.Types.ObjectId.isValid(categoryId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid categoryId parameter format'
        });
      }

      const product = await productRepository.create(req.body);
      
      return res.status(201).json({
        success: true,
        message: 'Product created successfully',
        data: product
      });
    } catch (error: any) {
      console.error('[ProductController] Error in createProduct:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error while creating product',
        error: error.message
      });
    }
  }

  /**
   * READ all products (supports filtering, search, featured)
   * GET /api/v2/products
   */
  public async getProducts(req: Request, res: Response) {
    try {
      const { categoryId, search, featured, vendorId } = req.query;
      const filter: any = {};

      if (categoryId && mongoose.Types.ObjectId.isValid(categoryId as string)) {
        filter.categoryId = categoryId;
      }
      
      if (vendorId) {
        filter.vendorId = vendorId;
      }

      if (featured === 'true') {
        filter.isFeatured = true;
      }

      let products;
      if (search) {
        // Keyword text index search
        products = await productRepository.searchProducts(search as string);
      } else {
        // Filter search populated with category properties
        products = await productRepository.find(filter, {}, 'categoryId');
      }

      return res.status(200).json({
        success: true,
        count: products.length,
        data: products
      });
    } catch (error: any) {
      console.error('[ProductController] Error in getProducts:', error);
      return res.status(500).json({
        success: false,
        message: 'Error fetching products list',
        error: error.message
      });
    }
  }

  /**
   * READ a single product by ID
   * GET /api/v2/products/:id
   */
  public async getProductById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid product ID format'
        });
      }

      const product = await productRepository.findById(id, 'categoryId');

      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }

      return res.status(200).json({
        success: true,
        data: product
      });
    } catch (error: any) {
      console.error('[ProductController] Error in getProductById:', error);
      return res.status(500).json({
        success: false,
        message: 'Error fetching product details',
        error: error.message
      });
    }
  }

  /**
   * UPDATE an existing product
   * PUT /api/v2/products/:id
   */
  public async updateProduct(req: Request, res: Response) {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid product ID format'
        });
      }

      const product = await productRepository.update(id, req.body);

      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found or update parameters invalid'
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Product updated successfully',
        data: product
      });
    } catch (error: any) {
      console.error('[ProductController] Error in updateProduct:', error);
      return res.status(500).json({
        success: false,
        message: 'Error updating product parameters',
        error: error.message
      });
    }
  }

  /**
   * DELETE a product by ID
   * DELETE /api/v2/products/:id
   */
  public async deleteProduct(req: Request, res: Response) {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid product ID format'
        });
      }

      const success = await productRepository.delete(id);

      if (!success) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Product successfully deleted'
      });
    } catch (error: any) {
      console.error('[ProductController] Error in deleteProduct:', error);
      return res.status(500).json({
        success: false,
        message: 'Error deleting product listing',
        error: error.message
      });
    }
  }
}

export const productController = new ProductController();
export default productController;
