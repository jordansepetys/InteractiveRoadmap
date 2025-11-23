import axios from 'axios';
import { getSettings, getAvailableWorkItemTypes } from '../services/settingsService.js';

/**
 * Get authenticated Axios instance for Azure DevOps API
 * @returns {Object} Axios instance configured for ADO
 */
export function getAdoClient() {
  const settings = getSettings();

  if (!settings) {
    throw new Error('Settings not configured. Please configure ADO settings first.');
  }

  const { ado_org_url, ado_pat } = settings;

  // Create base64 encoded PAT for Basic Auth
  // ADO uses format: ":{PAT}" (colon + PAT, no username)
  const auth = Buffer.from(`:${ado_pat}`).toString('base64');

  return axios.create({
    baseURL: `${ado_org_url}`,
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    timeout: 30000 // 30 second timeout
  });
}

/**
 * Get available work item types for the project
 * @returns {Promise<Array>} Array of work item type objects
 */
export async function getWorkItemTypes() {
  const settings = getSettings();
  const { ado_project } = settings;
  const client = getAdoClient();

  const response = await client.get(
    `/${ado_project}/_apis/wit/workitemtypes?api-version=7.1`
  );

  return response.data.value;
}

/**
 * Infer process template from work item types
 * @param {Array} workItemTypes - Array of work item type names
 * @returns {string} Process template name (Basic/Agile/Scrum/CMMI/Custom)
 */
export function inferProcessTemplate(workItemTypes) {
  const typeSet = new Set(workItemTypes.map(t => t.toLowerCase()));

  // Basic: Epic, Issue, Task
  if (typeSet.has('issue') && !typeSet.has('user story') && !typeSet.has('product backlog item')) {
    return 'Basic';
  }

  // Scrum: Epic, Feature, Product Backlog Item, Task, Bug, Impediment, Test Case
  if (typeSet.has('product backlog item') || typeSet.has('impediment')) {
    return 'Scrum';
  }

  // Agile: Epic, Feature, User Story, Task, Bug, Issue (optional), Test Case
  if (typeSet.has('user story')) {
    return 'Agile';
  }

  // CMMI: Epic, Feature, Requirement, Task, Bug, Issue, Risk, Review, Change Request
  if (typeSet.has('requirement') || typeSet.has('risk') || typeSet.has('review') || typeSet.has('change request')) {
    return 'CMMI';
  }

  // Default to Custom if we can't determine
  return 'Custom';
}

/**
 * Test ADO connection by fetching project info
 * @returns {Promise<Object>} Connection test result
 */
export async function testAdoConnection() {
  try {
    const settings = getSettings();
    if (!settings) {
      return {
        success: false,
        error: 'Settings not configured'
      };
    }

    const { ado_project } = settings;
    const client = getAdoClient();

    // Test connection by fetching project info
    const response = await client.get(`/_apis/projects/${ado_project}?api-version=7.1`);

    return {
      success: true,
      message: 'Successfully connected to Azure DevOps',
      project: {
        name: response.data.name,
        id: response.data.id,
        state: response.data.state,
        url: response.data.url
      }
    };
  } catch (error) {
    console.error('ADO Connection Test Error:', error.message);

    if (error.response) {
      // ADO returned an error response
      return {
        success: false,
        error: error.response.data?.message || error.response.statusText,
        status: error.response.status
      };
    } else if (error.request) {
      // Request was made but no response received
      return {
        success: false,
        error: 'No response from Azure DevOps. Check your organization URL.'
      };
    } else {
      // Something else happened
      return {
        success: false,
        error: error.message
      };
    }
  }
}

/**
 * Fetch work items using WIQL query
 * @param {string} wiql - Work Item Query Language query
 * @returns {Promise<Array>} Array of work items
 */
export async function queryWorkItems(wiql) {
  const settings = getSettings();
  const { ado_project } = settings;
  const client = getAdoClient();

  // Execute WIQL query
  const queryResponse = await client.post(
    `/${ado_project}/_apis/wit/wiql?api-version=7.1`,
    { query: wiql }
  );

  const workItemRefs = queryResponse.data.workItems;

  if (!workItemRefs || workItemRefs.length === 0) {
    return [];
  }

  // Fetch full work item details (max 200 at a time)
  const ids = workItemRefs.map(ref => ref.id).slice(0, 200);

  // Explicitly request all fields including System.Parent for hierarchy
  const fields = [
    'System.Id',
    'System.Title',
    'System.WorkItemType',
    'System.State',
    'System.Parent',
    'System.AssignedTo',
    'System.CreatedDate',
    'System.IterationPath',
    'System.AreaPath',
    'System.Description'
  ].join(',');

  const workItemsResponse = await client.get(
    `/${ado_project}/_apis/wit/workitems?ids=${ids.join(',')}&fields=${fields}&api-version=7.1`
  );

  return workItemsResponse.data.value;
}

/**
 * Get recent work items (last 6 months)
 * @returns {Promise<Array>} Array of work items
 */
