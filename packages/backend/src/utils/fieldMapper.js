import { getDb } from '../database/db.js';

/**
 * Get ADO field name from logical field name
 * @param {string} workItemType - The work item type (Bug, User Story, Task, etc.)
 * @param {string} logicalField - The logical field name (reproSteps, acceptanceCriteria, etc.)
 * @returns {string|null} ADO field reference name or null if not found
 */
export function getAdoFieldName(workItemType, logicalField) {
  const db = getDb();

  const mapping = db.prepare(`
    SELECT ado_field_name
    FROM field_mappings
    WHERE work_item_type = ? AND logical_field = ?
  `).get(workItemType, logicalField);

  return mapping?.ado_field_name || null;
}

/**
 * Get all field mappings for a specific work item type
 * @param {string} workItemType - The work item type
 * @returns {Array} Array of field mappings
 */
export function getFieldMappingsForType(workItemType) {
  const db = getDb();

  const mappings = db.prepare(`
    SELECT logical_field, ado_field_name
    FROM field_mappings
    WHERE work_item_type = ?
  `).all(workItemType);

  return mappings;
}

/**
 * Convert a work item object with logical field names to ADO patch operations
 * @param {string} workItemType - The work item type
 * @param {Object} workItemData - Object with logical field names as keys
 * @returns {Array} Array of ADO PATCH operations
 */
export function buildAdoPatchOperations(workItemType, workItemData) {
  const operations = [];

  for (const [logicalField, value] of Object.entries(workItemData)) {
    // Skip null/undefined values
    if (value === null || value === undefined) continue;

    // Special handling for parent (uses relation instead of field)
    if (logicalField === 'parent') {
      operations.push({
        op: 'add',
        path: '/relations/-',
        value: {
          rel: 'System.LinkTypes.Hierarchy-Reverse',
          url: value, // Should be full work item URL
          attributes: {
            comment: 'Parent work item'
          }
        }
      });
      continue;
    }

    const adoFieldName = getAdoFieldName(workItemType, logicalField);

    if (adoFieldName) {
      operations.push({
        op: 'add',
        path: `/fields/${adoFieldName}`,
        value: value
      });
    } else {
      console.warn(`⚠️  No mapping found for ${workItemType}.${logicalField}`);
    }
  }

  return operations;
}

/**
 * Get all available work item types from field mappings
 * @returns {Array<string>} Array of work item type names
 */
export function getAvailableWorkItemTypes() {
  const db = getDb();

  const types = db.prepare(`
    SELECT DISTINCT work_item_type
    FROM field_mappings
    ORDER BY work_item_type
  `).all();

  return types.map(t => t.work_item_type);
}

export default {
  getAdoFieldName,
  getFieldMappingsForType,
  buildAdoPatchOperations,
  getAvailableWorkItemTypes
};
