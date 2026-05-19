import { Request, Response } from 'express';
import { categoryRepository } from '../repositories/category.repository.js';
import mongoose from 'mongoose';

export class CategoryController {
  /**
   * CREATE Category
   * POST /api/v2/categories
   */
  public async createCategory(req: Request, res: Response) {
    try {
      const { name } = req.body;
      if (!name) {
        return res.status(400).json({ success: false, message: 'Category name is required' });
      }

      // Check if category name already exists
      const existing = await categoryRepository.findOne({ name: name.trim() });
      if (existing) {
        return res.status(400).json({ success: false, message: 'Category name already exists' });
      }

      const category = await categoryRepository.create(req.body);
      return res.status(201).json({
        success: true,
        message: 'Category created successfully',
        data: category
      });
    } catch (error: any) {
      console.error('[CategoryController] Error in createCategory:', error);
      return res.status(500).json({ success: false, message: 'Server error creating category', error: error.message });
    }
  }

  /**
   * READ Categories
   * GET /api/v2/categories
   */
  public async getCategories(req: Request, res: Response) {
    try {
      const categories = await categoryRepository.find({});
      return res.status(200).json({ success: true, count: categories.length, data: categories });
    } catch (error: any) {
      console.error('[CategoryController] Error in getCategories:', error);
      return res.status(500).json({ success: false, message: 'Error retrieving categories', error: error.message });
    }
  }

  /**
   * READ Category by ID or Slug
   * GET /api/v2/categories/:idOrSlug
   */
  public async getCategoryByIdOrSlug(req: Request, res: Response) {
    try {
      const { idOrSlug } = req.params;
      let category = null;

      if (mongoose.Types.ObjectId.isValid(idOrSlug)) {
        category = await categoryRepository.findById(idOrSlug);
      } else {
        category = await categoryRepository.findBySlug(idOrSlug);
      }

      if (!category) {
        return res.status(404).json({ success: false, message: 'Category not found' });
      }

      return res.status(200).json({ success: true, data: category });
    } catch (error: any) {
      console.error('[CategoryController] Error in getCategoryByIdOrSlug:', error);
      return res.status(500).json({ success: false, message: 'Error fetching category details', error: error.message });
    }
  }

  /**
   * UPDATE Category
   * PUT /api/v2/categories/:id
   */
  public async updateCategory(req: Request, res: Response) {
    try {
      const { id } = req.params;
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ success: false, message: 'Invalid category ID format' });
      }

      const updated = await categoryRepository.update(id, req.body);
      if (!updated) {
        return res.status(404).json({ success: false, message: 'Category not found' });
      }

      return res.status(200).json({ success: true, message: 'Category updated successfully', data: updated });
    } catch (error: any) {
      console.error('[CategoryController] Error in updateCategory:', error);
      return res.status(500).json({ success: false, message: 'Error updating category', error: error.message });
    }
  }

  /**
   * DELETE Category
   * DELETE /api/v2/categories/:id
   */
  public async deleteCategory(req: Request, res: Response) {
    try {
      const { id } = req.params;
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ success: false, message: 'Invalid category ID format' });
      }

      const success = await categoryRepository.delete(id);
      if (!success) {
        return res.status(404).json({ success: false, message: 'Category not found' });
      }

      return res.status(200).json({ success: true, message: 'Category deleted successfully' });
    } catch (error: any) {
      console.error('[CategoryController] Error in deleteCategory:', error);
      return res.status(500).json({ success: false, message: 'Error deleting category', error: error.message });
    }
  }
}

export const categoryController = new CategoryController();
export default categoryController;
