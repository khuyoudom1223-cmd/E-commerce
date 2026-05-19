import mongoose from 'mongoose';
import { dbConfig } from '../config/db.config.js';

class DatabaseConnection {
  private retryCount = 0;
  private maxRetries = 5;
  private retryInterval = 5000; // 5 seconds

  /**
   * Initializes and establishes the connection to MongoDB
   */
  public async connect(): Promise<typeof mongoose> {
    const { uri, dbName, options } = dbConfig;
    
    // Mask password in logs for security
    const maskedUri = uri.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@');
    console.log(`[MongoDB] Initializing connection to database: "${dbName}"`);
    console.log(`[MongoDB] Connection Target: ${maskedUri}`);

    // Set Mongoose configurations
    mongoose.set('strictQuery', true);

    // Bind event listeners
    this.setupEventListeners();

    return this.attemptConnection(uri, { dbName, ...options });
  }

  /**
   * Attempts connection with retry logic
   */
  private async attemptConnection(uri: string, options: any): Promise<typeof mongoose> {
    try {
      const conn = await mongoose.connect(uri, options);
      this.retryCount = 0; // Reset retry count on successful connection
      return conn;
    } catch (error: any) {
      this.retryCount++;
      console.error(`[MongoDB] Connection failure (Attempt ${this.retryCount}/${this.maxRetries}):`, error.message);

      if (this.retryCount < this.maxRetries) {
        console.log(`[MongoDB] Retrying connection in ${this.retryInterval / 1000}s...`);
        await new Promise((resolve) => setTimeout(resolve, this.retryInterval));
        return this.attemptConnection(uri, options);
      } else {
        console.error('[MongoDB] Max connection retries reached. Exiting process.');
        process.exit(1);
      }
    }
  }

  /**
   * Listeners for standard Mongoose connection events
   */
  private setupEventListeners(): void {
    mongoose.connection.on('connected', () => {
      console.log(`[MongoDB] Successfully connected to "${mongoose.connection.name}" database.`);
    });

    mongoose.connection.on('error', (err) => {
      console.error('[MongoDB] Mongoose runtime connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('[MongoDB] Mongoose connection disconnected.');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('[MongoDB] Mongoose connection reestablished.');
    });
  }

  /**
   * Gracefully close the MongoDB connection
   */
  public async disconnect(): Promise<void> {
    if (mongoose.connection.readyState !== 0) {
      console.log('[MongoDB] Closing database connection gracefully...');
      try {
        await mongoose.connection.close();
        console.log('[MongoDB] Connection closed.');
      } catch (err) {
        console.error('[MongoDB] Error during database disconnect:', err);
      }
    }
  }
}

export const dbConnection = new DatabaseConnection();
export default dbConnection;
