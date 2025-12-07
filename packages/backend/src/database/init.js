import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getDb, transaction } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Initialize database schema and seed data
 */
export function initializeDatabase() {
  console.log('🔨 Initializing database...');

  const db = getDb();

  // Read and execute schema.sql
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');

  // Execute schema (creates all tables and indexes)
  db.exec(schema);
  console.log('✅ Database schema created');

  // Run migrations for existing databases
  runMigrations(db);

  // Seed field mappings if not already seeded
  seedFieldMappings(db);

  // Seed default status templates if not already seeded
  seedStatusTemplates(db);

  console.log('✅ Database initialization complete');
}

/**
 * Run database migrations
 * Adds new columns to existing databases without losing data
 */
function runMigrations(db) {
  try {
    // Check if settings table exists
    const tableCheck = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='settings'").get();

    if (!tableCheck) {
      // Table doesn't exist yet, skip migrations
      return;
    }

    const tableInfo = db.prepare("PRAGMA table_info(settings)").all();
    const columnNames = tableInfo.map(col => col.name);

    // Migration 1: Add available_work_item_types column
    if (!columnNames.includes('available_work_item_types')) {
      console.log('  📝 Adding available_work_item_types column...');
      db.prepare('ALTER TABLE settings ADD COLUMN available_work_item_types TEXT').run();
      console.log('  ✅ Added available_work_item_types column');
    }

    // Migration 2: Add process_template column
    if (!columnNames.includes('process_template')) {
      console.log('  📝 Adding process_template column...');
      db.prepare('ALTER TABLE settings ADD COLUMN process_template TEXT').run();
      console.log('  ✅ Added process_template column');
    }

    // Migration 3: Create innovation_items table if it doesn't exist
    const innovationTableCheck = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='innovation_items'").get();
    if (!innovationTableCheck) {
      console.log('  📝 Creating innovation_items table...');
      db.exec(`
        CREATE TABLE IF NOT EXISTS innovation_items (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          description TEXT,
          stage TEXT NOT NULL DEFAULT 'Intake',
          stage_order INTEGER DEFAULT 0,
          ado_feature_id INTEGER,
          rice_reach INTEGER,
          rice_impact INTEGER,
          rice_confidence INTEGER,
          rice_effort INTEGER,
          rice_score REAL,
          roi_estimate TEXT,
          roi_notes TEXT,
          owner TEXT,
          requestor TEXT,
          category TEXT,
          tags TEXT,
          status_notes TEXT,
          rejection_reason TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          stage_changed_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        CREATE INDEX IF NOT EXISTS idx_innovation_stage ON innovation_items(stage);
        CREATE INDEX IF NOT EXISTS idx_innovation_ado ON innovation_items(ado_feature_id);
      `);
      console.log('  ✅ Created innovation_items table');
    }
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    // Don't throw - allow initialization to continue
  }
}

/**
 * Seed hardcoded field mappings for Azure DevOps
 * These are the standard ADO field references for work items
 */
