import { BaseRepository } from './base.repository.js';
import { User, IUser } from '../models/user.model.js';

export class UserRepository extends BaseRepository<IUser> {
  constructor() {
    super(User);
  }

  /**
   * Custom query: Find a user by email, optionally including passwordHash for logins
   */
  public async findByEmail(email: string, includePassword = false): Promise<IUser | null> {
    const query = this.model.findOne({ email: email.toLowerCase().trim() });
    if (includePassword) {
      query.select('+passwordHash');
    }
    return await query.exec();
  }

  /**
   * Custom query: Find users by their system roles
   */
  public async findByRole(role: 'admin' | 'vendor' | 'rider' | 'customer'): Promise<IUser[]> {
    return await this.find({ role });
  }
}

export const userRepository = new UserRepository();
export default userRepository;
