const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');
const fs = require('fs').promises;

/**
 * Database Migration System
 * Handles database schema updates and data migrations
 */

class DatabaseMigrator {
  constructor(dbPath) {
    this.dbPath = dbPath;
    this.db = null;
    this.migrationsPath = path.join(process.cwd(), 'migrations');
  }

  async connect() {
    this.db = await open({
      filename: this.dbPath,
      driver: sqlite3.Database
    });
    await this.db.exec('PRAGMA foreign_keys = ON');
  }

  async disconnect() {
    if (this.db) {
      await this.db.close();
    }
  }

  async createMigrationsTable() {
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS migrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        filename TEXT UNIQUE NOT NULL,
        applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
  }

  async getAppliedMigrations() {
    const migrations = await this.db.all(
      'SELECT filename FROM migrations ORDER BY id'
    );
    return migrations.map(m => m.filename);
  }

  async getMigrationFiles() {
    try {
      const files = await fs.readdir(this.migrationsPath);
      return files
        .filter(file => file.endsWith('.sql'))
        .sort();
    } catch (error) {
      if (error.code === 'ENOENT') {
        console.log('Migrations directory not found, creating...');
        await fs.mkdir(this.migrationsPath, { recursive: true });
        return [];
      }
      throw error;
    }
  }

  async applyMigration(filename) {
    const migrationPath = path.join(this.migrationsPath, filename);
    const sql = await fs.readFile(migrationPath, 'utf8');
    
    console.log(`Applying migration: ${filename}`);
    
    await this.db.exec('BEGIN TRANSACTION');
    
    try {
      // Split SQL by semicolons and execute each statement
      const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0);
      
      for (const statement of statements) {
        await this.db.exec(statement);
      }
      
      // Record the migration as applied
      await this.db.run(
        'INSERT INTO migrations (filename) VALUES (?)',
        [filename]
      );
      
      await this.db.exec('COMMIT');
      console.log(`✓ Migration ${filename} applied successfully`);
    } catch (error) {
      await this.db.exec('ROLLBACK');
      throw new Error(`Failed to apply migration ${filename}: ${error.message}`);
    }
  }

  async migrate() {
    await this.connect();
    await this.createMigrationsTable();
    
    const appliedMigrations = await this.getAppliedMigrations();
    const migrationFiles = await this.getMigrationFiles();
    
    const pendingMigrations = migrationFiles.filter(
      file => !appliedMigrations.includes(file)
    );
    
    if (pendingMigrations.length === 0) {
      console.log('No pending migrations');
      return;
    }
    
    console.log(`Found ${pendingMigrations.length} pending migrations`);
    
    for (const migration of pendingMigrations) {
      await this.applyMigration(migration);
    }
    
    console.log('All migrations applied successfully');
  }

  async rollback(steps = 1) {
    await this.connect();
    
    const appliedMigrations = await this.db.all(
      'SELECT filename FROM migrations ORDER BY id DESC LIMIT ?',
      [steps]
    );
    
    if (appliedMigrations.length === 0) {
      console.log('No migrations to rollback');
      return;
    }
    
    console.log(`Rolling back ${appliedMigrations.length} migrations`);
    
    for (const migration of appliedMigrations) {
      console.log(`Rolling back: ${migration.filename}`);
      
      // Remove from migrations table
      await this.db.run(
        'DELETE FROM migrations WHERE filename = ?',
        [migration.filename]
      );
      
      console.log(`✓ Rolled back ${migration.filename}`);
    }
  }

  async status() {
    await this.connect();
    await this.createMigrationsTable();
    
    const appliedMigrations = await this.getAppliedMigrations();
    const migrationFiles = await this.getMigrationFiles();
    
    console.log('\nMigration Status:');
    console.log('================');
    
    for (const file of migrationFiles) {
      const status = appliedMigrations.includes(file) ? '✓ Applied' : '✗ Pending';
      console.log(`${status} - ${file}`);
    }
    
    const pendingCount = migrationFiles.filter(
      file => !appliedMigrations.includes(file)
    ).length;
    
    console.log(`\nTotal: ${migrationFiles.length} migrations`);
    console.log(`Applied: ${appliedMigrations.length}`);
    console.log(`Pending: ${pendingCount}`);
  }
}

async function main() {
  const command = process.argv[2];
  const dbPath = process.env.DATABASE_URL || path.join(process.cwd(), 'data', 'app.db');
  
  const migrator = new DatabaseMigrator(dbPath);
  
  try {
    switch (command) {
      case 'migrate':
        await migrator.migrate();
        break;
      case 'rollback':
        const steps = parseInt(process.argv[3]) || 1;
        await migrator.rollback(steps);
        break;
      case 'status':
        await migrator.status();
        break;
      default:
        console.log('Usage:');
        console.log('  node scripts/migrate-db.js migrate   - Apply pending migrations');
        console.log('  node scripts/migrate-db.js rollback [steps] - Rollback migrations');
        console.log('  node scripts/migrate-db.js status    - Show migration status');
        process.exit(1);
    }
  } catch (error) {
    console.error('Migration failed:', error.message);
    process.exit(1);
  } finally {
    await migrator.disconnect();
  }
}

if (require.main === module) {
  main();
}

module.exports = { DatabaseMigrator };