export async function getRecentWorkItems() {
  const settings = getSettings();
  const { area_path } = settings;

  // Get available work item types from settings
  const availableTypes = getAvailableWorkItemTypes();
  const typesList = availableTypes.map(t => `'${t}'`).join(', ');

  // Build WIQL query for last 6 months
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  const dateStr = sixMonthsAgo.toISOString().split('T')[0]; // YYYY-MM-DD

  let wiql = `
    SELECT [System.Id], [System.Title], [System.WorkItemType], [System.State], [System.CreatedDate]
    FROM WorkItems
    WHERE [System.CreatedDate] >= '${dateStr}'
    AND [System.State] NOT IN ('Closed', 'Removed', 'Done')
    AND [System.WorkItemType] IN (${typesList})
  `;

  // Add area path filter if configured
  if (area_path) {
    wiql += ` AND [System.AreaPath] UNDER '${area_path}'`;
  }

  wiql += ' ORDER BY [System.CreatedDate] DESC';

  return queryWorkItems(wiql);
}

/**
 * Get epics and features for parent selection
 * @returns {Promise<Array>} Array of epics and features
 */
export async function getEpicsAndFeatures() {
  const settings = getSettings();
  const { area_path } = settings;

  // Get available work item types and filter for parent types (Epic, Feature)
  const availableTypes = getAvailableWorkItemTypes();
  const parentTypes = availableTypes.filter(t =>
    ['Epic', 'Feature'].includes(t)
  );
  const typesList = parentTypes.map(t => `'${t}'`).join(', ');

  // If no parent types available, return empty array
  if (parentTypes.length === 0) {
    return [];
  }

  let wiql = `
    SELECT [System.Id], [System.Title], [System.WorkItemType], [System.State]
    FROM WorkItems
    WHERE [System.WorkItemType] IN (${typesList})
    AND [System.State] NOT IN ('Closed', 'Removed')
  `;

  if (area_path) {
    wiql += ` AND [System.AreaPath] UNDER '${area_path}'`;
  }

  wiql += ' ORDER BY [System.CreatedDate] DESC';

  return queryWorkItems(wiql);
}

/**
 * Create a new work item
 * @param {string} workItemType - Type of work item (Bug, User Story, Task, etc.)
 * @param {Array} patchOperations - Array of JSON Patch operations
 * @returns {Promise<Object>} Created work item
 */
export async function createWorkItem(workItemType, patchOperations) {
  const settings = getSettings();
  const { ado_project } = settings;
  const client = getAdoClient();

  // URL encode the work item type to handle spaces (e.g., "User Story" -> "User%20Story")
  const encodedWorkItemType = encodeURIComponent(workItemType);

  try {
    const response = await client.post(
      `/${ado_project}/_apis/wit/workitems/$${encodedWorkItemType}?api-version=7.0`,
      patchOperations,
      {
        headers: {
          'Content-Type': 'application/json-patch+json'
        }
      }
    );

    return response.data;
  } catch (error) {
    console.error('ADO API Error Details:', {
      url: `/${ado_project}/_apis/wit/workitems/$${encodedWorkItemType}?api-version=7.0`,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message
    });
    throw error;
  }
}

/**
 * Update an existing work item
 * @param {number} workItemId - ID of work item to update
 * @param {Array} patchOperations - Array of JSON Patch operations
 * @returns {Promise<Object>} Updated work item
 */
export async function updateWorkItem(workItemId, patchOperations) {
  const settings = getSettings();
  const { ado_project } = settings;
  const client = getAdoClient();

  try {
    console.log(`🔄 Updating work item #${workItemId} with operations:`, JSON.stringify(patchOperations, null, 2));

    const response = await client.patch(
      `/${ado_project}/_apis/wit/workitems/${workItemId}?api-version=7.1`,
      patchOperations,
      {
        headers: {
          'Content-Type': 'application/json-patch+json'
        }
      }
    );

    console.log(`✅ Successfully updated work item #${workItemId}`);
    return response.data;
  } catch (error) {
    console.error(`❌ Failed to update work item #${workItemId}:`, error.response?.data || error.message);
    throw error;
  }
}

/**
 * Get all active work items for backlog view
 * @returns {Promise<Array>} Array of work items with hierarchy
 */
export async function getAllActiveWorkItems() {
  const settings = getSettings();
  const { area_path } = settings;

  // Get available work item types from settings
  const availableTypes = getAvailableWorkItemTypes();
  const typesList = availableTypes.map(t => `'${t}'`).join(', ');

  let wiql = `
    SELECT [System.Id], [System.Title], [System.WorkItemType], [System.State],
           [System.Parent], [System.AssignedTo], [System.CreatedDate],
           [System.IterationPath], [System.AreaPath]
    FROM WorkItems
    WHERE [System.State] NOT IN ('Closed', 'Removed')
    AND [System.WorkItemType] IN (${typesList})
  `;

  if (area_path) {
    wiql += ` AND [System.AreaPath] UNDER '${area_path}'`;
  }

  wiql += ' ORDER BY [System.WorkItemType] DESC, [System.CreatedDate] DESC';

  return queryWorkItems(wiql);
}

