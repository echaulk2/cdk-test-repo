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
import { Game } from "../models/game";
import { GameError } from "../error/gameErrorHandler";
import { getLowestPriceData } from "./runningPriceDataManager";
import * as Interfaces from "../interfaces/interfaces";

  export async function createGame(game: Game): Promise<Game> {
    try {
      let params = {
        TableName: table,
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
          lowestRunningPrice: (game.desiredPrice) ? await getLowestPriceData(game) : undefined
        },
        ConditionExpression: 'attribute_not_exists(partitionKey) AND attribute_not_exists(sortKey)'
      }
      let response = await docClient.put(params).promise();
      let createdGame = await getGame(game);             
      return game;
    } catch(err: any) {
      throw new GameError(err.message, err.statusCode);
    }
  }

 export async function getGame(game: Game) : Promise<Game> {
    let params = {
      TableName: table,
      Key: {
        partitionKey: game.partitionKey,
        sortKey: game.sortKey
      },
      KeyConditionExpression: `sortKey = ${game.sortKey} AND partitionKey = ${game.partitionKey}`
    }
    
    try {
      let response = await docClient.get(params).promise();
      let game = serializeDynamoResponse(response.Item);
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
      TableName: table,
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
      let response = await docClient.query(params).promise();      
      let gameList = [] as any
      response.Items.forEach((game: Interfaces.IDynamoObject) => {
        let returnedGame = serializeDynamoResponse(game);
        gameList.push(returnedGame);
      });
      return gameList;
    } catch (err: any) {
      throw err
    }
  }
  export async function modifyGame(game: Game) { 
    let template = await generateModifyExpression(game);
    let params = {
      TableName: table,
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
      let response = await docClient.update(params).promise();
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
      TableName: table,
      Key: {
        partitionKey: game.partitionKey,
        sortKey: game.sortKey
      },
      KeyConditionExpression: `sortKey = ${game.sortKey} AND partitionKey = ${game.partitionKey}`,
      ConditionExpression: 'attribute_exists(sortKey) and attribute_exists(partitionKey)',
      ReturnValues: 'ALL_OLD'
    };
  
    try {
      let response = await docClient.delete(params).promise();
      let game = serializeDynamoResponse(response.Attributes);
      return game;      
    } catch (err: any) {
      if (err.message == "The conditional request failed") {
        throw new GameError("Unable to delete game.", 400);
      }
      throw err;
    }
  }

  export async function generateModifyExpression(game: Game) : Promise<Interfaces.IUpdateExpression>{
    let updateExpression: String[] = [];
    let expressionAttributeNames = {} as any;
    let expressionAttributeValues = {} as any;
    
    //Generate dynammic update expression based on allowed parameters
    for (let [key, value] of Object.entries(game)) {
      if (key != 'partitionKey' && key != 'gameName' && key != 'sortKey' && value != undefined) {
        updateExpression.push(`#${key} = :${key}`);
        expressionAttributeNames[`#${key}`] = key ;
        expressionAttributeValues[`:${key}`] = value;  
      }
    }
    //Whenever a game is modified, this rechecks the price
    updateExpression.push('#lowestRunningPrice = :lowestRunningPrice');
    expressionAttributeNames['#lowestRunningPrice'] = 'lowestRunningPrice';
    expressionAttributeValues[':lowestRunningPrice'] = await getLowestPriceData(game); 

    return {
      updateExpression: updateExpression,
      expressionAttributeNames: expressionAttributeNames,
      expressionAttributeValues: expressionAttributeValues
    }
  }

  export function serializeDynamoResponse(data: Interfaces.IDynamoObject) : Game {
    let game = new Game(data.partitionKey, data.sortKey, data.gameName, data?.yearReleased, data?.genre, data?.console, data?.developer, data?.desiredCondition, data?.desiredPrice, data?.lowestRunningPrice);
    return game;
  }