import { Game } from "../models/game";
import { GameError } from "../error/gameErrorHandler";
import { getPriceData } from "./priceDataManager";
import * as Interfaces from "../shared/interfaces/interfaces";
import * as Config from "../shared/config/config";
import * as Common from "../shared/common/game";

  export async function createGame(game: Game): Promise<Game> {
    try {
      let params = {
        TableName: Config.table,
        Item: {
          partitionKey: game.partitionKey,
          sortKey: game.sortKey,
          gameName: game.gameName,          
          genre: game.genre,
          yearReleased: game.yearReleased,
          developer: game.developer,
          console: game.console,
          desiredCondition: game.desiredCondition,
          desiredPrice: game.desiredPrice,
          gamePriceData: (game.desiredPrice) ? await getPriceData(game) : undefined
        },
        ConditionExpression: 'attribute_not_exists(partitionKey) AND attribute_not_exists(sortKey)'
      }
      let response = await Config.docClient.put(params).promise();
      let createdGame = await getGame(game);             
      return game;
    } catch(err: any) {
      throw new GameError(err.message, err.statusCode);
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
      let game = Common.serializeDynamoResponse(response.Item);
      return game;
    } catch (err: any) {
      //Dynamo returns an empty object if the get can't find a record.
      //Not sure how to handle this since the documentClient doesn't throw an error
      if (err.message == "Cannot read property 'partitionKey' of undefined") {
        throw new GameError("Unable to find game.", 404);
      }
      throw err
    }
  }

  export async function listGames(userID: string) : Promise<[Game]> {
    let params = {
      TableName: Config.table,
      KeyConditionExpression: "#partitionKey = :partitionKey AND begins_with(sortKey, :sortKey)",
      FilterExpression: "attribute_exists(gameName)",
      ExpressionAttributeNames: {
          "#partitionKey": "partitionKey",
      },
      ExpressionAttributeValues: {
          ":partitionKey": `[User]#[${userID}]`,
          ":sortKey": "[GameItem]"
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
      throw err
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
      if (err.message == "The conditional request failed") {
        throw new GameError("Unable to modify game.", 400);
      }
      throw err;
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
      let game = Common.serializeDynamoResponse(response.Attributes);
      return game;      
    } catch (err: any) {
      if (err.message == "The conditional request failed") {
        throw new GameError("Unable to delete game.", 400);
      }
      throw err;
    }
  }