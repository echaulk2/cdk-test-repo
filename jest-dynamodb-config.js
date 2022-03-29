process.env['DYNAMO_DB_TEST_TABLE'] = 'dynamoDB-test-table';
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
          {AttributeName: 'collectionID', AttributeType: 'S'},
          {AttributeName: 'itemType', AttributeType: 'S'},                        
        ],
        GlobalSecondaryIndexes: [ 
            { 
                IndexName: 'collectionIDIndex', 
                KeySchema: [
                    {
                        AttributeName: 'collectionID',
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
  };