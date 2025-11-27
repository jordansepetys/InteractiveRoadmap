import express from 'express';
import { JSDOM } from 'jsdom';
import DOMPurify from 'dompurify';
import adoApi from '../utils/adoApi.js';
import * as adoApiQuery from '../utils/adoApi.js';
import settingsService from '../services/settingsService.js';
import { getSettings } from '../services/settingsService.js';
import { getDb } from '../database/db.js';
import { getStageForState, getAllStages } from '../utils/stageMapper.js';

const router = express.Router();

// Setup DOMPurify with jsdom for server-side
const window = new JSDOM('').window;
const purify = DOMPurify(window);

/**
 * GET /api/export/roadmap-html
 * Generate a self-contained HTML file with the roadmap visualization
 */
router.get('/roadmap-html', async (req, res) => {
  try {
    const settings = settingsService.getSettings();

    if (!settings || !settings.ado_org_url || !settings.ado_project || !settings.ado_pat) {
      return res.status(400).json({
        error: 'Azure DevOps settings not configured.'
      });
    }

    const { ado_project, ado_org_url } = settings;
    const client = adoApi.getAdoClient();

    // Fetch Features (same logic as roadmap.js)
    const wiql = `
      SELECT [System.Id]
      FROM WorkItems
      WHERE [System.WorkItemType] = 'Feature'
      AND [System.State] NOT IN ('Closed', 'Removed')
    `;

    const queryResponse = await client.post(
      `/${ado_project}/_apis/wit/wiql?api-version=7.1`,
      { query: wiql }
    );

    const workItemRefs = queryResponse.data.workItems || [];

    if (workItemRefs.length === 0) {
      return res.status(404).json({ error: 'No features found to export.' });
    }

    // Fetch full work item details - include all fields for detail panel
    const ids = workItemRefs.map(ref => ref.id).slice(0, 200);
    const fields = [
      'System.Id',
      'System.Title',
      'System.State',
      'System.Description',
      'System.AssignedTo',
      'System.CreatedDate',
      'System.ChangedDate',
      'System.CreatedBy',
      'System.Parent',
      'System.Tags',
      'Microsoft.VSTS.Scheduling.StartDate',
      'Microsoft.VSTS.Scheduling.TargetDate',
      'Microsoft.VSTS.Common.Priority',
      'Microsoft.VSTS.Common.AcceptanceCriteria'
    ].join(',');

    const workItemsResponse = await client.get(
      `/${ado_project}/_apis/wit/workitems?ids=${ids.join(',')}&fields=${fields}&api-version=7.1`
    );

    // Get visibility settings
    const db = getDb();
    const visibilityStmt = db.prepare(`
      SELECT feature_id, is_visible
      FROM feature_visibility
      WHERE is_visible = 0
    `);
    const hiddenFeatures = visibilityStmt.all();
    const hiddenFeatureIds = new Set(hiddenFeatures.map(f => f.feature_id));

    // Transform features with full details
    const roadmapFeatures = workItemsResponse.data.value
      .filter(item => !hiddenFeatureIds.has(item.id))
      .map(item => {
        const f = item.fields;
        return {
          id: item.id,
          title: f['System.Title'] || 'Untitled',
          state: f['System.State'] || 'Unknown',
          description: f['System.Description'] ? purify.sanitize(f['System.Description']) : null,
          acceptanceCriteria: f['Microsoft.VSTS.Common.AcceptanceCriteria'] ? purify.sanitize(f['Microsoft.VSTS.Common.AcceptanceCriteria']) : null,
          assignedTo: f['System.AssignedTo']?.displayName || 'Unassigned',
          createdBy: f['System.CreatedBy']?.displayName || 'Unknown',
          createdDate: f['System.CreatedDate'] || null,
          changedDate: f['System.ChangedDate'] || null,
          startDate: f['Microsoft.VSTS.Scheduling.StartDate'] || null,
          targetDate: f['Microsoft.VSTS.Scheduling.TargetDate'] || null,
          priority: f['Microsoft.VSTS.Common.Priority'] || null,
          tags: f['System.Tags'] || null,
          parentId: f['System.Parent'] || null
        };
      });

    // Sort by start date
    roadmapFeatures.sort((a, b) => {
      if (!a.startDate) return 1;
      if (!b.startDate) return -1;
      return new Date(a.startDate) - new Date(b.startDate);
    });

    // Fetch Epics with descriptions too
    const epicIds = [...new Set(roadmapFeatures.map(f => f.parentId).filter(id => id !== null))];
    let epics = [];

    if (epicIds.length > 0) {
      const epicFields = [
        'System.Id',
        'System.Title',
        'System.State',
        'System.Description',
        'Microsoft.VSTS.Scheduling.StartDate',
        'Microsoft.VSTS.Scheduling.TargetDate'
      ].join(',');

      const epicsResponse = await client.get(
        `/${ado_project}/_apis/wit/workitems?ids=${epicIds.join(',')}&fields=${epicFields}&api-version=7.1`
      );

      epics = epicsResponse.data.value.map(item => ({
        id: item.id,
        title: item.fields['System.Title'] || 'Untitled Epic',
        state: item.fields['System.State'] || 'Unknown',
        description: item.fields['System.Description'] ? purify.sanitize(item.fields['System.Description']) : null
      }));
    }

    // Group features by epic
    const epicGroups = {};
    const orphanedFeatures = [];

    epics.forEach(epic => {
      epicGroups[epic.id] = { epic, features: [] };
    });

    roadmapFeatures.forEach(feature => {
      if (feature.parentId && epicGroups[feature.parentId]) {
        epicGroups[feature.parentId].features.push(feature);
      } else {
        orphanedFeatures.push(feature);
      }
    });

    // Separate scheduled vs unscheduled
    const scheduled = Object.values(epicGroups).filter(group =>
      group.features.some(f => f.startDate && f.targetDate)
    );
    const unscheduled = orphanedFeatures.filter(f => !f.startDate || !f.targetDate);
    const orphanedScheduled = orphanedFeatures.filter(f => f.startDate && f.targetDate);

    // Build ADO base URL for links
    const adoBaseUrl = `${ado_org_url.replace(/\/$/, '')}/${ado_project}/_workitems/edit`;

    // Build data object for HTML
    const roadmapData = {
      projectName: ado_project,
      adoBaseUrl,
      exportDate: new Date().toISOString(),
      scheduled,
      orphanedScheduled,
      unscheduled,
      epics
    };

    // Generate HTML
    const html = generateRoadmapHTML(roadmapData);

    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Content-Disposition', `attachment; filename="roadmap-${ado_project}-${new Date().toISOString().split('T')[0]}.html"`);
    res.send(html);

  } catch (error) {
    console.error('Error generating roadmap export:', error);
    res.status(500).json({
      error: 'Failed to generate roadmap export',
      message: error.message
    });
  }
});

