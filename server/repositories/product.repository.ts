import { BaseRepository } from './base.repository.js';
import { Product, IProduct } from '../models/product.model.js';

export class ProductRepository extends BaseRepository<IProduct> {
  constructor() {
    super(Product);
  }

  /**
   * Find products within a specific category
   */
  public async findByCategory(categoryId: string): Promise<IProduct[]> {
    return await this.find({ categoryId }, {}, 'categoryId');
  }

  /**
   * Find featured products
   */
  public async findFeatured(): Promise<IProduct[]> {
    return await this.find({ isFeatured: true }, {}, 'categoryId');
  }

  /**
   * Search products by keywords (uses MongoDB text index)
   */
  public async searchProducts(keyword: string): Promise<IProduct[]> {
    return await this.find(
      { $text: { $search: keyword } },
      { score: { $meta: 'textScore' } }
    );
  }

  /**
   * Custom query: Find products of a specific vendor
   */
  public async findByVendor(vendorId: string): Promise<IProduct[]> {
    return await this.find({ vendorId });
  }
}

export const productRepository = new ProductRepository();
export default productRepository;
