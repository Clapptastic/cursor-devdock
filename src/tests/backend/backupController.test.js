/**
 * Tests for backup controller
 */
const request = require('supertest');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

// Mock modules
jest.mock('../../database/backup', () => require('../mocks/backup'));
jest.mock('../../database/scheduleBackup', () => require('../mocks/scheduleBackup'));
jest.mock('fs');
jest.mock('../../backend/models/User', () => require('../mocks/User'));

// Import mock modules
const backup = require('../mocks/backup');
const scheduleBackup = require('../mocks/scheduleBackup');

// Import app after mocking dependencies
const app = require('../../backend/server');

describe('Backup Controller', () => {
  let adminToken;
  let regularToken;
  
  // Setup before tests
  beforeAll(() => {
    // Create test tokens
    adminToken = jwt.sign(
      { id: 'admin123', role: 'admin' },
      process.env.JWT_SECRET || 'testjwtsecret',
      { expiresIn: '1h' }
    );
    
    regularToken = jwt.sign(
      { id: 'user123', role: 'user' },
      process.env.JWT_SECRET || 'testjwtsecret',
      { expiresIn: '1h' }
    );
  });
  
  // Reset mocks between tests
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  // Test GET /api/backups
  describe('GET /api/backups', () => {
    it('should require authentication', async () => {
      const res = await request(app).get('/api/backups');
      expect(res.statusCode).toBe(401);
    });
    
    it('should require admin role', async () => {
      const res = await request(app)
        .get('/api/backups')
        .set('Authorization', `Bearer ${regularToken}`);
      
      expect(res.statusCode).toBe(403);
    });
    
    it('should return list of backups for admin users', async () => {
      // Mock the listBackups function
      const mockBackups = [
        {
          name: 'backup1.gz',
          database: 'testdb',
          timestamp: new Date(),
          created: new Date(),
          size: 1048576, // 1 MB
          path: '/backups/backup1.gz',
          isDirectory: false
        }
      ];
      backup.listBackups.mockReturnValue(mockBackups);
      
      const res = await request(app)
        .get('/api/backups')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.count).toBe(1);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].name).toBe('backup1.gz');
      expect(res.body.data[0].sizeFormatted).toBe('1.00 MB');
      
      expect(backup.listBackups).toHaveBeenCalledTimes(1);
    });
    
    it('should handle errors', async () => {
      backup.listBackups.mockImplementation(() => {
        throw new Error('Test error');
      });
      
      const res = await request(app)
        .get('/api/backups')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(res.statusCode).toBe(500);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('Error listing backups');
    });
  });
  
  // Test POST /api/backups
  describe('POST /api/backups', () => {
    it('should create a new backup for admin users', async () => {
      // Mock the createBackup function
      backup.createBackup.mockResolvedValue('/backups/newbackup.gz');
      
      const res = await request(app)
        .post('/api/backups')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ gzip: true });
      
      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.path).toBe('/backups/newbackup.gz');
      
      expect(backup.createBackup).toHaveBeenCalledTimes(1);
      expect(backup.createBackup).toHaveBeenCalledWith({ gzip: true });
    });
    
    it('should handle custom output directory', async () => {
      backup.createBackup.mockResolvedValue('/custom/path/backup.gz');
      
      const res = await request(app)
        .post('/api/backups')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ outputDir: '/custom/path', gzip: true });
      
      expect(res.statusCode).toBe(201);
      expect(backup.createBackup).toHaveBeenCalledWith({ 
        outputDir: '/custom/path', 
        gzip: true 
      });
    });
    
    it('should handle errors during backup creation', async () => {
      backup.createBackup.mockRejectedValue(new Error('Backup failed'));
      
      const res = await request(app)
        .post('/api/backups')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ gzip: true });
      
      expect(res.statusCode).toBe(500);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('Error creating backup');
    });
  });
  
  // Test POST /api/backups/restore
  describe('POST /api/backups/restore', () => {
    it('should restore a backup for admin users', async () => {
      backup.restoreBackup.mockResolvedValue();
      
      const res = await request(app)
        .post('/api/backups/restore')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ backupPath: '/backups/backup1.gz' });
      
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Database restored successfully');
      
      expect(backup.restoreBackup).toHaveBeenCalledWith({ 
        backupPath: '/backups/backup1.gz', 
        drop: false 
      });
    });
    
    it('should require a backup path', async () => {
      const res = await request(app)
        .post('/api/backups/restore')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});
      
      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('Backup path is required');
      
      expect(backup.restoreBackup).not.toHaveBeenCalled();
    });
    
    it('should handle errors during restore', async () => {
      backup.restoreBackup.mockRejectedValue(new Error('Restore failed'));
      
      const res = await request(app)
        .post('/api/backups/restore')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ backupPath: '/backups/backup1.gz' });
      
      expect(res.statusCode).toBe(500);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('Error restoring backup');
    });
  });
  
  // Test POST /api/backups/scheduled
  describe('POST /api/backups/scheduled', () => {
    it('should run scheduled backup for admin users', async () => {
      scheduleBackup.runScheduledBackup.mockResolvedValue('/backups/scheduled.gz');
      
      const res = await request(app)
        .post('/api/backups/scheduled')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ retentionDays: 7, maxBackups: 5 });
      
      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.path).toBe('/backups/scheduled.gz');
      
      expect(scheduleBackup.runScheduledBackup).toHaveBeenCalledWith({
        retentionDays: 7,
        maxBackups: 5,
        gzip: true
      });
    });
    
    it('should use default options if not provided', async () => {
      scheduleBackup.runScheduledBackup.mockResolvedValue('/backups/scheduled.gz');
      
      const res = await request(app)
        .post('/api/backups/scheduled')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});
      
      expect(res.statusCode).toBe(201);
      expect(scheduleBackup.runScheduledBackup).toHaveBeenCalledWith({
        retentionDays: 7,
        maxBackups: 10,
        gzip: true
      });
    });
    
    it('should handle errors during scheduled backup', async () => {
      scheduleBackup.runScheduledBackup.mockRejectedValue(new Error('Schedule failed'));
      
      const res = await request(app)
        .post('/api/backups/scheduled')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});
      
      expect(res.statusCode).toBe(500);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('Error running scheduled backup');
    });
  });
  
  // Test DELETE /api/backups/:name
  describe('DELETE /api/backups/:name', () => {
    it('should delete a backup for admin users', async () => {
      // Mock the listBackups function
      const mockBackups = [
        {
          name: 'backup1.gz',
          database: 'testdb',
          timestamp: new Date(),
          created: new Date(),
          size: 1048576,
          path: '/backups/backup1.gz',
          isDirectory: false
        }
      ];
      backup.listBackups.mockReturnValue(mockBackups);
      fs.unlinkSync.mockReturnValue(undefined);
      
      const res = await request(app)
        .delete('/api/backups/backup1.gz')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Backup deleted successfully');
      
      expect(backup.listBackups).toHaveBeenCalledTimes(1);
      expect(fs.unlinkSync).toHaveBeenCalledWith('/backups/backup1.gz');
    });
    
    it('should delete a directory backup', async () => {
      const mockBackups = [
        {
          name: 'backup_dir',
          database: 'testdb',
          timestamp: new Date(),
          created: new Date(),
          size: 1048576,
          path: '/backups/backup_dir',
          isDirectory: true
        }
      ];
      backup.listBackups.mockReturnValue(mockBackups);
      fs.rmSync.mockReturnValue(undefined);
      
      const res = await request(app)
        .delete('/api/backups/backup_dir')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(res.statusCode).toBe(200);
      expect(fs.rmSync).toHaveBeenCalledWith('/backups/backup_dir', { 
        recursive: true, 
        force: true 
      });
    });
    
    it('should handle backup not found', async () => {
      backup.listBackups.mockReturnValue([]);
      
      const res = await request(app)
        .delete('/api/backups/nonexistent.gz')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('Backup not found');
      
      expect(fs.unlinkSync).not.toHaveBeenCalled();
      expect(fs.rmSync).not.toHaveBeenCalled();
    });
    
    it('should handle errors during delete', async () => {
      const mockBackups = [
        {
          name: 'backup1.gz',
          database: 'testdb',
          timestamp: new Date(),
          created: new Date(),
          size: 1048576,
          path: '/backups/backup1.gz',
          isDirectory: false
        }
      ];
      backup.listBackups.mockReturnValue(mockBackups);
      fs.unlinkSync.mockImplementation(() => {
        throw new Error('Delete failed');
      });
      
      const res = await request(app)
        .delete('/api/backups/backup1.gz')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(res.statusCode).toBe(500);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('Error deleting backup');
    });
  });
}); 