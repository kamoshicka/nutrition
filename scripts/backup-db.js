/**
 * Database backup system
 * Handles automated database backups with retention policies
 */

const fs = require('fs').promises;
const path = require('path');
const { spawn } = require('child_process');

class DatabaseBackup {
  constructor() {
    this.dbPath = process.env.DATABASE_URL || path.join(process.cwd(), 'data', 'app.db');
    this.backupDir = path.join(process.cwd(), 'backups');
    this.retentionDays = parseInt(process.env.BACKUP_RETENTION_DAYS || '30', 10);
  }

  async ensureBackupDirectory() {
    try {
      await fs.access(this.backupDir);
    } catch (error) {
      if (error.code === 'ENOENT') {
        await fs.mkdir(this.backupDir, { recursive: true });
        console.log(`Created backup directory: ${this.backupDir}`);
      } else {
        throw error;
      }
    }
  }

  generateBackupFilename() {
    const timestamp = new Date().toISOString()
      .replace(/[:.]/g, '-')
      .replace('T', '_')
      .split('.')[0];
    return `app_backup_${timestamp}.db`;
  }

  async createBackup() {
    await this.ensureBackupDirectory();
    
    const backupFilename = this.generateBackupFilename();
    const backupPath = path.join(this.backupDir, backupFilename);
    
    console.log(`Creating backup: ${backupFilename}`);
    
    try {
      // Check if source database exists
      await fs.access(this.dbPath);
      
      // Copy database file
      await fs.copyFile(this.dbPath, backupPath);
      
      // Verify backup integrity
      const sourceStats = await fs.stat(this.dbPath);
      const backupStats = await fs.stat(backupPath);
      
      if (sourceStats.size !== backupStats.size) {
        throw new Error('Backup file size mismatch');
      }
      
      console.log(`✅ Backup created successfully: ${backupFilename}`);
      console.log(`   Size: ${Math.round(backupStats.size / 1024)} KB`);
      
      // Create metadata file
      const metadata = {
        filename: backupFilename,
        originalPath: this.dbPath,
        createdAt: new Date().toISOString(),
        size: backupStats.size,
        checksum: await this.calculateChecksum(backupPath)
      };
      
      await fs.writeFile(
        path.join(this.backupDir, `${backupFilename}.meta.json`),
        JSON.stringify(metadata, null, 2)
      );
      
      return backupPath;
      
    } catch (error) {
      console.error(`❌ Backup failed: ${error.message}`);
      
      // Clean up partial backup
      try {
        await fs.unlink(backupPath);
      } catch (cleanupError) {
        // Ignore cleanup errors
      }
      
      throw error;
    }
  }

  async calculateChecksum(filePath) {
    const crypto = require('crypto');
    const fileBuffer = await fs.readFile(filePath);
    return crypto.createHash('sha256').update(fileBuffer).digest('hex');
  }

  async listBackups() {
    await this.ensureBackupDirectory();
    
    try {
      const files = await fs.readdir(this.backupDir);
      const backupFiles = files
        .filter(file => file.endsWith('.db'))
        .sort()
        .reverse(); // Most recent first
      
      if (backupFiles.length === 0) {
        console.log('No backups found');
        return [];
      }
      
      console.log('\nAvailable backups:');
      console.log('==================');
      
      const backups = [];
      
      for (const file of backupFiles) {
        const filePath = path.join(this.backupDir, file);
        const metaPath = path.join(this.backupDir, `${file}.meta.json`);
        
        try {
          const stats = await fs.stat(filePath);
          let metadata = null;
          
          try {
            const metaContent = await fs.readFile(metaPath, 'utf8');
            metadata = JSON.parse(metaContent);
          } catch (metaError) {
            // Metadata file doesn't exist or is corrupted
          }
          
          const backup = {
            filename: file,
            path: filePath,
            size: stats.size,
            createdAt: metadata?.createdAt || stats.birthtime.toISOString(),
            checksum: metadata?.checksum
          };
          
          backups.push(backup);
          
          const sizeKB = Math.round(stats.size / 1024);
          const date = new Date(backup.createdAt).toLocaleString();
          console.log(`  ${file} - ${sizeKB} KB - ${date}`);
          
        } catch (error) {
          console.warn(`  ⚠️  ${file} - Error reading file: ${error.message}`);
        }
      }
      
      return backups;
      
    } catch (error) {
      console.error(`Error listing backups: ${error.message}`);
      return [];
    }
  }

  async cleanupOldBackups() {
    const backups = await this.listBackups();
    
    if (backups.length === 0) {
      return;
    }
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.retentionDays);
    
    const oldBackups = backups.filter(backup => 
      new Date(backup.createdAt) < cutoffDate
    );
    
    if (oldBackups.length === 0) {
      console.log(`No backups older than ${this.retentionDays} days found`);
      return;
    }
    
