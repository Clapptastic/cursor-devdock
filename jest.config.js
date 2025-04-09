module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.js', '**/?(*.)+(spec|test).js'],
  collectCoverage: true,
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/*.test.js',
    '!**/node_modules/**',
    '!**/vendor/**'
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },
  testTimeout: 10000,
  // Configure test groups (projects)
  projects: [
    {
      displayName: 'backend',
      testMatch: ['<rootDir>/src/tests/backend/**/*.test.js'],
      testEnvironment: 'node'
    },
    {
      displayName: 'database',
      testMatch: ['<rootDir>/src/tests/database/**/*.test.js'],
      testEnvironment: 'node',
      setupFilesAfterEnv: ['<rootDir>/src/tests/database/setup.js']
    },
    {
      displayName: 'utils',
      testMatch: ['<rootDir>/src/tests/utils/**/*.test.js'],
      testEnvironment: 'node'
    }
  ]
}; 