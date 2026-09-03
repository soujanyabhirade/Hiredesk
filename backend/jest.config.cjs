/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',

  testEnvironment: 'node',

  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: './tsconfig.spec.json',
      },
    ],
  },

  /*
   * Source files use ESM-style .js imports:
   *
   *   import { AuthService } from './auth.service.js';
   *
   * During Jest tests, remove only the .js extension.
   *
   * Jest will then resolve:
   *
   *   ./auth.service
   *
   * to:
   *
   *   ./auth.service.ts
   *
   * For node_modules JavaScript files, Jest can resolve the
   * extensionless path back to their actual .js file.
   */
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },

  testMatch: ['<rootDir>/src/**/*.spec.ts'],

  moduleFileExtensions: ['ts', 'js', 'json'],

  clearMocks: true,

  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.spec.ts',
    '!src/**/*.d.ts',
  ],
};