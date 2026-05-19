import { BaseRepository } from './base.repository.js';
import { Category, ICategory } from '../models/category.model.js';

export class CategoryRepository extends BaseRepository<ICategory> {
  constructor() {
    super(Category);
  }

  /**
   * Custom query: Find a category by its slug
   */
  public async findBySlug(slug: string): Promise<ICategory | null> {
    return await this.findOne({ slug: slug.toLowerCase().trim() });
  }
}

export const categoryRepository = new CategoryRepository();
export default categoryRepository;
