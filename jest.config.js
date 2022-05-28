module.exports = {
  //preset: "@shelf/jest-dynamodb", 
  preset: "ts-jest",
  testEnvironment: 'node',
  roots: ['<rootDir>'],
  testMatch: ['**/*.test.ts'],
  globalSetup: `./globalSetup.js`,
  globalTeardown: `./globalTeardown.js`,
};