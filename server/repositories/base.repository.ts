import { Model, Document, FilterQuery, UpdateQuery, QueryOptions } from 'mongoose';

/**
 * Standard repository contract representing CRUD operations.
 */
export interface IBaseRepository<T extends Document> {
  create(item: Partial<T>): Promise<T>;
  findById(id: string, populate?: string | string[]): Promise<T | null>;
  findOne(filter: FilterQuery<T>, populate?: string | string[]): Promise<T | null>;
  find(filter: FilterQuery<T>, options?: QueryOptions, populate?: string | string[]): Promise<T[]>;
  update(id: string, updateQuery: UpdateQuery<T>): Promise<T | null>;
  delete(id: string): Promise<boolean>;
}

/**
 * Generic Base Mongoose Repository implementing fundamental CRUD operations.
 */
export class BaseRepository<T extends Document> implements IBaseRepository<T> {
  protected model: Model<T>;

  constructor(model: Model<T>) {
    this.model = model;
  }

  /**
   * Create a new document in the collection
   */
  public async create(item: Partial<T>): Promise<T> {
    const createdItem = new this.model(item);
    return await createdItem.save();
  }

  /**
   * Find a document by its Object ID
   */
  public async findById(id: string, populate?: string | string[]): Promise<T | null> {
    const query = this.model.findById(id);
    if (populate) {
      query.populate(populate as any);
    }
    return await query.exec();
  }

  /**
   * Find a single document matching a query filter
   */
  public async findOne(filter: FilterQuery<T>, populate?: string | string[]): Promise<T | null> {
    const query = this.model.findOne(filter);
    if (populate) {
      query.populate(populate as any);
    }
    return await query.exec();
  }

  /**
   * Find multiple documents matching a query filter with sorting/paging options
   */
  public async find(
    filter: FilterQuery<T>,
    options: QueryOptions = {},
    populate?: string | string[]
  ): Promise<T[]> {
    const query = this.model.find(filter, null, options);
    if (populate) {
      query.populate(populate as any);
    }
    return await query.exec();
  }

  /**
   * Find a document by its ID and update its fields
   */
  public async update(id: string, updateQuery: UpdateQuery<T>): Promise<T | null> {
    return await this.model
      .findByIdAndUpdate(id, updateQuery, { new: true, runValidators: true })
      .exec();
  }

  /**
   * Delete a document by its ID
   */
  public async delete(id: string): Promise<boolean> {
    const result = await this.model.findByIdAndDelete(id).exec();
    return !!result;
  }
}

export default BaseRepository;
