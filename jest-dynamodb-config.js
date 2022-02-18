process.env['DYNAMO_DB_TEST_TABLE'] = 'dynamoDB-test-table';
module.exports = {
    tables: [
      {
        TableName: process.env.DYNAMO_DB_TEST_TABLE,
        KeySchema: [
          {AttributeName: 'partitionKey', KeyType: 'HASH'},
          {AttributeName: 'sortKey', KeyType: 'RANGE'},
        ],
        AttributeDefinitions: [
          {AttributeName: 'partitionKey', AttributeType: 'S'},
          {AttributeName: 'sortKey', AttributeType: 'S'}    
        ],
        ProvisionedThroughput: {ReadCapacityUnits: 1, WriteCapacityUnits: 1},
      }
    ],
  };