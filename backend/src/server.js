import { createApp } from './app.js';
import { connectDB } from './config/db.js';
import { env } from './config/env.js';
import { seedDatabase } from './seed/seedData.js';

async function startServer() {
  try {
    await connectDB();
    console.log('Connected to MongoDB successfully.');

    if (env.autoSeedIfEmpty) {
      const seedResult = await seedDatabase({ reset: false });
      if (seedResult.seeded) {
        console.log('Auto-seeded initial demonstration data:', seedResult.counts);
      }
    }

    const app = createApp();
    app.listen(env.port, () => {
      console.log(`CM Kerala Grievance Portal API listening on port ${env.port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
}

startServer();
