import { getDb } from '../database/db.js';

/**
 * Get application settings from database
 * @returns {Object|null} Settings object or null if not configured
 */
export function getSettings() {
  try {
    const db = getDb();

    const settings = db.prepare(`
      SELECT
        id,
        ado_org_url,
        ado_project,
        ado_pat,
        area_path,
        iteration_path,
        available_work_item_types,
        process_template,
        created_at,
        updated_at
      FROM settings
      WHERE id = 1
    `).get();

    // Parse available_work_item_types JSON if present
    if (settings && settings.available_work_item_types) {
      try {
        settings.available_work_item_types = JSON.parse(settings.available_work_item_types);
      } catch (error) {
        console.error('Error parsing available_work_item_types:', error);
        settings.available_work_item_types = null;
      }
    }

    return settings || null;
  } catch (error) {
    console.error(`❌ Critical Error in getSettings: [${error.code}] ${error.message}`);
    throw error;
  }
}

/**
 * Save or update application settings
 * @param {Object} settingsData - Settings object
 * @returns {Object} Saved settings
 */
export function saveSettings(settingsData) {
  const db = getDb();

  const {
    ado_org_url,
    ado_project,
    ado_pat,
    area_path,
    iteration_path
  } = settingsData;

  // Check if settings exist
  const existing = getSettings();

  if (existing) {
    // Update existing settings
    db.prepare(`
      UPDATE settings
      SET
        ado_org_url = ?,
        ado_project = ?,
        ado_pat = ?,
        area_path = ?,
        iteration_path = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = 1
    `).run(
      ado_org_url,
      ado_project,
      ado_pat,
      area_path || null,
      iteration_path || null
    );
  } else {
    // Insert new settings
    db.prepare(`
      INSERT INTO settings (
        id,
        ado_org_url,
        ado_project,
        ado_pat,
        area_path,
        iteration_path
      ) VALUES (1, ?, ?, ?, ?, ?)
    `).run(
      ado_org_url,
      ado_project,
      ado_pat,
      area_path || null,
      iteration_path || null
    );
  }

  return getSettings();
}

/**
 * Check if settings are configured
 * @returns {boolean} True if settings exist
 */
export function hasSettings() {
  const settings = getSettings();
  return settings !== null;
}

/**
 * Get sanitized settings (without sensitive data)
 * @returns {Object|null} Settings without PAT and API key
 */
export function getSanitizedSettings() {
  const settings = getSettings();

  if (!settings) return null;

  return {
    id: settings.id,
    ado_org_url: settings.ado_org_url,
    ado_project: settings.ado_project,
    ado_pat_configured: !!settings.ado_pat,
    area_path: settings.area_path,
    iteration_path: settings.iteration_path,
    available_work_item_types: settings.available_work_item_types,
    process_template: settings.process_template,
    created_at: settings.created_at,
    updated_at: settings.updated_at
  };
}

/**
 * Update work item types in settings
 * @param {Array} workItemTypes - Array of work item type objects from ADO
 * @param {string} processTemplate - Process template name
 */
export function updateWorkItemTypes(workItemTypes, processTemplate) {
  const db = getDb();

  // Extract just the names for storage
  const typeNames = workItemTypes.map(t => t.name);

  db.prepare(`
    UPDATE settings
    SET
      available_work_item_types = ?,
      process_template = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = 1
  `).run(
    JSON.stringify(typeNames),
    processTemplate
  );

  console.log(`✅ Updated work item types: ${typeNames.join(', ')}`);
  console.log(`✅ Detected process template: ${processTemplate}`);
}

/**
 * Get available work item types as array
 * Returns default types if not configured
 * @returns {Array} Array of work item type names
 */
export function getAvailableWorkItemTypes() {
  const settings = getSettings();

  if (settings && settings.available_work_item_types && settings.available_work_item_types.length > 0) {
    return settings.available_work_item_types;
  }

  // Return default types if not configured (Basic template)
  return ['Epic', 'Issue', 'Task'];
}

export default {
  getSettings,
  saveSettings,
  hasSettings,
  getSanitizedSettings,
  updateWorkItemTypes,
  getAvailableWorkItemTypes
};
