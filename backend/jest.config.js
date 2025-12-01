module.exports = {
  testEnvironment: 'node',
  // Load env vars before any modules are imported
  setupFiles: ['<rootDir>/tests/jest.env.js'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  testMatch: [
    '<rootDir>/tests/**/*.test.js',
  ],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/database/**',
    '!src/config/**',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  verbose: true,
  forceExit: true,
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
};