function seedFieldMappings(db) {
  const existingMappings = db.prepare('SELECT COUNT(*) as count FROM field_mappings').get();

  if (existingMappings.count > 0) {
    console.log('ℹ️  Field mappings already exist, skipping seed');
    return;
  }

  console.log('🌱 Seeding field mappings...');

  const mappings = [
    // Common fields (all work item types)
    { type: 'Bug', logical: 'title', ado: 'System.Title' },
    { type: 'Bug', logical: 'description', ado: 'System.Description' },
    { type: 'Bug', logical: 'assignedTo', ado: 'System.AssignedTo' },
    { type: 'Bug', logical: 'state', ado: 'System.State' },
    { type: 'Bug', logical: 'priority', ado: 'Microsoft.VSTS.Common.Priority' },
    { type: 'Bug', logical: 'severity', ado: 'Microsoft.VSTS.Common.Severity' },
    { type: 'Bug', logical: 'areaPath', ado: 'System.AreaPath' },
    { type: 'Bug', logical: 'iterationPath', ado: 'System.IterationPath' },
    { type: 'Bug', logical: 'tags', ado: 'System.Tags' },

    // Bug-specific fields
    { type: 'Bug', logical: 'reproSteps', ado: 'Microsoft.VSTS.TCM.ReproSteps' },
    { type: 'Bug', logical: 'systemInfo', ado: 'Microsoft.VSTS.TCM.SystemInfo' },
    { type: 'Bug', logical: 'acceptanceCriteria', ado: 'Microsoft.VSTS.Common.AcceptanceCriteria' },
    { type: 'Bug', logical: 'foundInBuild', ado: 'Microsoft.VSTS.Build.FoundIn' },
    { type: 'Bug', logical: 'integrationBuild', ado: 'Microsoft.VSTS.Build.IntegrationBuild' },

    // User Story fields
    { type: 'User Story', logical: 'title', ado: 'System.Title' },
    { type: 'User Story', logical: 'description', ado: 'System.Description' },
    { type: 'User Story', logical: 'assignedTo', ado: 'System.AssignedTo' },
    { type: 'User Story', logical: 'state', ado: 'System.State' },
    { type: 'User Story', logical: 'priority', ado: 'Microsoft.VSTS.Common.Priority' },
    { type: 'User Story', logical: 'areaPath', ado: 'System.AreaPath' },
    { type: 'User Story', logical: 'iterationPath', ado: 'System.IterationPath' },
    { type: 'User Story', logical: 'tags', ado: 'System.Tags' },
    { type: 'User Story', logical: 'acceptanceCriteria', ado: 'Microsoft.VSTS.Common.AcceptanceCriteria' },
    { type: 'User Story', logical: 'storyPoints', ado: 'Microsoft.VSTS.Scheduling.StoryPoints' },
    { type: 'User Story', logical: 'risk', ado: 'Microsoft.VSTS.Common.Risk' },
    { type: 'User Story', logical: 'value', ado: 'Microsoft.VSTS.Common.BusinessValue' },

    // Task fields
    { type: 'Task', logical: 'title', ado: 'System.Title' },
    { type: 'Task', logical: 'description', ado: 'System.Description' },
    { type: 'Task', logical: 'assignedTo', ado: 'System.AssignedTo' },
    { type: 'Task', logical: 'state', ado: 'System.State' },
    { type: 'Task', logical: 'priority', ado: 'Microsoft.VSTS.Common.Priority' },
    { type: 'Task', logical: 'areaPath', ado: 'System.AreaPath' },
    { type: 'Task', logical: 'iterationPath', ado: 'System.IterationPath' },
    { type: 'Task', logical: 'tags', ado: 'System.Tags' },
    { type: 'Task', logical: 'activity', ado: 'Microsoft.VSTS.Common.Activity' },
    { type: 'Task', logical: 'remainingWork', ado: 'Microsoft.VSTS.Scheduling.RemainingWork' },
    { type: 'Task', logical: 'originalEstimate', ado: 'Microsoft.VSTS.Scheduling.OriginalEstimate' },
    { type: 'Task', logical: 'completedWork', ado: 'Microsoft.VSTS.Scheduling.CompletedWork' },

    // Epic fields
    { type: 'Epic', logical: 'title', ado: 'System.Title' },
    { type: 'Epic', logical: 'description', ado: 'System.Description' },
    { type: 'Epic', logical: 'state', ado: 'System.State' },
    { type: 'Epic', logical: 'priority', ado: 'Microsoft.VSTS.Common.Priority' },
    { type: 'Epic', logical: 'areaPath', ado: 'System.AreaPath' },
    { type: 'Epic', logical: 'iterationPath', ado: 'System.IterationPath' },

    // Feature fields
    { type: 'Feature', logical: 'title', ado: 'System.Title' },
    { type: 'Feature', logical: 'description', ado: 'System.Description' },
    { type: 'Feature', logical: 'state', ado: 'System.State' },
    { type: 'Feature', logical: 'priority', ado: 'Microsoft.VSTS.Common.Priority' },
    { type: 'Feature', logical: 'areaPath', ado: 'System.AreaPath' },
    { type: 'Feature', logical: 'iterationPath', ado: 'System.IterationPath' },
    { type: 'Feature', logical: 'value', ado: 'Microsoft.VSTS.Common.BusinessValue' },
    { type: 'Feature', logical: 'targetDate', ado: 'Microsoft.VSTS.Scheduling.TargetDate' },
  ];

  const insert = db.prepare(`
    INSERT INTO field_mappings (work_item_type, logical_field, ado_field_name)
    VALUES (?, ?, ?)
  `);

  transaction(() => {
    for (const mapping of mappings) {
      insert.run(mapping.type, mapping.logical, mapping.ado);
    }
  });

  console.log(`✅ Seeded ${mappings.length} field mappings`);
}

/**
 * Seed default status update templates
 */
function seedStatusTemplates(db) {
  const existingTemplates = db.prepare('SELECT COUNT(*) as count FROM status_templates').get();

  if (existingTemplates.count > 0) {
    console.log('ℹ️  Status templates already exist, skipping seed');
    return;
  }

  console.log('🌱 Seeding default status templates...');

  const templates = [
    {
      name: 'Default (Full Status)',
      description: 'Comprehensive status update with all sections',
      sections: JSON.stringify(['accomplishments', 'in_progress', 'blockers', 'next_steps', 'risks', 'metrics']),
      format_style: 'bullets'
    },
    {
      name: 'Weekly Sprint Update',
      description: 'Standard weekly sprint status for agile teams',
      sections: JSON.stringify(['accomplishments', 'in_progress', 'blockers', 'next_steps']),
      format_style: 'bullets'
    },
    {
      name: 'Executive Summary Only',
      description: 'Brief summary for leadership (no detailed sections)',
      sections: JSON.stringify(['accomplishments', 'risks']),
      format_style: 'paragraphs'
    },
    {
      name: 'Risk-Focused Update',
      description: 'Emphasizes risks and blockers for escalation',
      sections: JSON.stringify(['accomplishments', 'blockers', 'risks', 'next_steps']),
      format_style: 'mixed'
    }
  ];

  const insert = db.prepare(`
    INSERT INTO status_templates (name, description, sections, format_style)
    VALUES (?, ?, ?, ?)
  `);

  transaction(() => {
    for (const template of templates) {
      insert.run(template.name, template.description, template.sections, template.format_style);
    }
  });

  console.log(`✅ Seeded ${templates.length} status templates`);
}

// Run initialization if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    initializeDatabase();
    console.log('🎉 Database ready!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  }
}

export default initializeDatabase;
