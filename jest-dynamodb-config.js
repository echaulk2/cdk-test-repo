process.env['DYNAMO_DB_TEST_TABLE'] = 'dynamoDB-test-table';
module.exports = {
    tables: [
      {
        TableName: process.env.DYNAMO_DB_TEST_TABLE,
        KeySchema: [
          {AttributeName: 'userID', KeyType: 'HASH'},
          {AttributeName: 'gameName', KeyType: 'RANGE'},
        ],
        AttributeDefinitions: [
          {AttributeName: 'userID', AttributeType: 'S'},
          {AttributeName: 'gameName', AttributeType: 'S'}    
        ],
        ProvisionedThroughput: {ReadCapacityUnits: 1, WriteCapacityUnits: 1},
      }
    ],
  };