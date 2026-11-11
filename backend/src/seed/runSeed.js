import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import { seedDatabase } from './seedData.js';

const reset = process.argv.includes('--reset');

async function run() {
  try {
    await connectDB();
    const result = await seedDatabase({ reset });
    console.log('Seed result:', JSON.stringify(result, null, 2));
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Seed failed:', error.message);
    process.exit(1);
  }
}

run();
