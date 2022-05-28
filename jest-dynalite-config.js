process.env['DYNAMO_DB_TEST_TABLE'] = 'dynamoDB-test-table';
//process.env['ODB_ENDPOINT'] = 'dynamoDB-test-table';
process.env['PRICE_DATA_TEST_URL'] = './test/test.html';
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
          {AttributeName: 'sortKey', AttributeType: 'S'},
          {AttributeName: 'GS1', AttributeType: 'S'},
          {AttributeName: 'itemType', AttributeType: 'S'},                        
        ],
        GlobalSecondaryIndexes: [ 
            { 
                IndexName: 'GSI-1', 
                KeySchema: [
                    {
                        AttributeName: 'GS1',
                        KeyType: 'HASH',
                    }
                ],
                ProvisionedThroughput: {ReadCapacityUnits: 1, WriteCapacityUnits: 1},
                Projection: {ProjectionType: "ALL"}
            },
            { 
              IndexName: 'GSI-2', 
              KeySchema: [
                  {
                      AttributeName: 'partitionKey',
                      KeyType: 'HASH',
                  },
                  {
                    AttributeName: 'GS1',
                    KeyType: 'RANGE',
                  }
              ],
              ProvisionedThroughput: {ReadCapacityUnits: 1, WriteCapacityUnits: 1},
              Projection: {ProjectionType: "ALL"}
            },
            { 
              IndexName: 'itemTypeIndex', 
              KeySchema: [
                  {
                      AttributeName: 'itemType',
                      KeyType: 'HASH',
                  },
                  {
                    AttributeName: 'sortKey',
                    KeyType: 'RANGE',
                  }
              ],
              ProvisionedThroughput: {ReadCapacityUnits: 1, WriteCapacityUnits: 1},
              Projection: {ProjectionType: "ALL"}
          },
          
        ],
        ProvisionedThroughput: {ReadCapacityUnits: 1, WriteCapacityUnits: 1},
      }
    ],
    basePort: 8001,
  };
