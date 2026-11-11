import mongoose from 'mongoose';
import { env } from './env.js';

export async function connectDB() {
  if (!env.mongodbUri) {
    throw new Error(
      'MONGODB_URI is not configured. Add your MongoDB Atlas connection string to backend/.env.'
    );
  }

  mongoose.set('strictQuery', true);
  await mongoose.connect(env.mongodbUri, {
    serverSelectionTimeoutMS: 10000
  });
  return mongoose.connection;
}
