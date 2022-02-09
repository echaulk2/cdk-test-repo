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
import { createGame, modifyGame, deleteGame, IDynamoObject, serializeDynamoResponse } from "./gameManager";
import { Collection } from "./collection";

export async function getCollection(collection: Collection) : Promise<[Game]> {
  let params = {
    TableName: table,
    KeyConditionExpression: `#partitionKey = :partitionKey AND begins_with(sortKey, :sortKey)`,
    ExpressionAttributeNames: {
        "#partitionKey": "partitionKey",
    },
    ExpressionAttributeValues: {
        ":partitionKey": collection.partitionKey,
        ":sortKey": `[CollectionItem]#[${collection.collectionType}]#[GameItem]`
    }
  };
  
  try {
    let response = await docClient.query(params).promise();      
    let gameList = [] as any
    response.Items.forEach((game: IDynamoObject) => {
      let returnedGame = serializeDynamoResponse(game);
      gameList.push(returnedGame);
    });
    return gameList;
  } catch (err: any) {
    throw err;
  }
}

export async function addGameToCollection(game: Game, collection: Collection) {
  try {
    let response = await createGame(game);
    let updatedCollection = getCollection(collection);
    return updatedCollection;
  } catch (err: any) {
    throw err;
  }
}

export async function modifyGameInCollection(game: Game, collection: Collection) {
  try {
    let response = await modifyGame(game);
    let updatedCollection = getCollection(collection);
    return updatedCollection;
  } catch (err: any) {
    throw err;
  }
}
export async function removeGameFromCollection(game: Game, collection: Collection) {
  try {
    let response = await deleteGame(game);
    let updatedCollection = getCollection(collection);
    return updatedCollection;
  } catch (err: any) {
    throw err;
  }
}