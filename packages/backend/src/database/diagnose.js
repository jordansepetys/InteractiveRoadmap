import { getDb } from './db.js';

try {
  const db = getDb();
  console.log('--- Database Diagnostics ---');
  
  // List tables
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
  console.log('Tables:', tables.map(t => t.name));

  // Check settings columns
  if (tables.find(t => t.name === 'settings')) {
    const columns = db.prepare("PRAGMA table_info(settings)").all();
    console.log('Settings Columns:', columns.map(c => c.name));
    
    // Try to read settings
    console.log('Attempting to read settings...');
    try {
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
      console.log('Settings Read Success:', settings ? 'Found' : 'Not Found');
      if (settings) {
        console.log('Settings keys:', Object.keys(settings));
      }
    } catch (readError) {
      console.error('❌ Settings Read Failed:', readError);
    }

  } else {
    console.error('❌ settings table missing!');
  }

  // Check status_templates table
  if (tables.find(t => t.name === 'status_templates')) {
    const columns = db.prepare("PRAGMA table_info(status_templates)").all();
    console.log('Status Templates Columns:', columns.map(c => c.name));
    
    const count = db.prepare("SELECT COUNT(*) as c FROM status_templates").get();
    console.log('Status Templates Count:', count.c);
  } else {
    console.error('❌ status_templates table missing!');
  }

} catch (error) {
  console.error('Diagnostic Error:', error);
}
