module.exports = {
  preset: "@shelf/jest-dynamodb",  
  testEnvironment: 'node',
  roots: ['<rootDir>/test'],
  testMatch: ['**/*.test.ts'],
  transform: {
    '^.+\\.tsx?$': 'babel-jest',
  },
};
