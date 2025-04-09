/**
 * Mock backup module for testing
 */

// List backups mock
const listBackups = jest.fn().mockImplementation((directory) => {
  return [
    {
      name: 'test-backup-1.gz',
      database: 'test_db',
      timestamp: new Date('2023-08-01T12:00:00Z'),
      created: new Date('2023-08-01T12:00:00Z'),
      size: 1048576, // 1 MB
      path: '/backups/test-backup-1.gz',
      isDirectory: false
    },
    {
      name: 'test-backup-2.gz',
      database: 'test_db',
      timestamp: new Date('2023-08-02T12:00:00Z'),
      created: new Date('2023-08-02T12:00:00Z'),
      size: 2097152, // 2 MB
      path: '/backups/test-backup-2.gz',
      isDirectory: false
    },
    {
      name: 'test-backup-dir',
      database: 'test_db',
      timestamp: new Date('2023-08-03T12:00:00Z'),
      created: new Date('2023-08-03T12:00:00Z'),
      size: 3145728, // 3 MB
      path: '/backups/test-backup-dir',
      isDirectory: true
    }
  ];
});

// Create backup mock
const createBackup = jest.fn().mockImplementation((options = {}) => {
  const { outputDir = '/backups', gzip = true } = options;
  const timestamp = new Date().toISOString().replace(/:/g, '-');
  const ext = gzip ? '.gz' : '';
  const backupPath = `${outputDir}/test_db-${timestamp}${ext}`;
  return Promise.resolve(backupPath);
});

// Restore backup mock
const restoreBackup = jest.fn().mockImplementation((options = {}) => {
  const { backupPath, drop = false } = options;
  if (!backupPath) {
    return Promise.reject(new Error('Backup path is required'));
  }
  return Promise.resolve();
});

module.exports = {
  listBackups,
  createBackup,
  restoreBackup
}; 