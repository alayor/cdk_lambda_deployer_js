module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/cld_deploy'],
  testMatch: ['**/*.test.ts'],
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
  moduleNameMapper: {
    '^cld_deploy/(.*)': '<rootDir>/cld_deploy/$1',
    '^cld_build/(.*)': '<rootDir>/cld_build/$1',
  },
}
