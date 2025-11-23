import express from 'express';
import * as adoApi from '../utils/adoApi.js';
import { getSettings } from '../services/settingsService.js';
import { getStageForState, getAllStages } from '../utils/stageMapper.js';
import { getDb } from '../database/db.js';

const router = express.Router();

// GET /api/stagegate/features - Get all features grouped by stage
router.get('/features', async (req, res, next) => {
  try {
    console.log('Fetching features for stage gate view...');

    const settings = getSettings();
    const { area_path } = settings;

    // Build WIQL query specifically for Features (bypass available_work_item_types)
    let wiql = `
      SELECT [System.Id], [System.Title], [System.WorkItemType], [System.State],
             [System.AssignedTo], [System.Description], [System.CreatedDate],
             [System.ChangedDate], [System.Parent]
      FROM WorkItems
      WHERE [System.WorkItemType] = 'Feature'
      AND [System.State] NOT IN ('Removed')
    `;

    if (area_path) {
      wiql += ` AND [System.AreaPath] UNDER '${area_path}'`;
    }

    wiql += ' ORDER BY [System.CreatedDate] DESC';

    // Execute query directly
    const features = await adoApi.queryWorkItems(wiql);

    console.log(`Found ${features.length} features`);

    // Get visibility settings from database
    const db = getDb();
    const visibilityStmt = db.prepare(`
      SELECT feature_id, is_visible
      FROM feature_visibility
      WHERE is_visible = 0
    `);
    const hiddenFeatures = visibilityStmt.all();
    const hiddenFeatureIds = new Set(hiddenFeatures.map(f => f.feature_id));

    // Filter out hidden features and map each feature to include stage information
    const featuresWithStages = features
      .filter(feature => !hiddenFeatureIds.has(feature.id))
      .map(feature => {
      const state = feature.fields['System.State'] || 'New';
      const stage = getStageForState(state);

      return {
        id: feature.id,
        title: feature.fields['System.Title'],
        state: state,
        stage: stage,
        assignedTo: feature.fields['System.AssignedTo']?.displayName || 'Unassigned',
        description: feature.fields['System.Description'] || '',
        createdDate: feature.fields['System.CreatedDate'],
        changedDate: feature.fields['System.ChangedDate'],
        parent: feature.fields['System.Parent'],
        workItemType: 'Feature'
      };
    });

    // Initialize groups with empty arrays to ensure all stages are present in response
    const grouped = {};
    const allStages = getAllStages();
    allStages.forEach(stage => {
      grouped[stage] = [];
    });

    // Populate groups
    featuresWithStages.forEach(feature => {
      if (grouped[feature.stage]) {
        grouped[feature.stage].push(feature);
      } else {
        // Fallback for unexpected stages
        if (!grouped['Intake']) grouped['Intake'] = [];
        grouped['Intake'].push(feature);
      }
    });

    const counts = {};
    allStages.forEach(stage => {
      counts[stage] = grouped[stage].length;
    });

    res.json({
      success: true,
      features: featuresWithStages,
      grouped: grouped,
      counts: counts
    });
  } catch (error) {
    console.error('Error fetching features for stage gate:', error);
    next(error);
  }
});

// GET /api/stagegate/feature/:id - Get detailed feature information
router.get('/feature/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    console.log(`Fetching details for feature ${id}...`);

    const settings = getSettings();

    // Fetch the specific work item
    const response = await adoApi.getWorkItemById(id);

    if (!response || !response.fields) {
      return res.status(404).json({
        success: false,
        error: 'Feature not found'
      });
    }

    const state = response.fields['System.State'] || 'New';
    const stage = getStageForState(state);

    // Build ADO URL
    const adoUrl = settings.ado_org_url && settings.ado_project
      ? `${settings.ado_org_url}/${settings.ado_project}/_workitems/edit/${id}/`
      : `https://dev.azure.com/_workitems/edit/${id}/`;

    const featureDetails = {
      id: response.id,
      title: response.fields['System.Title'],
      description: response.fields['System.Description'] || '',
      state: state,
      stage: stage,
      assignedTo: response.fields['System.AssignedTo']?.displayName || 'Unassigned',
      createdDate: response.fields['System.CreatedDate'],
      changedDate: response.fields['System.ChangedDate'],
      createdBy: response.fields['System.CreatedBy']?.displayName || 'Unknown',
      parent: response.fields['System.Parent'],
      workItemType: response.fields['System.WorkItemType'],
      areaPath: response.fields['System.AreaPath'],
      iterationPath: response.fields['System.IterationPath'],
      adoUrl: adoUrl
    };

    res.json({
      success: true,
      feature: featureDetails
    });
  } catch (error) {
    console.error(`Error fetching feature ${req.params.id}:`, error);
    next(error);
  }
});

// POST /api/stagegate/update-priorities - Update priorities for multiple work items
router.post('/update-priorities', async (req, res, next) => {
  try {
    const { updates } = req.body;

    if (!updates || !Array.isArray(updates)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request: updates array required'
      });
    }

    console.log(`Updating priorities for ${updates.length} work items...`);

    // Update each work item's priority in ADO
    const updatePromises = updates.map(async ({ id, priority }) => {
      try {
        await adoApi.updateWorkItem(id, [
          {
            op: 'add',
            path: '/fields/Microsoft.VSTS.Common.Priority',
            value: priority
          }
        ]);
        return { id, success: true };
      } catch (error) {
        console.error(`Failed to update priority for work item ${id}:`, error);
        return { id, success: false, error: error.message };
      }
    });

    const results = await Promise.all(updatePromises);
    const successCount = results.filter(r => r.success).length;

    console.log(`Successfully updated ${successCount}/${updates.length} work items`);

    res.json({
      success: true,
      updated: successCount,
      total: updates.length,
      results
    });
  } catch (error) {
    console.error('Error updating priorities:', error);
    next(error);
  }
});

export default router;
