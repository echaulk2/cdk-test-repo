const AWS = require('aws-sdk');
const isTest = process.env.JEST_WORKER_ID;
const config = {
  convertEmptyValues: true,
  ...(isTest && {
    endpoint: 'localhost:8000',
    sslEnabled: false,
    region: 'local-env',
  }),
};
const docClient = new AWS.DynamoDB.DocumentClient(config);
const table = (isTest) ? process.env.DYNAMO_DB_TEST_TABLE : process.env.DYNAMO_DB_GAME_TABLE;
import { Game } from "./game";
import { Collection } from "./collection";
import { CollectionError } from "./collectionErrorHandler";

export async function getCollection(userID: string, collectionType: string) : Promise<Collection> {
    let sortKey = `[${userID}]#[collection]#[${collectionType}]`;
    let params = {
      TableName: table,
      Key: {
        userID: userID,
        sortKey: sortKey
      },
      KeyConditionExpression: `sortKey = ${sortKey} AND userID = ${userID}`,
      ConditionExpression: 'attribute_exists(sortKey) and attribute_exists(userID)'
    }
    
    try {
      let response = await docClient.get(params).promise();
      let collection = serializeDynamoCollectionResponse(response.Item);
      return collection;
    } catch (err: any) {
      //Dynamo returns an empty object if the get can't find a record.
      //Not sure how to handle this since the documentClient doesn't throw an error
      if (err.message == "Cannot read property 'userID' of undefined") {
        throw new CollectionError("Unable to find collection", 404);
      }
      throw err
    }
}

export async function addGameToCollection(game: Game, collection: Collection) : Promise<Collection> {
    collection.addGame(game);
    let games = collection.games;
    let params = {
        TableName: table,
        Key: {
          userID: collection.userID,
          sortKey: collection.sortKey
        },
        KeyConditionExpression: `sortKey = ${collection.sortKey} AND userID = ${collection.userID}`,
        UpdateExpression: `SET #games = :games`,
        ExpressionAttributeNames: {
            "#games": "games"
        },
        ExpressionAttributeValues: {
            ":games": games
        },
        ConditionExpression: 'attribute_exists(sortKey) and attribute_exists(userID)',
        ReturnValues: 'ALL_NEW'
      }
      
      try {
        let response = await docClient.update(params).promise();
        let updatedCollection = await getCollection(collection.userID, 'wishlist');
        return updatedCollection;
      } catch (err: any) {
          console.log(err);
        //Throws an error if a collection does not already exist.
        if (err.message == "The conditional request failed") {
          throw new CollectionError("Unable to find collection.", 404);
        }
        throw err
      }
}

export async function removeGameFromCollection(game: Game, collection: Collection) : Promise<Collection> {
    collection.removeGame(game);
    let params = {
        TableName: table,
        Key: {
          userID: collection.userID,
          sortKey: collection.sortKey
        },
        KeyConditionExpression: `sortKey = ${collection.sortKey} AND userID = ${collection.userID}`,
        UpdateExpression: `SET #games = :games`,
        ExpressionAttributeNames: {
            "#games": "games"
        },
        ExpressionAttributeValues: {
            ":games": collection.games
        },
        ConditionExpression: 'attribute_exists(sortKey) and attribute_exists(userID)',
        ReturnValues: 'ALL_NEW'
      }
      
      try {
        let response = await docClient.update(params).promise();
        let updatedCollection = await getCollection(collection.userID, 'wishlist');
        return updatedCollection;
      } catch (err: any) {
          console.log(err);
        //Throws an error if a collection does not already exist.
        if (err.message == "The conditional request failed") {
          throw new CollectionError("Unable to find collection.", 404);
        }
        throw err
      }
}

export interface ICollectionObject {
    userID: string,
    collectionType: string,
    games?: Game[]
}

export function serializeDynamoCollectionResponse(data: ICollectionObject) : Collection {
   let collection = new Collection(data.userID, data.collectionType, data?.games);
   return collection;
}
