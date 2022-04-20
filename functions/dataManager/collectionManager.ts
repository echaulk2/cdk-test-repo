import { Game } from "../models/game";
import { Collection } from "../models/collection";
import * as Config from "../shared/config/config"
import * as Common from "../shared/common/collection";
import * as CommonGame from "../shared/common/game";
import { GameError } from "../error/gameErrorHandler";

export async function createCollection(collection: Collection) {
  try {
    let params = {
      TableName: Config.table,
      Item: {
        partitionKey: collection.userID,
        sortKey: `[Collection]#[${collection.collectionID}]`,
        GS1: collection.collectionID,
        collectionID: collection.collectionID,
        itemType: "[Collection]"
      },
      ConditionExpression: 'attribute_not_exists(partitionKey) AND attribute_not_exists(sortKey)'
    }
    let response = await Config.docClient.put(params).promise();
    let createdCollection = await getCollection(collection);
    return createdCollection;
  } catch(err: any) {
    switch (err.code) {
      case ("ConditionalCheckFailedException"):
        throw new GameError("Unable to create collection.  Conditional Check Failed.");
      default:
        throw err;
    }
  }
}

export async function getCollection(collection: Collection) {
  let partitionKey = collection.userID;
  let sortKey = `[Collection]#[${collection.collectionID}]`;
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
      return Common.deserializeCollection(response.Item);
    } else {
      throw new GameError("Unable to get collection. Collection not found.");
    }      
  } catch (err: any) {
    switch (err.code) {
      case ("ConditionalCheckFailedException"):
        throw new GameError("Unable to get collection.  Conditional Check Failed.");
      default:
        throw err;
    }
  }
}

export async function listCollections(userID: string) : Promise<[Game]> {
  let params = {
    TableName: Config.table,
    IndexName: "GS1-2",
    KeyConditionExpression: "#partitionKey = :partitionKey AND begins_with(#GS1, :GS1)",
    ExpressionAttributeNames: {
        "#partitionKey": "partitionKey",
        "#GS1": "GS1"
    },
    ExpressionAttributeValues: {
        ":partitionKey": `${userID}`,
        ":GS1": "Col-"
    }
  };
  
  let paginatedData = await CommonGame.getPaginatedData(params);
  let collectionList = [] as any;
  if (paginatedData.length > 0) {
    for (let game of paginatedData) {
      let returnedGame = Common.deserializeCollection(game);
      collectionList.push(returnedGame);
    }
  }
  return collectionList;
}

export async function deleteCollection(collection: Collection) {
  let partitionKey = collection.userID;
  let sortKey = `[Collection]#[${collection.collectionID}]`;
  let params = {
    TableName: Config.table,
    Key: {
      partitionKey: partitionKey,
      sortKey: sortKey
    },
    KeyConditionExpression: `partitionKey = ${partitionKey} and sortKey = ${sortKey}`,
    ConditionExpression: 'attribute_exists(partitionKey) and attribute_exists(sortKey)',
    ReturnValues: 'ALL_OLD'
  };

  try {
    let response = await Config.docClient.delete(params).promise();
    let game = Common.deserializeCollection(response.Attributes);
    return game;      
  } catch (err: any) {
    switch (err.code) {
      case ("ConditionalCheckFailedException"):
        throw new GameError("Unable to delete collection.  Conditional Check Failed.");
      default:
        throw err;
    }
  }
}
export async function getAllGamesInCollection(collection: Collection) : Promise<[Game]> {
  let params = {
    TableName: Config.table,
    IndexName: "itemTypeIndex",
    KeyConditionExpression: "#itemType = :itemType and begins_with(#sortKey, :sortKey)",
    ExpressionAttributeNames: {
      "#itemType": "itemType",
      "#sortKey": "sortKey"
    },
    ExpressionAttributeValues: {
      ":itemType": "[CollectionItem]",
      ":sortKey": `[Collection]#[${collection.collectionID}]#[Game]`
    }
  };
  let paginatedData = await CommonGame.getPaginatedData(params);   
  let gameList = [] as any
  if (paginatedData.length > 0) {
    for (let game of paginatedData) {
      let returnedGame = await Common.deserializeDynamoCollection(game);
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
      ":itemType": `[CollectionItem]`
    }
  };

  let paginatedData = await CommonGame.getPaginatedData(params);
  let gameList = [] as any;
  if (paginatedData.length > 0) {
    for (let game of paginatedData) {
      let collection = new Collection(game.userID, collectionType);
      let returnedGame = await Common.deserializeDynamoCollection(game);
      gameList.push(returnedGame);
    };     
  }
  return gameList;
}

export async function addGameToCollection(game: Game) {
  try {
    let params = {
      TableName: Config.table,
      Item: {
        partitionKey: game.userID,
        sortKey: `[Collection]#[${game.collectionID}]#[Game]#[${game.gameID}]`,
        GS1: game.gameID,
        userID: game.userID,
        gameID: game.gameID,
        collectionID: game.collectionID,
        gameName: game.gameName,        
        itemType: `[CollectionItem]`,
        genre: game.genre,
        yearReleased: game.yearReleased,
        developer: game.developer,
        console: game.console
      },
      ConditionExpression: 'attribute_not_exists(partitionKey) AND attribute_not_exists(sortKey)'
    }
    let response = await Config.docClient.put(params).promise();
    let collection = new Collection(game.userID, game.collectionID);
    let updatedCollection = await getAllGamesInCollection(collection);
    return updatedCollection;
  } catch(err: any) {
    switch (err.code) {
      case ("ConditionalCheckFailedException"):
        throw new GameError("Unable to create game.  Game already exists in collection.");
      default:
        throw err;
    }
  }
}

export async function modifyGameInCollection(game: Game) {
  let partitionKey = game.userID;
  let sortKey = `[Collection]#[${game.collectionID}]#[Game]#[${game.gameID}]`; 
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
    let collection = new Collection(game.userID, game.collectionID);
    let updatedCollection = await getAllGamesInCollection(collection);
    return updatedCollection;
  } catch (err: any) {
    switch (err.code) {
      case ("ConditionalCheckFailedException"):
        throw new GameError("Unable to modify game.  Unable to find game in collection.");
      default:
        throw err;
    }
  }
}

export async function removeGameFromCollection(game: Game) {
  let partitionKey = game.userID;
  let sortKey = `[CollectionItem]#[${game.collectionID}]#[GameItem]#[${game.gameID}]`;
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
    let collection = new Collection(game.userID, game.collectionID);
    let updatedCollection = await getAllGamesInCollection(collection);
    return updatedCollection;     
  } catch (err: any) {
    switch (err.code) {
      case ("ConditionalCheckFailedException"):
        throw new GameError("Unable to delete game.  Unable to find game in collection.");
      default:
        throw err;
    }
  }
}

export async function getGameInCollection(game: Game) : Promise<Game> {
  let partitionKey = game.userID;
  let sortKey = `[Collection]#[${game.collectionID}]#[Game]#[${game.gameID}]`;

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