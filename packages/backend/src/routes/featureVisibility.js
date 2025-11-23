import express from 'express';
import * as adoApi from '../utils/adoApi.js';
import { getSettings } from '../services/settingsService.js';
import { getDb } from '../database/db.js';

const router = express.Router();

/**
 * GET /api/feature-visibility
 * Get all features with their visibility status
 */
router.get('/', async (req, res, next) => {
  try {
    console.log('Fetching all features with visibility status...');

    const settings = getSettings();
    const { area_path } = settings;

    // Build WIQL query to fetch Features
    let wiql = `
      SELECT [System.Id], [System.Title], [System.State]
      FROM WorkItems
      WHERE [System.WorkItemType] = 'Feature'
      AND [System.State] NOT IN ('Removed')
    `;

    if (area_path) {
      wiql += ` AND [System.AreaPath] UNDER '${area_path}'`;
    }

    wiql += ' ORDER BY [System.Title] ASC';

    // Execute query to get all features
    const features = await adoApi.queryWorkItems(wiql);

    // Get visibility settings from database
    const db = getDb();
    const visibilityStmt = db.prepare(`
      SELECT feature_id, is_visible
      FROM feature_visibility
    `);
    const visibilityRecords = visibilityStmt.all();

    // Create a map for quick lookup
    const visibilityMap = {};
    visibilityRecords.forEach(record => {
      visibilityMap[record.feature_id] = record.is_visible === 1;
    });

    // Combine features with visibility status
    const featuresWithVisibility = features.map(feature => ({
      id: feature.id,
      title: feature.fields['System.Title'],
      state: feature.fields['System.State'],
      isVisible: visibilityMap[feature.id] !== undefined ? visibilityMap[feature.id] : true
    }));

    res.json({
      success: true,
      features: featuresWithVisibility
    });
  } catch (error) {
    console.error('Error fetching feature visibility:', error);
    next(error);
  }
});

/**
 * POST /api/feature-visibility/update
 * Update visibility status for a single feature
 */
router.post('/update', async (req, res, next) => {
  try {
    const { featureId, isVisible } = req.body;

    if (!featureId) {
      return res.status(400).json({
        success: false,
        error: 'featureId is required'
      });
    }

    console.log(`Updating visibility for feature ${featureId} to ${isVisible}`);

    const db = getDb();

    // Use INSERT OR REPLACE to handle both new and existing records
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO feature_visibility (feature_id, is_visible, updated_at)
      VALUES (?, ?, CURRENT_TIMESTAMP)
    `);

    stmt.run(featureId, isVisible ? 1 : 0);

    res.json({
      success: true,
      featureId,
      isVisible
    });
  } catch (error) {
    console.error('Error updating feature visibility:', error);
    next(error);
  }
});

/**
 * POST /api/feature-visibility/bulk-update
 * Update visibility status for multiple features
 */
router.post('/bulk-update', async (req, res, next) => {
  try {
    const { updates } = req.body;

    if (!updates || !Array.isArray(updates)) {
      return res.status(400).json({
        success: false,
        error: 'updates array is required'
      });
    }

    console.log(`Bulk updating visibility for ${updates.length} features`);

    const db = getDb();
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO feature_visibility (feature_id, is_visible, updated_at)
      VALUES (?, ?, CURRENT_TIMESTAMP)
    `);

    // Use transaction for bulk updates
    const transaction = db.transaction((updates) => {
      for (const { featureId, isVisible } of updates) {
        stmt.run(featureId, isVisible ? 1 : 0);
      }
    });

    transaction(updates);

    res.json({
      success: true,
      updated: updates.length
    });
  } catch (error) {
    console.error('Error bulk updating feature visibility:', error);
    next(error);
  }
});

export default router;
