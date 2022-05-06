module.exports = {
  preset: "@shelf/jest-dynamodb",  
  testEnvironment: 'node',
  roots: ['<rootDir>/test'],
  testMatch: ['**/*.test.ts'],
  transform: {
    "^.+\\.(ts|tsx)$": "ts-jest",
  }
};
