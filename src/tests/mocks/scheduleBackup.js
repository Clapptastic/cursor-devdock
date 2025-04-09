/**
 * Mock scheduleBackup module for testing
 */

// Run scheduled backup mock
const runScheduledBackup = jest.fn().mockImplementation((options = {}) => {
  const {
    retentionDays = 7,
    maxBackups = 10,
    outputDir = '/backups',
    gzip = true
  } = options;
  
  const timestamp = new Date().toISOString().replace(/:/g, '-');
  const ext = gzip ? '.gz' : '';
  const backupPath = `${outputDir}/scheduled-${timestamp}${ext}`;
  
  return Promise.resolve(backupPath);
});

module.exports = {
  runScheduledBackup
}; 