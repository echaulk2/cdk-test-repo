import { Game } from "../models/game";
import { GameError } from "../error/gameErrorHandler";
import * as Config from "../shared/config/config";
import * as Common from "../shared/common/game";
import * as CommonCollection from "../shared/common/collection";

  export async function createGame(game: Game): Promise<Game | undefined> {
    try {
      let params = {
        TableName: Config.table,
        Item: {
          partitionKey: game.userID,
          sortKey: `[Collection]#[${game.collectionID}]#[Game]#[${game.gameID}]`,
          GS1: game.gameID,
          gameID: game.gameID,
          gameName: game.gameName,        
          itemType: '[Game]',
          userID: game.userID,
          genre: game.genre,
          yearReleased: game.yearReleased,
          developer: game.developer,
          cover: game.cover,
          console: game.console,
          collectionID: game.collectionID
        },
        ConditionExpression: 'attribute_not_exists(partitionKey) AND attribute_not_exists(sortKey)'
      }
      let response = await Config.docClient.put(params).promise();
      let createdGame = await getGame(game);
      return createdGame;
    } catch(err: any) {
      switch (err.code) {
        case ("ConditionalCheckFailedException"):
          throw new GameError("Unable to create game.  Conditional Check Failed.");
        default:
          throw err;
      }
    }
  }

 export async function getGame(game: Game) : Promise<Game | undefined> {
    let params = {
      TableName: Config.table,
      IndexName: "GSI-2",
      KeyConditionExpression: "#partitionKey = :partitionKey AND #GS1 = :GS1",
      ExpressionAttributeNames: {
          "#partitionKey": "partitionKey",
          "#GS1": "GS1"
      },
      ExpressionAttributeValues: {
          ":partitionKey": `${game.userID}`,
          ":GS1": `${game.gameID}`
      }
    }
    
    try {
      let paginatedData = await Common.getPaginatedData(params);
      if (paginatedData.length > 0) {
        for (let item of paginatedData) {
          return CommonCollection.deserializeDynamoCollection(item);
        }
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

  export async function listGames(userID: string) : Promise<[Game]> {
    let params = {
      TableName: Config.table,
      IndexName: "GSI-2",
      KeyConditionExpression: "#partitionKey = :partitionKey AND begins_with(#GS1, :GS1)",
      ExpressionAttributeNames: {
          "#partitionKey": "partitionKey",
          "#GS1": "GS1"
      },
      ExpressionAttributeValues: {
          ":partitionKey": `${userID}`,
          ":GS1": "G-"
      }
    };
    
    let paginatedData = await Common.getPaginatedData(params);
    let gameList = [] as any;
    if (paginatedData.length > 0) {
      for (let game of paginatedData) {
        let returnedGame = Common.deserializeGameData(game);
        gameList.push(returnedGame);
      }
    }
    return gameList;
  }
  
  export async function modifyGame(game: Game) : Promise<Game | undefined>  { 
    let partitionKey = game.userID;
    let sortKey = `[Collection]#[${game.collectionID}]#[Game]#[${game.gameID}]`;
    let template = await Common.generateModifyExpression(game);

    let params = {
      TableName: Config.table,
      Key: {
        partitionKey: partitionKey,
        sortKey: sortKey,
      },
      KeyConditionExpression: `partitionKey = ${partitionKey} AND sortKey = ${sortKey}`,
      UpdateExpression: `SET ${template.updateExpression.join(",")}`,
      ExpressionAttributeNames: template.expressionAttributeNames,
      ExpressionAttributeValues: template.expressionAttributeValues,
      ConditionExpression: 'attribute_exists(partitionKey) and attribute_exists(sortKey)',
      ReturnValues: 'ALL_NEW'
    };
  
    try {
      let response = await Config.docClient.update(params).promise();
      let modifiedGame = await getGame(game);
      return modifiedGame;
    } catch (err: any) {
      switch (err.code) {
        case ("ConditionalCheckFailedException"):
          throw new GameError("Unable to modify game.  Conditional Check Failed.");
        default:
          throw err;
      }
    }
  }
  
  export async function deleteGame(game: Game) : Promise<Game | undefined>  {
    let partitionKey = game.userID;
    let sortKey = `[Collection]#[${game.collectionID}]#[Game]#[${game.gameID}]`;
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
      let game = Common.deserializeGameData(response.Attributes);
      return game;      
    } catch (err: any) {
      switch (err.code) {
        case ("ConditionalCheckFailedException"):
          throw new GameError("Unable to delete game.  Conditional Check Failed.");
        default:
          throw err;
      }
    }
  }