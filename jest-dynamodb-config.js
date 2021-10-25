process.env['DYNAMO_DB_TEST_TABLE'] = 'dynamoDB-test-table';
module.exports = {
    tables: [
      {
        TableName: process.env.DYNAMO_DB_TEST_TABLE,
        KeySchema: [
          {AttributeName: 'gameName', KeyType: 'HASH'},
        ],        
        AttributeDefinitions: [
          {AttributeName: 'gameName', AttributeType: 'S'}    
        ],
        ProvisionedThroughput: {ReadCapacityUnits: 1, WriteCapacityUnits: 1},
      }
    ],
  };