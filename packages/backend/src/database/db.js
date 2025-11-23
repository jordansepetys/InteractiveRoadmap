import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Resolve database path relative to backend root
const dbPath = process.env.DB_PATH || './storage/storyforge.db';
const resolvedPath = path.resolve(__dirname, '../../', dbPath);

let db = null;

/**
 * Get or create database connection
 * @returns {Database} SQLite database instance
 */
export function getDb() {
  if (!db) {
    db = new Database(resolvedPath, {
      verbose: process.env.NODE_ENV === 'development' ? console.log : null,
      timeout: 5000
    });

    // Enable foreign keys
    db.pragma('foreign_keys = ON');
    
    // Enable WAL mode for better concurrency
    db.pragma('journal_mode = WAL');

    console.log(`📦 Database connected: ${resolvedPath}`);
  }

  return db;
}

/**
 * Close database connection
 */
export function closeDb() {
  if (db) {
    db.close();
    db = null;
    console.log('📦 Database connection closed');
  }
}

/**
 * Execute a transaction
 * @param {Function} callback Function to execute within transaction
 * @returns {*} Result of callback
 */
export function transaction(callback) {
  const database = getDb();
  return database.transaction(callback)();
}

// Graceful shutdown
process.on('SIGINT', () => {
  closeDb();
  process.exit(0);
});

process.on('SIGTERM', () => {
  closeDb();
  process.exit(0);
});

export default getDb;
