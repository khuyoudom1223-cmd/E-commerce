import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

/**
 * MongoDB Configuration Interface
 */
export interface IDbConfig {
  uri: string;
  dbName: string;
  options: {
    autoIndex: boolean;
    maxPoolSize: number;
    serverSelectionTimeoutMS: number;
    socketTimeoutMS: number;
    family: number; // 4 for IPv4, 6 for IPv6
  };
}

/**
 * Validates and parses environment variables to build the MongoDB configuration.
 * Supports both standard local MongoDB connections and cloud-based MongoDB Atlas.
 */
export const getDbConfig = (): IDbConfig => {
  const host = process.env.MONGODB_HOST || '127.0.0.1';
  const port = process.env.MONGODB_PORT || '27017';
  const dbName = process.env.MONGODB_DB_NAME || 'sleekcart';
  const user = process.env.MONGODB_USER || '';
  const password = process.env.MONGODB_PASS || '';
  
  // If a full URI is already provided in the environment, prioritize it
  let connectionUri = process.env.MONGODB_URI || '';

  if (!connectionUri) {
    // If no URI is provided, construct one dynamically from the parts
    // Properly encode username and password in case they contain special characters
    const authString = user && password 
      ? `${encodeURIComponent(user)}:${encodeURIComponent(password)}@` 
      : '';
    
    connectionUri = `mongodb://${authString}${host}:${port}/${dbName}`;
  } else {
    // If a full URI is provided, let's check if we need to append the DB name if not present
    // Often MongoDB Atlas URIs end with /?retryWrites=true&w=majority, we can specify dbName in options instead
    console.log('[Database Config] Using MONGODB_URI from environment variables.');
  }

  return {
    uri: connectionUri,
    dbName,
    // Production-ready Mongoose / MongoDB connection pool options
    options: {
      autoIndex: process.env.NODE_ENV !== 'production', // Build indexes in dev, disable in prod for performance
      maxPoolSize: parseInt(process.env.MONGODB_MAX_POOL_SIZE || '10', 10), // Limit connection pool size
      serverSelectionTimeoutMS: 5000, // Timeout after 5s trying to connect
      socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
      family: 4, // Use IPv4
    }
  };
};

export const dbConfig = getDbConfig();
