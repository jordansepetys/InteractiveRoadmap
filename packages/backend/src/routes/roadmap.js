import express from 'express';
import adoApi from '../utils/adoApi.js';
import settingsService from '../services/settingsService.js';
import { getDb } from '../database/db.js';

const router = express.Router();

/**
 * GET /api/roadmap/features
 * Fetch all Features with their start and target dates for roadmap visualization
 */
router.get('/features', async (req, res) => {
  try {
    const settings = settingsService.getSettings();

    if (!settings || !settings.ado_org_url || !settings.ado_project || !settings.ado_pat) {
      return res.status(400).json({
        error: 'Azure DevOps settings not configured. Please configure in Settings.'
      });
    }

    const { ado_project } = settings;
    const client = adoApi.getAdoClient();

    // Build WIQL query to fetch Features
    // We remove ORDER BY Date to avoid 500 errors if the field is missing on the work item type
    const wiql = `
      SELECT [System.Id]
      FROM WorkItems
      WHERE [System.WorkItemType] = 'Feature'
      AND [System.State] NOT IN ('Closed', 'Removed')
    `;

    // Execute WIQL query
    const queryResponse = await client.post(
      `/${ado_project}/_apis/wit/wiql?api-version=7.1`,
      { query: wiql }
    );

    const workItemRefs = queryResponse.data.workItems;

    if (!workItemRefs || workItemRefs.length === 0) {
      return res.json({
        scheduled: [],
        orphanedScheduled: [],
        unscheduled: [],
        total: 0
      });
    }

    // Fetch full work item details with all necessary fields including custom date fields
    const ids = workItemRefs.map(ref => ref.id).slice(0, 200);
    const fields = [
      'System.Id',
      'System.Title',
      'System.State',
      'System.Description',
      'System.AssignedTo',
      'System.CreatedDate',
      'System.ChangedDate',
      'System.Parent',
      'Microsoft.VSTS.Scheduling.StartDate',
      'Microsoft.VSTS.Scheduling.TargetDate'
    ].join(',');

    const workItemsResponse = await client.get(
      `/${ado_project}/_apis/wit/workitems?ids=${ids.join(',')}&fields=${fields}&api-version=7.1`
    );

    // Get visibility settings from database
    const db = getDb();
    const visibilityStmt = db.prepare(`
      SELECT feature_id, is_visible
      FROM feature_visibility
      WHERE is_visible = 0
    `);
    const hiddenFeatures = visibilityStmt.all();
    const hiddenFeatureIds = new Set(hiddenFeatures.map(f => f.feature_id));

    // Transform to roadmap format and filter hidden features
    const roadmapFeatures = workItemsResponse.data.value
      .filter(item => !hiddenFeatureIds.has(item.id))
      .map(item => {
        const fields = item.fields;
        return {
          id: item.id,
          title: fields['System.Title'] || 'Untitled',
          state: fields['System.State'] || 'Unknown',
          description: fields['System.Description'] || '',
          assignedTo: fields['System.AssignedTo']?.displayName || 'Unassigned',
          startDate: fields['Microsoft.VSTS.Scheduling.StartDate'] || null,
          targetDate: fields['Microsoft.VSTS.Scheduling.TargetDate'] || null,
          createdDate: fields['System.CreatedDate'] || null,
          changedDate: fields['System.ChangedDate'] || null,
          parentId: fields['System.Parent'] || null
        };
      });

    // Sort features by StartDate (in memory)
    roadmapFeatures.sort((a, b) => {
      if (!a.startDate) return 1;
      if (!b.startDate) return -1;
      return new Date(a.startDate) - new Date(b.startDate);
    });

    // Get unique parent Epic IDs
    const epicIds = [...new Set(roadmapFeatures.map(f => f.parentId).filter(id => id !== null))];

    // Fetch Epic details if any
    let epics = [];
    if (epicIds.length > 0) {
      const epicFields = [
        'System.Id',
        'System.Title',
        'System.State',
        'Microsoft.VSTS.Scheduling.StartDate',
        'Microsoft.VSTS.Scheduling.TargetDate'
      ].join(',');

      const epicsResponse = await client.get(
        `/${ado_project}/_apis/wit/workitems?ids=${epicIds.join(',')}&fields=${epicFields}&api-version=7.1`
      );

      epics = epicsResponse.data.value.map(item => {
        const fields = item.fields;
        return {
          id: item.id,
          title: fields['System.Title'] || 'Untitled Epic',
          state: fields['System.State'] || 'Unknown',
          startDate: fields['Microsoft.VSTS.Scheduling.StartDate'] || null,
          targetDate: fields['Microsoft.VSTS.Scheduling.TargetDate'] || null
        };
      });
    }

    // Group features by epic
    const epicGroups = {};
    const orphanedFeatures = [];

    epics.forEach(epic => {
      epicGroups[epic.id] = {
        epic,
        features: []
      };
    });

    roadmapFeatures.forEach(feature => {
      if (feature.parentId && epicGroups[feature.parentId]) {
        epicGroups[feature.parentId].features.push(feature);
      } else {
        orphanedFeatures.push(feature);
      }
    });

    // Separate into scheduled and unscheduled
    const scheduled = Object.values(epicGroups).filter(group =>
      group.features.some(f => f.startDate && f.targetDate)
    );
    const unscheduled = orphanedFeatures.filter(f => !f.startDate || !f.targetDate);
    const orphanedScheduled = orphanedFeatures.filter(f => f.startDate && f.targetDate);

    res.json({
      scheduled,
      orphanedScheduled,
      unscheduled,
      total: roadmapFeatures.length
    });

  } catch (error) {
    console.error('Error fetching roadmap features:', error);
    // Return detailed error for debugging
    res.status(500).json({
      error: 'Failed to fetch roadmap features',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

export default router;
