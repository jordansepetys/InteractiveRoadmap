import express from 'express';
import * as adoApi from '../utils/adoApi.js';
import cacheService from '../services/cacheService.js';

const router = express.Router();

// GET /api/ado/epics - Get epics/features
router.get('/epics', async (req, res, next) => {
  try {
    const epics = await adoApi.getEpicsAndFeatures();
    res.json({ epics });
  } catch (error) {
    next(error);
  }
});

// GET /api/ado/work-items/recent - Get last 6 months
router.get('/work-items/recent', async (req, res, next) => {
  try {
    const workItems = await adoApi.getRecentWorkItems();
    res.json({ workItems });
  } catch (error) {
    next(error);
  }
});

// POST /api/ado/cache/refresh - Manually refresh work items cache
router.post('/cache/refresh', async (req, res, next) => {
  try {
    const result = await cacheService.refreshWorkItemsCache();

    if (result.success) {
      res.json({
        success: true,
        message: `Successfully cached ${result.count} work items`,
        count: result.count
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error || 'Failed to refresh cache'
      });
    }
  } catch (error) {
    next(error);
  }
});

// GET /api/ado/cache/stats - Get cache statistics
router.get('/cache/stats', async (req, res, next) => {
  try {
    const result = cacheService.getCacheStats();

    if (result.success) {
      res.json(result.stats);
    } else {
      res.status(500).json({
        error: result.error || 'Failed to get cache stats'
      });
    }
  } catch (error) {
    next(error);
  }
});

// POST /api/ado/search - Search for duplicates
router.post('/search', async (req, res, next) => {
  try {
    const { title, description, limit = 5 } = req.body;

    if (!title) {
      return res.status(400).json({
        error: 'Title is required for duplicate search'
      });
    }

    // Search for similar work items in cache
    const result = cacheService.searchSimilar(title, description, limit);

    if (result.success) {
      res.json({
        matches: result.matches,
        count: result.matches.length
      });
    } else {
      res.status(500).json({
        error: result.error || 'Failed to search for duplicates'
      });
    }
  } catch (error) {
    next(error);
  }
});