    console.log(`\nCleaning up ${oldBackups.length} old backups...`);
    
    for (const backup of oldBackups) {
      try {
        await fs.unlink(backup.path);
        
        // Also remove metadata file if it exists
        const metaPath = `${backup.path}.meta.json`;
        try {
          await fs.unlink(metaPath);
        } catch (metaError) {
          // Ignore if metadata file doesn't exist
        }
        
        console.log(`  ✅ Deleted: ${backup.filename}`);
        
      } catch (error) {
        console.error(`  ❌ Failed to delete ${backup.filename}: ${error.message}`);
      }
    }
  }

  async restoreBackup(backupFilename) {
    const backupPath = path.join(this.backupDir, backupFilename);
    
    try {
      // Verify backup exists
      await fs.access(backupPath);
      
      // Create backup of current database before restore
      const currentBackupName = `pre_restore_${this.generateBackupFilename()}`;
      const currentBackupPath = path.join(this.backupDir, currentBackupName);
      
      try {
        await fs.copyFile(this.dbPath, currentBackupPath);
        console.log(`✅ Current database backed up as: ${currentBackupName}`);
      } catch (error) {
        console.warn(`⚠️  Could not backup current database: ${error.message}`);
      }
      
      // Restore from backup
      await fs.copyFile(backupPath, this.dbPath);
      
      console.log(`✅ Database restored from: ${backupFilename}`);
      
      // Verify restored database
      const sqlite3 = require('sqlite3');
      const { open } = require('sqlite');
      
      const db = await open({
        filename: this.dbPath,
        driver: sqlite3.Database
      });
      
      await db.get('SELECT 1'); // Simple connectivity test
      await db.close();
      
      console.log('✅ Restored database verified successfully');
      
    } catch (error) {
      console.error(`❌ Restore failed: ${error.message}`);
      throw error;
    }
  }

  async verifyBackup(backupFilename) {
    const backupPath = path.join(this.backupDir, backupFilename);
    const metaPath = `${backupPath}.meta.json`;
    
    try {
      // Check if backup file exists
      await fs.access(backupPath);
      
      // Load metadata if available
      let metadata = null;
      try {
        const metaContent = await fs.readFile(metaPath, 'utf8');
        metadata = JSON.parse(metaContent);
      } catch (metaError) {
        console.warn('⚠️  No metadata file found, skipping checksum verification');
      }
      
      // Verify file integrity
      if (metadata && metadata.checksum) {
        const currentChecksum = await this.calculateChecksum(backupPath);
        if (currentChecksum !== metadata.checksum) {
          throw new Error('Backup file checksum mismatch - file may be corrupted');
        }
        console.log('✅ Checksum verification passed');
      }
      
      // Test database connectivity
      const sqlite3 = require('sqlite3');
      const { open } = require('sqlite');
      
      const db = await open({
        filename: backupPath,
        driver: sqlite3.Database
      });
      
      // Run basic queries to verify database structure
      const tables = await db.all("SELECT name FROM sqlite_master WHERE type='table'");
      await db.close();
      
      console.log(`✅ Backup verification successful`);
      console.log(`   Tables found: ${tables.length}`);
      console.log(`   Tables: ${tables.map(t => t.name).join(', ')}`);
      
      return true;
      
    } catch (error) {
      console.error(`❌ Backup verification failed: ${error.message}`);
      return false;
    }
  }
}

async function main() {
  const command = process.argv[2];
  const backup = new DatabaseBackup();
  
  try {
    switch (command) {
      case 'create':
        await backup.createBackup();
        break;
        
      case 'list':
        await backup.listBackups();
        break;
        
      case 'cleanup':
        await backup.cleanupOldBackups();
        break;
        
      case 'restore':
        const backupFile = process.argv[3];
        if (!backupFile) {
          console.error('Please specify backup filename');
          process.exit(1);
        }
        await backup.restoreBackup(backupFile);
        break;
        
      case 'verify':
        const verifyFile = process.argv[3];
        if (!verifyFile) {
          console.error('Please specify backup filename');
          process.exit(1);
        }
        const isValid = await backup.verifyBackup(verifyFile);
        process.exit(isValid ? 0 : 1);
        break;
        
      default:
        console.log('Usage:');
        console.log('  node scripts/backup-db.js create              - Create new backup');
        console.log('  node scripts/backup-db.js list                - List all backups');
        console.log('  node scripts/backup-db.js cleanup             - Remove old backups');
        console.log('  node scripts/backup-db.js restore <filename>  - Restore from backup');
        console.log('  node scripts/backup-db.js verify <filename>   - Verify backup integrity');
        process.exit(1);
    }
    
  } catch (error) {
    console.error('Backup operation failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { DatabaseBackup };