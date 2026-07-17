import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: '.',
  testMatch: [
    '<rootDir>/test/**/*.spec.ts',
    '<rootDir>/test/**/*.int-spec.ts',
  ],
  moduleNameMapper: {
    '^@whatdo/shared$': '<rootDir>/../shared/src',
    '^@whatdo/shared/(.*)$': '<rootDir>/../shared/src/$1',
  },
  transform: {
    '^.+\.ts$': ['ts-jest', {
      tsconfig: 'tsconfig.spec.json',
    }],
  },
  moduleFileExtensions: ['ts', 'js', 'json'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/main.ts',
    '!src/seed.ts',
  ],
};

export default config;
