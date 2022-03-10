import { Game } from "../models/game";
import { createGame, modifyGame, deleteGame, getGame } from "./gameManager";
import { Collection } from "../models/collection";
import { createGamePriceData, deleteGamePriceData, modifyGamePriceData } from "./gamePriceDataManager";
import * as Config from "../shared/config/config"
import * as Common from "../shared/common/collection";
import { CollectionError } from "../error/collectionErrorHandler";
import * as Interfaces from "../shared/interfaces/interfaces";
let paginatedData = [] as any;

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
    paginatedData = [];
    await getPaginatedData(params);     
    let gameList = [] as any
    if (paginatedData.length > 0) {
      for (let game of paginatedData) {
        let returnedGame = await Common.deserializeDynamoCollection(game);
        gameList.push(returnedGame);
      };     
    }
    return gameList; 
  } catch (err: any) {
    throw err;
  }
}

export async function getAllCollectionItems(collectionType: string) {
  let params = {
    TableName: Config.table,
    IndexName: "itemTypeIndex",
    KeyConditionExpression: "#itemType = :itemType",
    ExpressionAttributeNames: {
      "#itemType": "itemType"
    },
    ExpressionAttributeValues: {
      ":itemType": `[CollectionItem]#[${collectionType}]#[GameItem]`
    }
  };
  
  try {
    paginatedData = [];
    await getPaginatedData(params);
    if (paginatedData.length > 0) {
      for (let game of paginatedData) {
        let returnedGame = await Common.monitorRunningPrice(game);
        await Common.sendRunningPriceNotification(returnedGame);
      };     
    }
  } catch (err: any) {    
    throw err;
  }
}

export async function addGameToCollection(game: Game, collection: Collection) {
  try {
    let response = await createGame(game);
    await createGamePriceData(game);
    let updatedCollection = await getCollection(collection);
    return updatedCollection;
  } catch (err: any) {
    throw err;
  }
}

export async function modifyGameInCollection(game: Game, collection: Collection) {
  try {
    let response = await modifyGame(game);
    await modifyGamePriceData(game);
    let updatedCollection = await getCollection(collection);
    return updatedCollection;
  } catch (err: any) {
    throw err;
  }
}
export async function removeGameFromCollection(game: Game, collection: Collection) {
  try {
    let response = await deleteGame(game);
    await deleteGamePriceData(game);
    let updatedCollection = await getCollection(collection);
    return updatedCollection;
  } catch (err: any) {
    throw err;
  }
}

async function getPaginatedData(params: Interfaces.ICollecionParams) : Promise<Function | undefined> {
  try {
    let response = await Config.docClient.query(params).promise();
    if(response['Items'].length > 0) {
      paginatedData = [...paginatedData, ...response['Items']];
    }
    if (response.LastEvaluatedKey) {
      params.ExclusiveStartKey = response.LastEvaluatedKey;
      return await getPaginatedData(params);
    } else {
      return;
    }
  } catch(err: any) {
    switch(err.code) {
      case ("ConditionalCheckFailedException"):
        throw new CollectionError("Unable to get retrieve collection.  Conditional Check Failed.", 400);
      default:
        throw err;
    }
  }
}