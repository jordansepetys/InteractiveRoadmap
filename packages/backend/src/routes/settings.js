import express from 'express';
import { saveSettings, getSanitizedSettings, updateWorkItemTypes } from '../services/settingsService.js';
import { testAdoConnection, getWorkItemTypes, inferProcessTemplate } from '../utils/adoApi.js';

const router = express.Router();

// POST /api/settings - Save configuration
router.post('/', async (req, res, next) => {
  try {
    const {
      ado_org_url,
      ado_project,
      ado_pat,
      area_path,
      iteration_path
    } = req.body;

    // Validation
    if (!ado_org_url || !ado_project || !ado_pat) {
      return res.status(400).json({
        error: 'Missing required fields: ado_org_url, ado_project, ado_pat'
      });
    }

    // Save settings
    const settings = saveSettings({
      ado_org_url,
      ado_project,
      ado_pat,
      area_path,
      iteration_path
    });

    console.log('✅ Settings saved successfully');

    // Return sanitized settings (without secrets)
    res.json({
      success: true,
      message: 'Settings saved successfully',
      settings: getSanitizedSettings()
    });
  } catch (error) {
    console.error('❌ Error saving settings:', error);
    next(error);
  }
});

// GET /api/settings - Get configuration
router.get('/', async (req, res, next) => {
  try {
    const settings = getSanitizedSettings();

    if (!settings) {
      return res.status(404).json({
        configured: false,
        message: 'Settings not configured'
      });
    }

    res.json({
      configured: true,
      settings
    });
  } catch (error) {
    console.error('❌ Error retrieving settings:', error);
    next(error);
  }
});

// POST /api/settings/test-ado - Test ADO connection and fetch work item types
router.post('/test-ado', async (req, res, next) => {
  try {
    console.log('🔌 Testing ADO connection...');
    const result = await testAdoConnection();

    if (result.success) {
      console.log('✅ ADO connection successful');

      // Fetch available work item types
      try {
        console.log('🔍 Fetching work item types...');
        const workItemTypes = await getWorkItemTypes();

        if (workItemTypes && workItemTypes.length > 0) {
          // Infer process template from work item types
          const typeNames = workItemTypes.map(t => t.name);
          const processTemplate = inferProcessTemplate(typeNames);

          // Store in settings
          updateWorkItemTypes(workItemTypes, processTemplate);

          // Add to result
          result.workItemTypes = typeNames;
          result.processTemplate = processTemplate;

          console.log(`✅ Detected ${workItemTypes.length} work item types`);
          console.log(`✅ Process template: ${processTemplate}`);
        }
      } catch (typeError) {
        console.error('⚠️  Failed to fetch work item types:', typeError.message);
        // Don't fail the whole connection test if we can't fetch types
        result.workItemTypesError = 'Could not fetch work item types';
      }
    } else {
      console.log('❌ ADO connection failed:', result.error);
    }

    res.json(result);
  } catch (error) {
    console.error('❌ ADO connection test error:', error);
    res.json({
      success: false,
      error: error.message || 'Failed to test ADO connection'
    });
  }
});

export default router;
