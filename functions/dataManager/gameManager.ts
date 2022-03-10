import { Game } from "../models/game";
import { GameError } from "../error/gameErrorHandler";
import * as Interfaces from "../shared/interfaces/interfaces";
import * as Config from "../shared/config/config";
import * as Common from "../shared/common/game";
let paginatedData = [] as any;

  export async function createGame(game: Game): Promise<Game> {
    try {
      let params = {
        TableName: Config.table,
        Item: {
          partitionKey: game.partitionKey,
          sortKey: game.sortKey,
          itemType: game.itemType,
          gameName: game.gameName,        
          email: game.email,  
          genre: game.genre,
          yearReleased: game.yearReleased,
          developer: game.developer,
          console: game.console,
          desiredCondition: game.desiredCondition,
          desiredPrice: game.desiredPrice
        },
        ConditionExpression: 'attribute_not_exists(partitionKey) AND attribute_not_exists(sortKey)'
      }
      let response = await Config.docClient.put(params).promise();
      let createdGame = await getGame(game);
      return createdGame;
    } catch(err: any) {
      switch (err.code) {
        case ("ConditionalCheckFailedException"):
          throw new GameError("Unable to create game.  Conditional Check Failed.", 400);
        default:
          throw err;
      }
    }
  }

 export async function getGame(game: Game) : Promise<Game> {
    let params = {
      TableName: Config.table,
      Key: {
        partitionKey: game.partitionKey,
        sortKey: game.sortKey
      },
      KeyConditionExpression: `sortKey = ${game.sortKey} AND partitionKey = ${game.partitionKey}`
    }
    
    try {
      let response = await Config.docClient.get(params).promise();
      if (response.Item) {
        return Common.deserializeGameData(response.Item);
      } else {
        throw new GameError("Unable to get game. Game not found.", 404);
      }      
    } catch (err: any) {
      switch (err.code) {
        case ("ConditionalCheckFailedException"):
          throw new GameError("Unable to get game.  Conditional Check Failed.", 400);
        default:
          throw err;
      }
    }
  }

  export async function listGames(userID: string) : Promise<[Game]> {
    let params = {
      TableName: Config.table,
      KeyConditionExpression: "#partitionKey = :partitionKey AND begins_with(#sortKey, :sortKey)",
      ExpressionAttributeNames: {
          "#partitionKey": "partitionKey",
          "#sortKey": "sortKey"
      },
      ExpressionAttributeValues: {
          ":partitionKey": `[User]#[${userID}]`,
          ":sortKey": "[GameItem]"
      }
    };
    
    try {
      paginatedData = [];
      await getPaginatedData(params);
      let gameList = [] as any;
      if (paginatedData.length > 0) {
        for (let game of paginatedData) {
          let returnedGame = Common.deserializeGameData(game);
          gameList.push(returnedGame);
        }
      }
      return gameList;
    } catch (err: any) {
      throw err;
    }
  }
  
  export async function modifyGame(game: Game) { 
    let template = await Common.generateModifyExpression(game);
    let params = {
      TableName: Config.table,
      Key: {
        partitionKey: game.partitionKey,
        sortKey: game.sortKey
      },
      KeyConditionExpression: `sortKey = ${game.sortKey} AND partitionKey = ${game.partitionKey}`,
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
          throw new GameError("Unable to modify game.  Conditional Check Failed.", 400);
        default:
          throw err;
      }
    }
  }
  
  export async function deleteGame(game: Game) {
    let params = {
      TableName: Config.table,
      Key: {
        partitionKey: game.partitionKey,
        sortKey: game.sortKey
      },
      KeyConditionExpression: `sortKey = ${game.sortKey} AND partitionKey = ${game.partitionKey}`,
      ConditionExpression: 'attribute_exists(sortKey) and attribute_exists(partitionKey)',
      ReturnValues: 'ALL_OLD'
    };
  
    try {
      let response = await Config.docClient.delete(params).promise();
      let game = Common.deserializeGameData(response.Attributes);
      return game;      
    } catch (err: any) {
      switch (err.code) {
        case ("ConditionalCheckFailedException"):
          throw new GameError("Unable to delete game.  Conditional Check Failed.", 400);
        default:
          throw err;
      }
    }
  }

  async function getPaginatedData(params: Interfaces.IGameParams) : Promise<Function | undefined> {
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
      switch (err.code) {
        case ("ConditionalCheckFailedException"):
          throw new GameError("Unable to get games.  Conditional Check Failed.", 400);
        default:
          throw err;
      }
    }
  }