/**
 * GET /api/export/stagegate-html
 * Generate a self-contained HTML file with the stage gate board
 */
router.get('/stagegate-html', async (req, res) => {
  try {
    const settings = settingsService.getSettings();

    if (!settings || !settings.ado_org_url || !settings.ado_project || !settings.ado_pat) {
      return res.status(400).json({
        error: 'Azure DevOps settings not configured.'
      });
    }

    const { ado_project, ado_org_url, area_path } = settings;

    // Build WIQL query for Features
    let wiql = `
      SELECT [System.Id], [System.Title], [System.WorkItemType], [System.State],
             [System.AssignedTo], [System.Description], [System.CreatedDate],
             [System.ChangedDate], [System.Parent], [System.Tags],
             [Microsoft.VSTS.Common.Priority], [Microsoft.VSTS.Common.AcceptanceCriteria]
      FROM WorkItems
      WHERE [System.WorkItemType] = 'Feature'
      AND [System.State] NOT IN ('Removed')
    `;

    if (area_path) {
      wiql += ` AND [System.AreaPath] UNDER '${area_path}'`;
    }

    wiql += ' ORDER BY [Microsoft.VSTS.Common.Priority] ASC, [System.CreatedDate] DESC';

    // Execute query
    const features = await adoApiQuery.queryWorkItems(wiql);

    if (!features || features.length === 0) {
      return res.status(404).json({ error: 'No features found to export.' });
    }

    // Get visibility settings
    const db = getDb();
    const visibilityStmt = db.prepare(`
      SELECT feature_id, is_visible
      FROM feature_visibility
      WHERE is_visible = 0
    `);
    const hiddenFeatures = visibilityStmt.all();
    const hiddenFeatureIds = new Set(hiddenFeatures.map(f => f.feature_id));

    // Transform features with full details
    const featuresWithStages = features
      .filter(feature => !hiddenFeatureIds.has(feature.id))
      .map(feature => {
        const f = feature.fields;
        const state = f['System.State'] || 'New';
        const stage = getStageForState(state);

        return {
          id: feature.id,
          title: f['System.Title'] || 'Untitled',
          state: state,
          stage: stage,
          description: f['System.Description'] ? purify.sanitize(f['System.Description']) : null,
          acceptanceCriteria: f['Microsoft.VSTS.Common.AcceptanceCriteria'] ? purify.sanitize(f['Microsoft.VSTS.Common.AcceptanceCriteria']) : null,
          assignedTo: f['System.AssignedTo']?.displayName || 'Unassigned',
          createdBy: f['System.CreatedBy']?.displayName || 'Unknown',
          createdDate: f['System.CreatedDate'] || null,
          changedDate: f['System.ChangedDate'] || null,
          priority: f['Microsoft.VSTS.Common.Priority'] || null,
          tags: f['System.Tags'] || null,
          parentId: f['System.Parent'] || null
        };
      });

    // Group by stage
    const allStages = getAllStages();
    const grouped = {};
    const counts = {};

    allStages.forEach(stage => {
      grouped[stage] = [];
    });

    featuresWithStages.forEach(feature => {
      if (grouped[feature.stage]) {
        grouped[feature.stage].push(feature);
      } else {
        grouped['Intake'].push(feature);
      }
    });

    allStages.forEach(stage => {
      counts[stage] = grouped[stage].length;
    });

    // Build ADO base URL for links
    const adoBaseUrl = `${ado_org_url.replace(/\/$/, '')}/${ado_project}/_workitems/edit`;

    // Build data object for HTML
    const stageGateData = {
      projectName: ado_project,
      adoBaseUrl,
      exportDate: new Date().toISOString(),
      stages: allStages,
      grouped,
      counts,
      features: featuresWithStages
    };

    // Generate HTML
    const html = generateStageGateHTML(stageGateData);

    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Content-Disposition', `attachment; filename="stagegate-${ado_project}-${new Date().toISOString().split('T')[0]}.html"`);
    res.send(html);

  } catch (error) {
    console.error('Error generating stage gate export:', error);
    res.status(500).json({
      error: 'Failed to generate stage gate export',
      message: error.message
    });
  }
});

