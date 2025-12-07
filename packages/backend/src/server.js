import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cron from 'node-cron';
import initializeDatabase from './database/init.js';
import cacheService from './services/cacheService.js';
import settingsRoutes from './routes/settings.js';
import adoRoutes from './routes/ado.js';
import stageGateRoutes from './routes/stagegate.js';
import roadmapRoutes from './routes/roadmap.js';
import featureVisibilityRoutes from './routes/featureVisibility.js';
import exportRoutes from './routes/export.js';
import innovationRoutes from './routes/innovation.js';

dotenv.config();

// Initialize database on startup
try {
  initializeDatabase();
} catch (error) {
  console.error('❌ Failed to initialize database:', error);
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/settings', settingsRoutes);
app.use('/api/ado', adoRoutes);
app.use('/api/stagegate', stageGateRoutes);
app.use('/api/roadmap', roadmapRoutes);
app.use('/api/feature-visibility', featureVisibilityRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/innovation', innovationRoutes);

// Error handling middleware (must be AFTER routes)
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

app.listen(PORT, () => {
  console.log(`✅ StoryForge backend running on http://localhost:${PORT}`);
  console.log(`   Environment: ${process.env.NODE_ENV}`);
  console.log(`   Database: ${process.env.DB_PATH}`);

  // Refresh work items cache in the background (don't block startup)
  setTimeout(async () => {
    try {
      await cacheService.refreshWorkItemsCache();
    } catch (error) {
      console.log('ℹ️  Cache refresh skipped (settings may not be configured yet)');
    }
  }, 2000); // Wait 2 seconds after startup

  // Schedule hourly cache refresh (runs at the top of every hour)
  cron.schedule('0 * * * *', async () => {
    console.log('🔄 Running scheduled cache refresh...');
    try {
      const result = await cacheService.refreshWorkItemsCache();
      if (result.success) {
        console.log(`✅ Scheduled cache refresh complete: ${result.count} work items cached`);
      }
    } catch (error) {
      console.log('⚠️  Scheduled cache refresh failed:', error.message);
    }
  });

  console.log('⏰ Scheduled hourly cache refresh (runs at :00 of every hour)');
});

 
