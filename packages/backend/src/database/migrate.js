import { getDb } from './db.js';

/**
 * Run database migrations
 * Adds new columns to existing databases without losing data
 */
export function runMigrations() {
  console.log('🔄 Running database migrations...');

  const db = getDb();

  try {
    // Check if settings table exists
    const tableInfo = db.prepare("PRAGMA table_info(settings)").all();
    const columnNames = tableInfo.map(col => col.name);

    // Migration 1: Add available_work_item_types column
    if (!columnNames.includes('available_work_item_types')) {
      console.log('  Adding available_work_item_types column...');
      db.prepare('ALTER TABLE settings ADD COLUMN available_work_item_types TEXT').run();
      console.log('  ✅ Added available_work_item_types column');
    }

    // Migration 2: Add process_template column
    if (!columnNames.includes('process_template')) {
      console.log('  Adding process_template column...');
      db.prepare('ALTER TABLE settings ADD COLUMN process_template TEXT').run();
      console.log('  ✅ Added process_template column');
    }

    console.log('✅ Database migrations complete');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    throw error;
  }
}

export default runMigrations;
