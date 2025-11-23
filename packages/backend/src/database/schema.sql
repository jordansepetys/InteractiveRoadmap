-- Aiba Database Schema
-- SQLite database for storing settings and work item cache

-- Settings table: ADO configuration
CREATE TABLE IF NOT EXISTS settings (
  id INTEGER PRIMARY KEY CHECK (id = 1), -- Enforce single row
  ado_org_url TEXT NOT NULL,
  ado_project TEXT NOT NULL,
  ado_pat TEXT NOT NULL, -- Personal Access Token (encrypted in production)
  area_path TEXT,
  iteration_path TEXT,
  available_work_item_types TEXT, -- JSON array of work item types from ADO
  process_template TEXT, -- 'Basic', 'Agile', 'Scrum', 'CMMI', or 'Custom'
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Field mappings: Logical field names to ADO field references
-- Allows customization per work item type
CREATE TABLE IF NOT EXISTS field_mappings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  work_item_type TEXT NOT NULL, -- 'Bug', 'User Story', 'Task', etc.
  logical_field TEXT NOT NULL, -- 'reproSteps', 'acceptanceCriteria', etc.
  ado_field_name TEXT NOT NULL, -- 'Microsoft.VSTS.TCM.ReproSteps', etc.
  UNIQUE(work_item_type, logical_field)
);

-- Work items cache: Recent work items from ADO (for duplicate detection)
-- Refreshed hourly via node-cron
CREATE TABLE IF NOT EXISTS work_items_cache (
  id INTEGER PRIMARY KEY, -- ADO work item ID
  title TEXT NOT NULL,
  type TEXT NOT NULL, -- 'Bug', 'User Story', 'Task', etc.
  state TEXT NOT NULL, -- 'New', 'Active', 'Resolved', 'Closed'
  parent_id INTEGER, -- Parent work item ID (Epic/Feature)
  created_date DATETIME,
  description TEXT,
  last_fetched DATETIME DEFAULT CURRENT_TIMESTAMP,
  area_path TEXT,
  iteration_path TEXT
);

-- Status Templates: Templates for generating status updates
CREATE TABLE IF NOT EXISTS status_templates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  sections TEXT NOT NULL, -- JSON array of section keys
  format_style TEXT DEFAULT 'bullets', -- 'bullets', 'paragraphs', 'mixed'
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Feature Visibility: Track which features should be shown/hidden on Roadmap and Stage Gate
CREATE TABLE IF NOT EXISTS feature_visibility (
  feature_id INTEGER PRIMARY KEY, -- ADO Feature work item ID
  is_visible INTEGER DEFAULT 1, -- 1 = visible, 0 = hidden
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_work_items_cache_created ON work_items_cache(created_date DESC);
CREATE INDEX IF NOT EXISTS idx_work_items_cache_state ON work_items_cache(state);
CREATE INDEX IF NOT EXISTS idx_work_items_cache_type ON work_items_cache(type);