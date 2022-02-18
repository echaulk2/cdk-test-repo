import { Game } from "../models/game";
import { createGame, modifyGame, deleteGame } from "./gameManager";
import { Collection } from "../models/collection";
import * as Interfaces from "../shared/interfaces/interfaces";
import * as Config from "../shared/config/config"
import * as Common from "../shared/common/game"

export async function getCollection(collection: Collection) : Promise<[Game]> {
  let params = {
    TableName: Config.table,
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
    let response = await Config.docClient.query(params).promise();      
    let gameList = [] as any
    response.Items.forEach((game: Interfaces.IDynamoObject) => {
      let returnedGame = Common.serializeDynamoResponse(game);
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
    let updatedCollection = await getCollection(collection);
    return updatedCollection;
  } catch (err: any) {
    throw err;
  }
}

export async function modifyGameInCollection(game: Game, collection: Collection) {
  try {
    let response = await modifyGame(game);
    let updatedCollection = await getCollection(collection);
    return updatedCollection;
  } catch (err: any) {
    throw err;
  }
}
export async function removeGameFromCollection(game: Game, collection: Collection) {
  try {
    let response = await deleteGame(game);
    let updatedCollection = await getCollection(collection);
    return updatedCollection;
  } catch (err: any) {
    throw err;
  }
}
