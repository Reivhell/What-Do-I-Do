const { pathsToModuleNameMapper } = require('ts-jest');

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/test'],
  testMatch: ['**/*.spec.ts'],
  moduleFileExtensions: ['ts', 'js', 'json', 'node'],
  collectCoverageFrom: [
    'src/modules/**/*.ts',
    'src/common/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/*.spec.ts',
    '!src/**/*.e2e-spec.ts',
    '!src/main.ts',
    '!src/app.module.ts',
    '!src/seed.ts',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 70,
      lines: 70,
      statements: 70,
    },
    './src/modules/settings/': {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
    './src/common/backup/': {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  moduleNameMapper: pathsToModuleNameMapper({
    '@whatdo/*': ['src/*'],
    '@whatdo/common/*': ['src/common/*'],
    '@whatdo/modules/*': ['src/modules/*'],
    '@whatdo/drizzle/*': ['src/drizzle/*'],
    '@whatdo/test/*': ['test/*'],
  }, {
    prefix: '<rootDir>/',
  }),
  setupFilesAfterEnv: ['<rootDir>/test/setup.ts'],
  testTimeout: 30000,
  verbose: true,
  forceExit: true,
  detectOpenHandles: true,
};