// GET /api/ado/backlog - Get backlog items with hierarchy
router.get('/backlog', async (req, res, next) => {
  try {
    // Fetch all active work items (epics, features, stories, tasks, bugs)
    const workItems = await adoApi.getAllActiveWorkItems();

    // Build hierarchy tree
    const hierarchy = buildHierarchy(workItems);

    res.json({
      success: true,
      workItems: workItems,
      hierarchy: hierarchy,
      count: workItems.length
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Build hierarchical tree structure from flat work items list
 */
function buildHierarchy(workItems) {
  const itemsMap = new Map();
  const rootItems = [];

  // First pass: Create map of all items
  workItems.forEach(item => {
    itemsMap.set(item.id, {
      ...item,
      children: []
    });
  });

  // Second pass: Build parent-child relationships
  workItems.forEach(item => {
    const parentId = item.fields['System.Parent'];

    if (parentId && itemsMap.has(parentId)) {
      // Has a parent - add to parent's children
      const parent = itemsMap.get(parentId);
      parent.children.push(itemsMap.get(item.id));
    } else {
      // No parent or parent not in list - add to root
      rootItems.push(itemsMap.get(item.id));
    }
  });

  return rootItems;
}

// PATCH /api/ado/work-items/:id/update - Update work item
router.patch('/work-items/:id/update', async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Build JSON Patch operations for ADO API
    const patchOperations = [];

    // Map of frontend fields to ADO field references
    const fieldMap = {
      title: 'System.Title',
      state: 'System.State',
      assignedTo: 'System.AssignedTo',
      priority: 'Microsoft.VSTS.Common.Priority',
      description: 'System.Description',
      acceptanceCriteria: 'Microsoft.VSTS.Common.AcceptanceCriteria',
      storyPoints: 'Microsoft.VSTS.Scheduling.StoryPoints',
      areaPath: 'System.AreaPath',
      iterationPath: 'System.IterationPath',
      tags: 'System.Tags',
      parent: 'System.Parent'
    };

    // Build patch operations for each field in updates
    for (const [key, value] of Object.entries(updates)) {
      const adoField = fieldMap[key];

      if (adoField && value !== undefined && value !== null) {
        patchOperations.push({
          op: 'add',
          path: `/fields/${adoField}`,
          value: value
        });
      }
    }

    if (patchOperations.length === 0) {
      return res.status(400).json({
        error: 'No valid fields to update'
      });
    }

    // Update the work item in ADO
    const updatedItem = await adoApi.updateWorkItem(parseInt(id), patchOperations);

    console.log(`✅ Updated work item #${id} with ${patchOperations.length} fields`);

    res.json({
      success: true,
      workItem: updatedItem,
      fieldsUpdated: patchOperations.length
    });
  } catch (error) {
    console.error(`❌ Failed to update work item #${req.params.id}:`, error.message);
    next(error);
  }
});

// PATCH /api/ado/work-items/:id/move - Move work item (parent or sprint)
router.patch('/work-items/:id/move', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { parent, iterationPath, state } = req.body;

    const patchOperations = [];

    // Move to different parent (epic/feature)
    if (parent !== undefined) {
      if (parent === null || parent === '') {
        // Remove parent
        patchOperations.push({
          op: 'remove',
          path: '/relations/0'
        });
      } else {
        // Set new parent
        patchOperations.push({
          op: 'add',
          path: '/fields/System.Parent',
          value: parseInt(parent)
        });
      }
    }

    // Move to different sprint/iteration
    if (iterationPath) {
      patchOperations.push({
        op: 'add',
        path: '/fields/System.IterationPath',
        value: iterationPath
      });
    }

    // Optionally update state when moving (e.g., New -> Active when moving to sprint)
    if (state) {
      patchOperations.push({
        op: 'add',
        path: '/fields/System.State',
        value: state
      });
    }

    if (patchOperations.length === 0) {
      return res.status(400).json({
        error: 'No move operation specified (parent or iterationPath required)'
      });
    }

    // Update the work item in ADO
    const updatedItem = await adoApi.updateWorkItem(parseInt(id), patchOperations);

    console.log(`✅ Moved work item #${id}`);

    res.json({
      success: true,
      workItem: updatedItem
    });
  } catch (error) {
    console.error(`❌ Failed to move work item #${req.params.id}:`, error.message);
    next(error);
  }
});

// GET /api/ado/wiki/search - Search for wiki page by feature title
router.get('/wiki/search', async (req, res, next) => {
  try {
    const { title } = req.query;

    if (!title) {
      return res.status(400).json({
        error: 'title query parameter is required'
      });
    }

    console.log(`🔍 Searching for wiki page: "${title}"`);

    const wikiPage = await adoApi.findWikiPageByTitle(title);

    if (wikiPage) {
      console.log(`✅ Found wiki page: ${wikiPage.url}`);
      res.json({
        found: true,
        wiki: wikiPage
      });
    } else {
      console.log(`❌ No wiki page found for: "${title}"`);
      res.json({
        found: false
      });
    }
  } catch (error) {
    console.error('Error searching for wiki page:', error);
    next(error);
  }
});

// GET /api/ado/work-items/:id - Get full work item details by ID
router.get('/work-items/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const workItemId = parseInt(id);

    if (isNaN(workItemId)) {
      return res.status(400).json({
        error: 'Invalid work item ID'
      });
    }

    console.log(`📋 Fetching work item #${workItemId}`);

    const workItem = await adoApi.getWorkItemById(workItemId);

    res.json({
      success: true,
      workItem
    });
  } catch (error) {
    console.error(`❌ Error fetching work item #${req.params.id}:`, error.message);
    next(error);
  }
});

// GET /api/ado/feature/:id - Get complete feature details (work item + wiki + children)
router.get('/feature/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const workItemId = parseInt(id);

    if (isNaN(workItemId)) {
      return res.status(400).json({
        error: 'Invalid work item ID'
      });
    }

    console.log(`🎯 Fetching complete feature details for #${workItemId}`);

    // Fetch work item details
    const workItem = await adoApi.getWorkItemById(workItemId);
    const title = workItem.fields['System.Title'];

    // Search for associated wiki page
    let wikiPage = null;
    try {
      wikiPage = await adoApi.findWikiPageByTitle(title);
      if (wikiPage) {
        console.log(`✅ Found wiki page for feature #${workItemId}`);
      }
    } catch (wikiError) {
      console.log(`⚠️  Wiki search failed for feature #${workItemId}:`, wikiError.message);
      // Continue without wiki - it's optional
    }

    // Fetch child work items
    let childItems = [];
    try {
      childItems = await adoApi.getChildWorkItems(workItemId);
      console.log(`📦 Found ${childItems.length} child items for feature #${workItemId}`);
    } catch (childError) {
      console.log(`⚠️  Child items fetch failed for feature #${workItemId}:`, childError.message);
      // Continue without children - it's optional
    }

    res.json({
      success: true,
      workItem,
      wiki: wikiPage || null,
      childItems: childItems || []
    });
  } catch (error) {
    console.error(`❌ Error fetching feature details for #${req.params.id}:`, error.message);
    next(error);
  }
});

export default router;
