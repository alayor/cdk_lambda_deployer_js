module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/cdk_lib'],
  testMatch: ['**/*.test.ts'],
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
  moduleNameMapper: {
    '^cdk_lib/(.*)': '<rootDir>/cdk_lib/$1',
    '^js_lib/(.*)': '<rootDir>/js_lib/$1',
  },
}
