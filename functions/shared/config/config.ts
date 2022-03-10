export const AWS = require('aws-sdk');

export const axios = require('axios').default;

export const isTest = process.env.JEST_WORKER_ID;

export const config = {
  convertEmptyValues: true,
  ...(isTest && {
    endpoint: 'localhost:8000',
    sslEnabled: false,
    region: 'local-env',
  }),
};

export const docClient = new AWS.DynamoDB.DocumentClient(config);

export const table = (isTest) ? process.env.DYNAMO_DB_TEST_TABLE : process.env.DYNAMO_DB_GAME_TABLE;

export const priceDataURL = (isTest) ? process.env.PRICE_DATA_TEST_URL : process.env.PRICE_DATA_URL;

export const sesSourceEmailAddress = process.env.SES_SOURCE_EMAIL_ADDRESS;