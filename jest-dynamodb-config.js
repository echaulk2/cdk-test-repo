module.exports = {
    tables: [
      {
        TableName: 'dynamoDB-test-table',
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