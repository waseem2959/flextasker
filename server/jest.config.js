/** @type {import('jest').Config} */
const config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/*.test.ts'],
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest'
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  // Automatically clear mock calls and instances between every test
  clearMocks: true,
  // Indicates whether the coverage information should be collected while executing the test
  collectCoverage: false,
  // The directory where Jest should output its coverage files
  coverageDirectory: "coverage",
  // Mock the reset-metrics module to prevent test interference
  moduleNameMapper: {
    "^../utils/monitoring/reset-metrics$": "<rootDir>/src/tests/mocks/reset-metrics-mock.ts"
  }
};

module.exports = config;
