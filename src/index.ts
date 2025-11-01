import app from './app';
import { initDB } from './db';
import cron from 'node-cron';
import { fetchAllQuotes } from './scrapers';

const PORT = process.env.PORT || 3000;

async function start() {
  try {
    // Initialize database
    await initDB();

    // Start server
    const server = app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });

    // Fetch quotes every 30 seconds to ensure fresh data
    cron.schedule('*/30 * * * * *', async () => {
      console.log('Scheduled fetch: Refreshing quotes...');
      await fetchAllQuotes();
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('SIGTERM signal received: closing HTTP server');
      server.close(() => {
        console.log('HTTP server closed');
        process.exit(0);
      });
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();
