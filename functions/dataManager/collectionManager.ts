import { Game } from "../models/game";
import { Collection } from "../models/collection";
import * as Config from "../shared/config/config"
import * as Common from "../shared/common/collection";
import * as CommonGame from "../shared/common/game";
import { GameError } from "../error/gameErrorHandler";

export async function getAllGamesInCollection(collection: Collection) : Promise<[Game]> {
  let params = {
    TableName: Config.table,
    IndexName: "collectionIDIndex",
    KeyConditionExpression: "#collectionID = :collectionID and begins_with(#sortKey, :sortKey)",
    ExpressionAttributeNames: {
      "#collectionID": "collectionID",
      "#sortKey": "sortKey"
    },
    ExpressionAttributeValues: {
      ":collectionID": collection.collectionID,
      ":sortKey": `[CollectionItem]#[${collection.collectionType}]#[GameItem]#[${collection.userID}]`
    }
  };
  let paginatedData = await CommonGame.getPaginatedData(params);   
  let gameList = [] as any
  if (paginatedData.length > 0) {
    for (let game of paginatedData) {
      let returnedGame = await Common.deserializeDynamoCollection(game, collection);
      gameList.push(returnedGame);
    };     
  }
  return gameList;
}

export async function getAllGamesByCollectionType(collectionType: string) : Promise<[Game]> {
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

  let paginatedData = await CommonGame.getPaginatedData(params);
  let gameList = [] as any;
  if (paginatedData.length > 0) {
    for (let game of paginatedData) {
      let collection = new Collection(game.userID, collectionType);
      let returnedGame = await Common.deserializeDynamoCollection(game, collection);
      gameList.push(returnedGame);
    };     
  }
  return gameList;
}

export async function addGameToCollection(game: Game, collection: Collection) {
  try {
    let params = {
      TableName: Config.table,
      Item: {
        partitionKey: game.id,
        sortKey: `[CollectionItem]#[${collection.collectionType}]#[GameItem]#[${game.userID}]#[${game.id}]`,
        id: game.id,
        collectionID: collection.collectionID,
        gameName: game.gameName,        
        itemType: `[CollectionItem]#[${collection.collectionType}]#[GameItem]`,
        userID: game.userID,
        email: game.email,  
        genre: game.genre,
        yearReleased: game.yearReleased,
        developer: game.developer,
        console: game.console
      },
      ConditionExpression: 'attribute_not_exists(partitionKey) AND attribute_not_exists(sortKey)'
    }
    let response = await Config.docClient.put(params).promise();
    let updatedCollection = await getAllGamesInCollection(collection);
    return updatedCollection;
  } catch(err: any) {
    switch (err.code) {
      case ("ConditionalCheckFailedException"):
        throw new GameError("Unable to create game.  Conditional Check Failed.");
      default:
        throw err;
    }
  }
}

export async function modifyGameInCollection(game: Game, collection: Collection) {
  let partitionKey = game.id;
  let sortKey = `[CollectionItem]#[${collection.collectionType}]#[GameItem]#[${game.userID}]#[${game.id}]`; 
  let template = await CommonGame.generateModifyExpression(game);

  let params = {
    TableName: Config.table,
    Key: {
      partitionKey: partitionKey,
      sortKey: sortKey,
    },
    KeyConditionExpression: `partitionKey = ${partitionKey} and sortKey = ${sortKey}`,
    UpdateExpression: `SET ${template.updateExpression.join(",")}`,
    ExpressionAttributeNames: template.expressionAttributeNames,
    ExpressionAttributeValues: template.expressionAttributeValues,
    ConditionExpression: 'attribute_exists(partitionKey) and attribute_exists(sortKey)',
    ReturnValues: 'ALL_NEW'
  };

  try {
    let response = await Config.docClient.update(params).promise();
    let updatedCollection = await getAllGamesInCollection(collection);
    return updatedCollection;
  } catch (err: any) {
    switch (err.code) {
      case ("ConditionalCheckFailedException"):
        throw new GameError("Unable to modify game.  Conditional Check Failed.");
      default:
        throw err;
    }
  }
}

export async function removeGameFromCollection(game: Game, collection: Collection) {
  let partitionKey = game.id;
  let sortKey = `[CollectionItem]#[${collection.collectionType}]#[GameItem]#[${game.userID}]#[${game.id}]`;
  let params = {
    TableName: Config.table,
    Key: {
      partitionKey: partitionKey,
      sortKey: sortKey
    },
    KeyConditionExpression: `partitionKey = ${partitionKey} AND sortKey = ${sortKey}`,
    ConditionExpression: 'attribute_exists(partitionKey) and attribute_exists(sortKey)',
    ReturnValues: 'ALL_OLD'
  };

  try {
    let response = await Config.docClient.delete(params).promise();
    let updatedCollection = await getAllGamesInCollection(collection);
    return updatedCollection;     
  } catch (err: any) {
    switch (err.code) {
      case ("ConditionalCheckFailedException"):
        throw new GameError("Unable to delete game.  Conditional Check Failed.");
      default:
        throw err;
    }
  }
}

export async function getGameInCollection(game: Game, collection: Collection) : Promise<Game> {
  let partitionKey = game.id;
  let sortKey = `[CollectionItem]#[${collection.collectionType}]#[GameItem]#[${game.userID}]#[${game.id}]`;

  let params = {
    TableName: Config.table,
    Key: {
      partitionKey: partitionKey,
      sortKey: sortKey
    },
    KeyConditionExpression: `partitionKey = ${partitionKey} and sortKey = ${sortKey}`
  }
  
  try {
    let response = await Config.docClient.get(params).promise();
    if (response.Item) {
      return CommonGame.deserializeGameData(response.Item);
    } else {
      throw new GameError("Unable to get game. Game not found.");
    }      
  } catch (err: any) {
    switch (err.code) {
      case ("ConditionalCheckFailedException"):
        throw new GameError("Unable to get game.  Conditional Check Failed.");
      default:
        throw err;
    }
  }
}