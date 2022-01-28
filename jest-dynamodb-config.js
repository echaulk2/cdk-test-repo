process.env['DYNAMO_DB_TEST_TABLE'] = 'dynamoDB-test-table';
module.exports = {
    tables: [
      {
        TableName: process.env.DYNAMO_DB_TEST_TABLE,
        KeySchema: [
          {AttributeName: 'userID', KeyType: 'HASH'},
          {AttributeName: 'sortKey', KeyType: 'RANGE'},
        ],
        AttributeDefinitions: [
          {AttributeName: 'userID', AttributeType: 'S'},
          {AttributeName: 'sortKey', AttributeType: 'S'}    
        ],
        ProvisionedThroughput: {ReadCapacityUnits: 1, WriteCapacityUnits: 1},
      }
    ],
  };