/**
 * Generate self-contained HTML for the stage gate board
 */
function generateStageGateHTML(data) {
  const { projectName, adoBaseUrl, exportDate, stages, grouped, counts, features } = data;

  // Stage colors
  const stageColors = {
    'Intake': { bg: '#f1f5f9', header: '#64748b', border: '#cbd5e1' },
    'Discovery': { bg: '#eff6ff', header: '#3b82f6', border: '#bfdbfe' },
    'Development': { bg: '#f5f3ff', header: '#8b5cf6', border: '#c4b5fd' },
    'Testing': { bg: '#fefce8', header: '#ca8a04', border: '#fde047' },
    'Complete': { bg: '#f0fdf4', header: '#16a34a', border: '#86efac' }
  };

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Stage Gate - ${projectName}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #f1f5f9;
      color: #1e293b;
      line-height: 1.5;
    }
    .container { padding: 24px; height: 100vh; display: flex; flex-direction: column; }
    .header {
      background: white;
      border-bottom: 1px solid #e2e8f0;
      padding: 20px 24px;
      margin-bottom: 24px;
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      flex-shrink: 0;
    }
    .header h1 { font-size: 24px; font-weight: 700; color: #0f172a; }
    .header p { font-size: 12px; color: #64748b; margin-top: 4px; }
    .board {
      display: flex;
      gap: 16px;
      flex: 1;
      min-height: 0;
      overflow-x: auto;
      padding-bottom: 8px;
    }
    .stage-column {
      flex: 1;
      min-width: 280px;
      max-width: 320px;
      display: flex;
      flex-direction: column;
      background: white;
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      overflow: hidden;
    }
    .stage-header {
      padding: 12px 16px;
      border-bottom: 2px solid;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-shrink: 0;
    }
    .stage-title {
      font-size: 13px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .stage-count {
      font-size: 11px;
      font-weight: 600;
      padding: 2px 8px;
      border-radius: 10px;
      background: rgba(0,0,0,0.1);
    }
    .stage-content {
      flex: 1;
      overflow-y: auto;
      padding: 12px;
    }
    .feature-card {
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 12px;
      margin-bottom: 8px;
      cursor: pointer;
      transition: all 0.15s;
      box-shadow: 0 1px 2px rgba(0,0,0,0.05);
    }
    .feature-card:hover {
      border-color: #3b82f6;
      box-shadow: 0 4px 12px rgba(59,130,246,0.15);
      transform: translateY(-1px);
    }
    .feature-card:last-child { margin-bottom: 0; }
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 8px;
    }
    .card-id {
      font-size: 10px;
      font-family: monospace;
      color: #94a3b8;
    }
    .card-priority {
      font-size: 9px;
      font-weight: 600;
      padding: 2px 6px;
      border-radius: 3px;
      background: #fef3c7;
      color: #92400e;
    }
    .card-title {
      font-size: 13px;
      font-weight: 600;
      color: #1e293b;
      line-height: 1.4;
      margin-bottom: 8px;
    }
    .card-meta {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 11px;
      color: #64748b;
    }
    .card-assignee {
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .card-state {
      font-size: 10px;
      font-weight: 500;
      padding: 2px 6px;
      border-radius: 3px;
      background: #f1f5f9;
    }
    .empty-stage {
      text-align: center;
      padding: 24px;
      color: #94a3b8;
      font-size: 12px;
    }

    /* Detail Panel Styles */
    .panel-overlay {
      display: none;
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(15, 23, 42, 0.4);
      z-index: 100;
      backdrop-filter: blur(2px);
    }
    .panel-overlay.open { display: block; }
    .detail-panel {
      position: fixed;
      top: 0;
      right: -600px;
      width: 600px;
      max-width: 90vw;
      height: 100vh;
      background: white;
      box-shadow: -4px 0 24px rgba(0,0,0,0.15);
      z-index: 101;
      transition: right 0.3s ease;
      display: flex;
      flex-direction: column;
    }
    .detail-panel.open { right: 0; }
    .panel-header {
      padding: 20px 24px;
      border-bottom: 1px solid #e2e8f0;
      background: #f8fafc;
    }
    .panel-close {
      position: absolute;
      top: 16px;
      right: 16px;
      width: 32px;
      height: 32px;
      border: none;
      background: white;
      border-radius: 6px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    .panel-close:hover { background: #f1f5f9; }
    .panel-id { font-size: 11px; font-family: monospace; color: #64748b; margin-bottom: 4px; }
    .panel-title { font-size: 18px; font-weight: 700; color: #0f172a; margin-bottom: 8px; padding-right: 40px; }
    .panel-meta { display: flex; gap: 8px; flex-wrap: wrap; }
    .panel-badge {
      font-size: 11px;
      font-weight: 600;
      padding: 4px 10px;
      border-radius: 4px;
      background: #f1f5f9;
      color: #475569;
    }
    .panel-badge.state { background: #dbeafe; color: #1e40af; }
    .panel-badge.stage { background: #f0fdf4; color: #166534; }
    .panel-badge.priority { background: #fef3c7; color: #92400e; }
    .panel-content {
      flex: 1;
      overflow-y: auto;
      padding: 24px;
    }
    .panel-section {
      margin-bottom: 24px;
    }
    .panel-section-title {
      font-size: 10px;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 8px;
      padding-bottom: 8px;
      border-bottom: 1px solid #e2e8f0;
    }
    .panel-description {
      font-size: 14px;
      color: #334155;
      line-height: 1.7;
    }
    .panel-description p { margin-bottom: 12px; }
    .panel-description ul, .panel-description ol { margin-left: 20px; margin-bottom: 12px; }
    .panel-description li { margin-bottom: 4px; }
    .panel-description a { color: #2563eb; text-decoration: none; }
    .panel-description a:hover { text-decoration: underline; }
    .panel-info-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
    }
    .panel-info-item label {
      display: block;
      font-size: 10px;
      font-weight: 600;
      color: #64748b;
      text-transform: uppercase;
      margin-bottom: 4px;
    }
    .panel-info-item span {
      font-size: 13px;
      color: #1e293b;
    }
    .panel-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }
    .panel-tag {
      font-size: 11px;
      padding: 3px 8px;
      background: #e2e8f0;
      color: #475569;
      border-radius: 4px;
    }
    .panel-footer {
      padding: 16px 24px;
      border-top: 1px solid #e2e8f0;
      background: #f8fafc;
    }
    .panel-ado-link {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 10px 16px;
      background: #2563eb;
      color: white;
      text-decoration: none;
      border-radius: 6px;
      font-size: 13px;
      font-weight: 600;
      transition: background 0.15s;
    }
    .panel-ado-link:hover { background: #1d4ed8; }
    .no-description { color: #94a3b8; font-style: italic; }

    .footer {
      text-align: center;
      padding: 16px;
      font-size: 11px;
      color: #94a3b8;
      flex-shrink: 0;
    }

    @media print {
      body { background: white; }
      .container { padding: 12px; height: auto; }
      .board { overflow: visible; }
      .stage-column { break-inside: avoid; }
      .feature-card { cursor: default; }
      .feature-card:hover { transform: none; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
      .detail-panel, .panel-overlay { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Stage Gate - ${projectName}</h1>
      <p>Exported on ${new Date(exportDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} &middot; Click any feature to view details</p>
    </div>

    <div class="board">
      ${stages.map(stage => {
        const color = stageColors[stage] || stageColors['Intake'];
        const stageFeatures = grouped[stage] || [];
        return `
          <div class="stage-column">
            <div class="stage-header" style="background: ${color.bg}; border-color: ${color.header};">
              <span class="stage-title" style="color: ${color.header};">${stage}</span>
              <span class="stage-count">${counts[stage] || 0}</span>
            </div>
            <div class="stage-content" style="background: ${color.bg};">
              ${stageFeatures.length === 0 ? `
                <div class="empty-stage">No features in this stage</div>
              ` : stageFeatures.map(f => `
                <div class="feature-card" data-feature-id="${f.id}">
                  <div class="card-header">
                    <span class="card-id">#${f.id}</span>
                    ${f.priority ? `<span class="card-priority">P${f.priority}</span>` : ''}
                  </div>
                  <div class="card-title">${escapeHtml(f.title)}</div>
                  <div class="card-meta">
                    <span class="card-assignee">${escapeHtml(f.assignedTo)}</span>
                    <span class="card-state">${escapeHtml(f.state)}</span>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        `;
      }).join('')}
    </div>

    <div class="footer">
      Generated from Azure DevOps &middot; ${new Date(exportDate).toLocaleString()}
    </div>
  </div>

  <!-- Detail Panel -->
  <div class="panel-overlay" id="panelOverlay"></div>
  <div class="detail-panel" id="detailPanel">
    <div class="panel-header">
      <button class="panel-close" id="panelClose">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M18 6L6 18M6 6l12 12"/>
        </svg>
      </button>
      <div class="panel-id" id="panelId"></div>
      <div class="panel-title" id="panelTitle"></div>
      <div class="panel-meta" id="panelMeta"></div>
    </div>
    <div class="panel-content">
      <div class="panel-section">
        <div class="panel-section-title">Description</div>
        <div class="panel-description" id="panelDescription"></div>
      </div>
      <div class="panel-section" id="panelAcceptanceSection" style="display:none;">
        <div class="panel-section-title">Acceptance Criteria</div>
        <div class="panel-description" id="panelAcceptance"></div>
      </div>
      <div class="panel-section">
        <div class="panel-section-title">Details</div>
        <div class="panel-info-grid" id="panelInfo"></div>
      </div>
      <div class="panel-section" id="panelTagsSection" style="display:none;">
        <div class="panel-section-title">Tags</div>
        <div class="panel-tags" id="panelTags"></div>
      </div>
    </div>
    <div class="panel-footer">
      <a class="panel-ado-link" id="panelAdoLink" href="#" target="_blank">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3"/>
        </svg>
        Open in Azure DevOps
      </a>
    </div>
  </div>

  <script>
    // Feature data store
    const features = ${JSON.stringify(features)};
    const adoBaseUrl = ${JSON.stringify(adoBaseUrl)};

    // Panel elements
    const overlay = document.getElementById('panelOverlay');
    const panel = document.getElementById('detailPanel');
    const closeBtn = document.getElementById('panelClose');

    // Format date helper
    function formatDate(dateStr) {
      if (!dateStr) return 'Not set';
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }

    // Open panel with feature data
    function openPanel(featureId) {
      const feature = features.find(f => f.id === featureId);
      if (!feature) return;

      document.getElementById('panelId').textContent = '#' + feature.id;
      document.getElementById('panelTitle').textContent = feature.title;

      // Meta badges
      let metaHtml = '<span class="panel-badge stage">' + feature.stage + '</span>';
      metaHtml += '<span class="panel-badge state">' + feature.state + '</span>';
      if (feature.priority) {
        metaHtml += '<span class="panel-badge priority">Priority ' + feature.priority + '</span>';
      }
      document.getElementById('panelMeta').innerHTML = metaHtml;

      // Description
      const descEl = document.getElementById('panelDescription');
      if (feature.description) {
        descEl.innerHTML = feature.description;
        descEl.classList.remove('no-description');
      } else {
        descEl.innerHTML = 'No description provided';
        descEl.classList.add('no-description');
      }

      // Acceptance Criteria
      const acSection = document.getElementById('panelAcceptanceSection');
      const acEl = document.getElementById('panelAcceptance');
      if (feature.acceptanceCriteria) {
        acEl.innerHTML = feature.acceptanceCriteria;
        acSection.style.display = 'block';
      } else {
        acSection.style.display = 'none';
      }

      // Info grid
      document.getElementById('panelInfo').innerHTML =
        '<div class="panel-info-item"><label>Assigned To</label><span>' + feature.assignedTo + '</span></div>' +
        '<div class="panel-info-item"><label>State</label><span>' + feature.state + '</span></div>' +
        '<div class="panel-info-item"><label>Stage</label><span>' + feature.stage + '</span></div>' +
        '<div class="panel-info-item"><label>Priority</label><span>' + (feature.priority || 'Not set') + '</span></div>' +
        '<div class="panel-info-item"><label>Created By</label><span>' + feature.createdBy + '</span></div>' +
        '<div class="panel-info-item"><label>Created On</label><span>' + formatDate(feature.createdDate) + '</span></div>';

      // Tags
      const tagsSection = document.getElementById('panelTagsSection');
      const tagsEl = document.getElementById('panelTags');
      if (feature.tags) {
        const tags = feature.tags.split(';').map(t => t.trim()).filter(t => t);
        tagsEl.innerHTML = tags.map(t => '<span class="panel-tag">' + t + '</span>').join('');
        tagsSection.style.display = 'block';
      } else {
        tagsSection.style.display = 'none';
      }

      // ADO link
      document.getElementById('panelAdoLink').href = adoBaseUrl + '/' + feature.id;

      // Show panel
      overlay.classList.add('open');
      panel.classList.add('open');
    }

    // Close panel
    function closePanel() {
      overlay.classList.remove('open');
      panel.classList.remove('open');
    }

    // Event listeners
    closeBtn.addEventListener('click', closePanel);
    overlay.addEventListener('click', closePanel);

    // Escape key closes panel
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closePanel();
    });

    // Feature card clicks
    document.querySelectorAll('.feature-card').forEach(card => {
      card.addEventListener('click', () => {
        const id = parseInt(card.dataset.featureId, 10);
        openPanel(id);
      });
    });
  </script>
</body>
</html>`;
}

/**
 * Generate self-contained HTML for the roadmap
 */
function generateRoadmapHTML(data) {
  const { projectName, adoBaseUrl, exportDate, scheduled, orphanedScheduled, unscheduled, epics } = data;

  // Calculate timeline bounds (6 months back, 6 months forward)
  const today = new Date();
  const timelineStart = new Date(today.getFullYear(), today.getMonth() - 6, 1);
  const timelineEnd = new Date(today.getFullYear(), today.getMonth() + 6, 0);

  // Generate month labels
  const months = [];
  let current = new Date(timelineStart);
  while (current <= timelineEnd) {
    months.push({
      label: current.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      date: current.toISOString()
    });
    current = new Date(current.getFullYear(), current.getMonth() + 1, 1);
  }

  // Color palette for swimlanes
  const colors = [
    { bg: '#475569', border: '#64748b', text: '#ffffff' },  // slate
    { bg: '#2563eb', border: '#3b82f6', text: '#ffffff' },  // blue
    { bg: '#4f46e5', border: '#6366f1', text: '#ffffff' },  // indigo
    { bg: '#0d9488', border: '#14b8a6', text: '#ffffff' },  // teal
  ];

  // Collect all features for the data store
  const allFeatures = [];
  scheduled.forEach(group => {
    group.features.forEach(f => allFeatures.push({ ...f, epicTitle: group.epic?.title }));
  });
  orphanedScheduled.forEach(f => allFeatures.push({ ...f, epicTitle: null }));
  unscheduled.forEach(f => allFeatures.push({ ...f, epicTitle: null }));

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Roadmap - ${projectName}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #f8fafc;
      color: #1e293b;
      line-height: 1.5;
    }
    .container { max-width: 1400px; margin: 0 auto; padding: 24px; }
    .header {
      background: white;
      border-bottom: 1px solid #e2e8f0;
      padding: 20px 24px;
      margin-bottom: 24px;
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    .header h1 { font-size: 24px; font-weight: 700; color: #0f172a; }
    .header p { font-size: 12px; color: #64748b; margin-top: 4px; }
    .timeline-container {
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      overflow: hidden;
      margin-bottom: 32px;
    }
    .timeline-header {
      display: flex;
      background: #f8fafc;
      border-bottom: 1px solid #e2e8f0;
      padding: 16px 16px 12px;
      position: sticky;
      top: 0;
      z-index: 5;
    }
    .month-label {
      flex: 1;
      text-align: center;
      font-size: 11px;
      font-weight: 600;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border-left: 1px solid #e2e8f0;
    }
    .month-label:first-child { border-left: none; }
    .swimlane {
      margin: 12px;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      overflow: hidden;
      background: white;
    }
    .swimlane-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 12px;
      background: #f8fafc;
      border-bottom: 1px solid #e2e8f0;
      cursor: pointer;
      user-select: none;
    }
    .swimlane-header:hover { background: #f1f5f9; }
    .swimlane-title {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .swimlane-id { font-size: 10px; font-family: monospace; color: #64748b; }
    .swimlane-name { font-size: 12px; font-weight: 700; color: #1e293b; }
    .swimlane-count { font-size: 10px; color: #64748b; }
    .swimlane-content { padding: 8px 12px; min-height: 50px; }
    .swimlane-content.collapsed { display: none; }
    .chevron {
      width: 12px;
      height: 12px;
      transition: transform 0.2s;
      color: #94a3b8;
    }
    .chevron.expanded { transform: rotate(90deg); }
    .feature-row { position: relative; height: 36px; margin-bottom: 6px; }
    .feature-bar {
      position: absolute;
      height: 100%;
      border-radius: 4px;
      display: flex;
      align-items: center;
      padding: 0 10px;
      cursor: pointer;
      transition: transform 0.1s, box-shadow 0.1s;
      overflow: hidden;
      box-shadow: 0 1px 2px rgba(0,0,0,0.1);
    }
    .feature-bar:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 6px rgba(0,0,0,0.15);
    }
    .feature-title {
      font-size: 11px;
      font-weight: 600;
      color: white;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .section-title {
      font-size: 11px;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 12px;
    }
    .unscheduled-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
      gap: 12px;
    }
    .unscheduled-card {
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 12px;
      cursor: pointer;
      transition: border-color 0.15s, box-shadow 0.15s;
    }
    .unscheduled-card:hover {
      border-color: #3b82f6;
      box-shadow: 0 2px 8px rgba(59,130,246,0.15);
    }
    .card-header { display: flex; justify-content: space-between; margin-bottom: 6px; }
    .card-id { font-size: 10px; font-family: monospace; color: #94a3b8; }
    .card-state {
      font-size: 9px;
      font-weight: 600;
      color: #64748b;
      background: #f1f5f9;
      padding: 2px 6px;
      border-radius: 3px;
    }
    .card-title { font-size: 12px; font-weight: 500; color: #1e293b; line-height: 1.4; }
    .today-line {
      position: absolute;
      top: 0;
      bottom: 0;
      width: 2px;
      background: #ef4444;
      z-index: 10;
    }
    .today-label {
      position: absolute;
      top: -20px;
      transform: translateX(-50%);
      font-size: 9px;
      font-weight: 600;
      color: #ef4444;
      background: white;
      padding: 2px 6px;
      border-radius: 3px;
      white-space: nowrap;
    }
    .footer {
      text-align: center;
      padding: 20px;
      font-size: 11px;
      color: #94a3b8;
    }

    /* Detail Panel Styles */
    .panel-overlay {
      display: none;
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(15, 23, 42, 0.4);
      z-index: 100;
      backdrop-filter: blur(2px);
    }
    .panel-overlay.open { display: block; }
    .detail-panel {
      position: fixed;
      top: 0;
      right: -600px;
      width: 600px;
      max-width: 90vw;
      height: 100vh;
      background: white;
      box-shadow: -4px 0 24px rgba(0,0,0,0.15);
      z-index: 101;
      transition: right 0.3s ease;
      display: flex;
      flex-direction: column;
    }
    .detail-panel.open { right: 0; }
    .panel-header {
      padding: 20px 24px;
      border-bottom: 1px solid #e2e8f0;
      background: #f8fafc;
    }
    .panel-close {
      position: absolute;
      top: 16px;
      right: 16px;
      width: 32px;
      height: 32px;
      border: none;
      background: white;
      border-radius: 6px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    .panel-close:hover { background: #f1f5f9; }
    .panel-id { font-size: 11px; font-family: monospace; color: #64748b; margin-bottom: 4px; }
    .panel-title { font-size: 18px; font-weight: 700; color: #0f172a; margin-bottom: 8px; padding-right: 40px; }
    .panel-meta { display: flex; gap: 12px; flex-wrap: wrap; }
    .panel-badge {
      font-size: 11px;
      font-weight: 600;
      padding: 4px 10px;
      border-radius: 4px;
      background: #f1f5f9;
      color: #475569;
    }
    .panel-badge.state { background: #dbeafe; color: #1e40af; }
    .panel-badge.priority { background: #fef3c7; color: #92400e; }
    .panel-content {
      flex: 1;
      overflow-y: auto;
      padding: 24px;
    }
    .panel-section {
      margin-bottom: 24px;
    }
    .panel-section-title {
      font-size: 10px;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 8px;
      padding-bottom: 8px;
      border-bottom: 1px solid #e2e8f0;
    }
    .panel-description {
      font-size: 14px;
      color: #334155;
      line-height: 1.7;
    }
    .panel-description p { margin-bottom: 12px; }
    .panel-description ul, .panel-description ol { margin-left: 20px; margin-bottom: 12px; }
    .panel-description li { margin-bottom: 4px; }
    .panel-description a { color: #2563eb; text-decoration: none; }
    .panel-description a:hover { text-decoration: underline; }
    .panel-info-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
    }
    .panel-info-item label {
      display: block;
      font-size: 10px;
      font-weight: 600;
      color: #64748b;
      text-transform: uppercase;
      margin-bottom: 4px;
    }
    .panel-info-item span {
      font-size: 13px;
      color: #1e293b;
    }
    .panel-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }
    .panel-tag {
      font-size: 11px;
      padding: 3px 8px;
      background: #e2e8f0;
      color: #475569;
      border-radius: 4px;
    }
    .panel-footer {
      padding: 16px 24px;
      border-top: 1px solid #e2e8f0;
      background: #f8fafc;
    }
    .panel-ado-link {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 10px 16px;
      background: #2563eb;
      color: white;
      text-decoration: none;
      border-radius: 6px;
      font-size: 13px;
      font-weight: 600;
      transition: background 0.15s;
    }
    .panel-ado-link:hover { background: #1d4ed8; }
    .no-description { color: #94a3b8; font-style: italic; }

    @media print {
      body { background: white; }
      .container { max-width: none; padding: 12px; }
      .swimlane-header { cursor: default; }
      .feature-bar { cursor: default; }
      .feature-bar:hover { transform: none; box-shadow: 0 1px 2px rgba(0,0,0,0.1); }
      .detail-panel, .panel-overlay { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Roadmap - ${projectName}</h1>
      <p>Exported on ${new Date(exportDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} &middot; Click any feature to view details</p>
    </div>

    ${(scheduled.length > 0 || orphanedScheduled.length > 0) ? `
    <div class="timeline-container">
      <div class="timeline-header">
        ${months.map(m => `<div class="month-label">${m.label}</div>`).join('')}
      </div>
      <div class="timeline-body" style="position: relative;">
        ${generateTodayLine(timelineStart, timelineEnd)}
        ${scheduled.map((group, idx) => generateSwimlane(group, colors[idx % colors.length], timelineStart, timelineEnd)).join('')}
        ${orphanedScheduled.length > 0 ? generateSwimlane({ epic: null, features: orphanedScheduled }, colors[3], timelineStart, timelineEnd) : ''}
      </div>
    </div>
    ` : ''}

    ${unscheduled.length > 0 ? `
    <div class="section-title">Unscheduled (${unscheduled.length})</div>
    <div class="unscheduled-grid">
      ${unscheduled.map(f => `
        <div class="unscheduled-card" data-feature-id="${f.id}">
          <div class="card-header">
            <span class="card-id">#${f.id}</span>
            <span class="card-state">${escapeHtml(f.state)}</span>
          </div>
          <div class="card-title">${escapeHtml(f.title)}</div>
        </div>
      `).join('')}
    </div>
    ` : ''}

    <div class="footer">
      Generated from Azure DevOps &middot; ${new Date(exportDate).toLocaleString()}
    </div>
  </div>

  <!-- Detail Panel -->
  <div class="panel-overlay" id="panelOverlay"></div>
  <div class="detail-panel" id="detailPanel">
    <div class="panel-header">
      <button class="panel-close" id="panelClose">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M18 6L6 18M6 6l12 12"/>
        </svg>
      </button>
      <div class="panel-id" id="panelId"></div>
      <div class="panel-title" id="panelTitle"></div>
      <div class="panel-meta" id="panelMeta"></div>
    </div>
    <div class="panel-content">
      <div class="panel-section">
        <div class="panel-section-title">Description</div>
        <div class="panel-description" id="panelDescription"></div>
      </div>
      <div class="panel-section" id="panelAcceptanceSection" style="display:none;">
        <div class="panel-section-title">Acceptance Criteria</div>
        <div class="panel-description" id="panelAcceptance"></div>
      </div>
      <div class="panel-section">
        <div class="panel-section-title">Details</div>
        <div class="panel-info-grid" id="panelInfo"></div>
      </div>
      <div class="panel-section" id="panelTagsSection" style="display:none;">
        <div class="panel-section-title">Tags</div>
        <div class="panel-tags" id="panelTags"></div>
      </div>
    </div>
    <div class="panel-footer">
      <a class="panel-ado-link" id="panelAdoLink" href="#" target="_blank">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3"/>
        </svg>
        Open in Azure DevOps
      </a>
    </div>
  </div>

  <script>
    // Feature data store
    const features = ${JSON.stringify(allFeatures)};
    const adoBaseUrl = ${JSON.stringify(adoBaseUrl)};

    // Panel elements
    const overlay = document.getElementById('panelOverlay');
    const panel = document.getElementById('detailPanel');
    const closeBtn = document.getElementById('panelClose');

    // Format date helper
    function formatDate(dateStr) {
      if (!dateStr) return 'Not set';
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }

    // Open panel with feature data
    function openPanel(featureId) {
      const feature = features.find(f => f.id === featureId);
      if (!feature) return;

      document.getElementById('panelId').textContent = '#' + feature.id;
      document.getElementById('panelTitle').textContent = feature.title;

      // Meta badges
      let metaHtml = '<span class="panel-badge state">' + feature.state + '</span>';
      if (feature.priority) {
        metaHtml += '<span class="panel-badge priority">Priority ' + feature.priority + '</span>';
      }
      if (feature.epicTitle) {
        metaHtml += '<span class="panel-badge">' + feature.epicTitle + '</span>';
      }
      document.getElementById('panelMeta').innerHTML = metaHtml;

      // Description
      const descEl = document.getElementById('panelDescription');
      if (feature.description) {
        descEl.innerHTML = feature.description;
        descEl.classList.remove('no-description');
      } else {
        descEl.innerHTML = 'No description provided';
        descEl.classList.add('no-description');
      }

      // Acceptance Criteria
      const acSection = document.getElementById('panelAcceptanceSection');
      const acEl = document.getElementById('panelAcceptance');
      if (feature.acceptanceCriteria) {
        acEl.innerHTML = feature.acceptanceCriteria;
        acSection.style.display = 'block';
      } else {
        acSection.style.display = 'none';
      }

      // Info grid
      document.getElementById('panelInfo').innerHTML =
        '<div class="panel-info-item"><label>Assigned To</label><span>' + feature.assignedTo + '</span></div>' +
        '<div class="panel-info-item"><label>State</label><span>' + feature.state + '</span></div>' +
        '<div class="panel-info-item"><label>Start Date</label><span>' + formatDate(feature.startDate) + '</span></div>' +
        '<div class="panel-info-item"><label>Target Date</label><span>' + formatDate(feature.targetDate) + '</span></div>' +
        '<div class="panel-info-item"><label>Created By</label><span>' + feature.createdBy + '</span></div>' +
        '<div class="panel-info-item"><label>Created On</label><span>' + formatDate(feature.createdDate) + '</span></div>';

      // Tags
      const tagsSection = document.getElementById('panelTagsSection');
      const tagsEl = document.getElementById('panelTags');
      if (feature.tags) {
        const tags = feature.tags.split(';').map(t => t.trim()).filter(t => t);
        tagsEl.innerHTML = tags.map(t => '<span class="panel-tag">' + t + '</span>').join('');
        tagsSection.style.display = 'block';
      } else {
        tagsSection.style.display = 'none';
      }

      // ADO link
      document.getElementById('panelAdoLink').href = adoBaseUrl + '/' + feature.id;

      // Show panel
      overlay.classList.add('open');
      panel.classList.add('open');
    }

    // Close panel
    function closePanel() {
      overlay.classList.remove('open');
      panel.classList.remove('open');
    }

    // Event listeners
    closeBtn.addEventListener('click', closePanel);
    overlay.addEventListener('click', closePanel);

    // Escape key closes panel
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closePanel();
    });

    // Feature bar clicks
    document.querySelectorAll('.feature-bar').forEach(bar => {
      bar.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = parseInt(bar.dataset.featureId, 10);
        openPanel(id);
      });
    });

    // Unscheduled card clicks
    document.querySelectorAll('.unscheduled-card').forEach(card => {
      card.addEventListener('click', () => {
        const id = parseInt(card.dataset.featureId, 10);
        openPanel(id);
      });
    });

    // Toggle swimlane collapse
    document.querySelectorAll('.swimlane-header').forEach(header => {
      header.addEventListener('click', () => {
        const content = header.nextElementSibling;
        const chevron = header.querySelector('.chevron');
        content.classList.toggle('collapsed');
        chevron.classList.toggle('expanded');
      });
    });
  </script>
</body>
</html>`;
}

function generateTodayLine(timelineStart, timelineEnd) {
  const today = new Date();
  const startMs = timelineStart.getTime();
  const endMs = timelineEnd.getTime();
  const todayMs = today.getTime();

  if (todayMs < startMs || todayMs > endMs) return '';

  const position = ((todayMs - startMs) / (endMs - startMs)) * 100;

  return `<div class="today-line" style="left: ${position}%;">
    <span class="today-label">Today</span>
  </div>`;
}

function generateSwimlane(group, color, timelineStart, timelineEnd) {
  const { epic, features } = group;
  const scheduledFeatures = features.filter(f => f.startDate && f.targetDate);

  if (scheduledFeatures.length === 0) return '';

  return `
    <div class="swimlane">
      <div class="swimlane-header">
        <div class="swimlane-title">
          <svg class="chevron expanded" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 5l7 7-7 7"/>
          </svg>
          <span class="swimlane-id">#${epic ? epic.id : '—'}</span>
          <span class="swimlane-name">${epic ? escapeHtml(epic.title) : 'Orphaned Features'}</span>
        </div>
        <span class="swimlane-count">${scheduledFeatures.length} items</span>
      </div>
      <div class="swimlane-content">
        ${scheduledFeatures.map(f => generateFeatureBar(f, color, timelineStart, timelineEnd)).join('')}
      </div>
    </div>
  `;
}

function generateFeatureBar(feature, color, timelineStart, timelineEnd) {
  const startMs = timelineStart.getTime();
  const endMs = timelineEnd.getTime();
  const duration = endMs - startMs;

  const featureStart = new Date(feature.startDate).getTime();
  const featureEnd = new Date(feature.targetDate).getTime();

  let left = ((featureStart - startMs) / duration) * 100;
  let width = ((featureEnd - featureStart) / duration) * 100;

  // Clamp values
  if (left < 0) {
    width += left;
    left = 0;
  }
  if (left + width > 100) {
    width = 100 - left;
  }

  if (width <= 0 || left >= 100) return '';

  return `
    <div class="feature-row">
      <div class="feature-bar" data-feature-id="${feature.id}" style="left: ${left}%; width: ${width}%; background: ${color.bg}; border: 1px solid ${color.border};">
        <span class="feature-title">${escapeHtml(feature.title)}</span>
      </div>
    </div>
  `;
}

function escapeHtml(text) {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export default router;
