import type { Config } from 'jest';

const config: Config = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testEnvironment: 'node',

  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: 'tsconfig.json' }],
  },

  testRegex: '.*\\.spec\\.ts$',

  moduleNameMapper: {
    '^(.+)\\.js$': '$1',
  },

  collectCoverageFrom: ['src/**/*.ts'],
  coverageDirectory: './coverage',

  clearMocks: true,
};

export default config;