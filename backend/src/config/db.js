import mongoose from 'mongoose';
import env from './env.js';

export async function connectDatabase() {
  if (!env.mongoUri || env.mongoUri.includes('localhost') === false && !env.mongoUri.startsWith('mongodb')) {
    console.warn('MongoDB URI not configured. Running without database persistence.');
    return false;
  }

  try {
    await mongoose.connect(env.mongoUri, { serverSelectionTimeoutMS: 2500 });
    console.log('MongoDB connected');
    return true;
  } catch (error) {
    console.warn('MongoDB connection failed:', error.message);
    return false;
  }
}
