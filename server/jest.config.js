module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.js'],
  setupFiles: ['./src/__tests__/setup.js'],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/server.js'
  ],
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50
    }
  }
};
