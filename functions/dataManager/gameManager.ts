import { Game } from "../models/game";
import { GameError } from "../error/gameErrorHandler";
import * as Config from "../shared/config/config";
import * as Common from "../shared/common/game";

  export async function createGame(game: Game): Promise<Game> {
    try {
      let params = {
        TableName: Config.table,
        Item: {
          partitionKey: game.id,
          sortKey: `[GameItem]#[${game.userID}]#[${game.id}]`,
          id: game.id,
          gameName: game.gameName,        
          itemType: '[GameItem]',
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

 export async function getGame(game: Game) : Promise<Game> {
    let partitionKey = game.id;
    let sortKey = `[GameItem]#[${game.userID}]#[${game.id}]`;
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
        return Common.deserializeGameData(response.Item);
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
      IndexName: "userIDIndex",
      KeyConditionExpression: "#userID = :userID AND #itemType = :itemType",
      ExpressionAttributeNames: {
          "#userID": "userID",
          "#itemType": "itemType"
      },
      ExpressionAttributeValues: {
          ":userID": `${userID}`,
          ":itemType": "[GameItem]"
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
  
  export async function modifyGame(game: Game) { 
    let partitionKey = game.id
    let sortKey = `[GameItem]#[${game.userID}]#[${game.id}]`; 
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
  
  export async function deleteGame(game: Game) {
    let partitionKey = game.id;
    let sortKey = `[GameItem]#[${game.userID}]#[${game.id}]`
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