/**
 * Get a single work item by ID
 * @param {number} workItemId - ID of the work item to fetch
 * @returns {Promise<Object>} Work item details
 */
export async function getWorkItemById(workItemId) {
  const settings = getSettings();
  const { ado_project } = settings;
  const client = getAdoClient();

  // Use broader field set that works across all work item types
  // Don't request AcceptanceCriteria as it may not exist for all types (e.g., Features/Epics)
  const fields = [
    'System.Id',
    'System.Title',
    'System.WorkItemType',
    'System.State',
    'System.Parent',
    'System.AssignedTo',
    'System.CreatedDate',
    'System.CreatedBy',
    'System.ChangedDate',
    'System.ChangedBy',
    'System.IterationPath',
    'System.AreaPath',
    'System.Description',
    'System.Tags',
    'Microsoft.VSTS.Common.Priority',
    'Microsoft.VSTS.Scheduling.StartDate',
    'Microsoft.VSTS.Scheduling.TargetDate'
  ].join(',');

  const response = await client.get(
    `/${ado_project}/_apis/wit/workitems/${workItemId}?fields=${fields}&api-version=7.1`
  );

  return response.data;
}

/**
 * Get child work items for a parent work item
 * @param {number} parentId - ID of the parent work item
 * @returns {Promise<Array>} Array of child work items
 */
export async function getChildWorkItems(parentId) {
  const settings = getSettings();
  const { ado_project } = settings;

  // Get available work item types from settings
  const availableTypes = getAvailableWorkItemTypes();
  const typesList = availableTypes.map(t => `'${t}'`).join(', ');

  let wiql = `
    SELECT [System.Id], [System.Title], [System.WorkItemType], [System.State],
           [System.AssignedTo], [Microsoft.VSTS.Common.Priority]
    FROM WorkItemLinks
    WHERE [Source].[System.Id] = ${parentId}
    AND [System.Links.LinkType] = 'System.LinkTypes.Hierarchy-Forward'
    AND [Target].[System.WorkItemType] IN (${typesList})
    MODE (MustContain)
  `;

  return queryWorkItems(wiql);
}

/**
 * Get all wikis in the project
 * @returns {Promise<Array>} Array of wiki objects
 */
export async function getWikis() {
  const settings = getSettings();
  const { ado_project } = settings;
  const client = getAdoClient();

  const response = await client.get(
    `/${ado_project}/_apis/wiki/wikis?api-version=7.1`
  );

  return response.data.value;
}

/**
 * Search for a wiki page by title
 * @param {string} pageTitle - Title of the page to search for
 * @returns {Promise<Object|null>} Wiki page info with URL, or null if not found
 */
export async function findWikiPageByTitle(pageTitle) {
  const settings = getSettings();
  const { ado_org_url, ado_project } = settings;

  try {
    // Get all wikis in the project
    const wikis = await getWikis();

    // Search each wiki for a page with matching title
    for (const wiki of wikis) {
      try {
        const client = getAdoClient();

        // Get all pages in this wiki (tree structure)
        const response = await client.get(
          `/${ado_project}/_apis/wiki/wikis/${wiki.id}/pages?recursionLevel=full&api-version=7.1`
        );

        // Search for matching page title (case-insensitive)
        const findPage = (page) => {
          if (page.path && page.path.toLowerCase() === `/${pageTitle.toLowerCase()}`) {
            return page;
          }
          if (page.subPages) {
            for (const subPage of page.subPages) {
              const found = findPage(subPage);
              if (found) return found;
            }
          }
          return null;
        };

        const foundPage = findPage(response.data);

        if (foundPage) {
          // Construct the wiki URL
          // Format: https://dev.azure.com/{org}/{project}/_wiki/wikis/{wikiName}/{pageId}/{pagePath}
          const wikiUrl = `${ado_org_url}/${ado_project}/_wiki/wikis/${wiki.name}/${foundPage.id}${foundPage.path}`;

          return {
            wikiName: wiki.name,
            pageId: foundPage.id,
            pagePath: foundPage.path,
            url: wikiUrl
          };
        }
      } catch (err) {
        // Continue searching other wikis if this one fails
        console.error(`Error searching wiki ${wiki.name}:`, err.message);
      }
    }

    // No matching page found in any wiki
    return null;
  } catch (error) {
    console.error('Error searching wikis:', error);
    throw error;
  }
}

export default {
  getAdoClient,
  testAdoConnection,
  getWorkItemTypes,
  inferProcessTemplate,
  queryWorkItems,
  getRecentWorkItems,
  getEpicsAndFeatures,
  getAllActiveWorkItems,
  getWorkItemById,
  getChildWorkItems,
  createWorkItem,
  updateWorkItem,
  getWikis,
  findWikiPageByTitle
};
