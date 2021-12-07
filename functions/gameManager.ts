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
import { GameError } from "./gameErrorHandler";
 
 export async function getGame(game: Game) : Promise<Game> {
    let params = {
      TableName: table,
      Key: {
        userID: game.userID,
        gameName: game.gameName
      },
      KeyConditionExpression: `gameName = ${game.gameName} AND userID = ${game.userID}`
    }
    
    try {
      let response = await docClient.get(params).promise();
      let game = serializeDynamoResponse(response.Item);
      return game;
    } catch (err: any) {
      //Dynamo returns an empty object if the get can't find a record.
      //Not sure how to handle this since the documentClient doesn't throw an error
      if (err.message == "Cannot read property 'userID' of undefined") {
        throw new GameError("Unable to find game.", 404);
      }
      throw new GameError(err.message, err.statusCode)
    }
  }

  export async function listGames(userID: string) : Promise<[Game]> {
    let params = {
      TableName: table,
      KeyConditionExpression: "#userID = :userID",
      ExpressionAttributeNames: {
          "#userID": "userID"
      },
      ExpressionAttributeValues: {
          ":userID": userID
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
      throw new GameError(err.message, err.statusCode)
    }
  }
  export async function modifyGame(game: Game) {
    let updateExpression: String[] = [];
    let expressionAttributeNames = {} as any;
    let expressionAttributeValues = {} as any;
    
    //Generate dynammic update expression based on allowed parameters
    for (let [key, value] of Object.entries(game)) {
      if (key != 'userID' && key != 'gameName' && value != undefined) {
        updateExpression.push(`#${key} = :${key}`);
        expressionAttributeNames[`#${key}`] = key ;
        expressionAttributeValues[`:${key}`] = value;  
      }
    }

    let params = {
      TableName: table,
      Key: {
        userID: game.userID,
        gameName: game.gameName
      },
      KeyConditionExpression: `gameName = ${game.gameName} AND userID = ${game.userID}`,
      UpdateExpression: `SET ${updateExpression.join(",")}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ConditionExpression: 'attribute_exists(gameName) and attribute_exists(userID)',
      ReturnValues: 'ALL_NEW'
    };
  
    try {
      let response = await docClient.update(params).promise();
      let modifiedGame = await getGame(game);
      return modifiedGame;
    } catch (err: any) {
      throw new GameError(err.message, err.statusCode);
    }
  }
  
  export async function deleteGame(game: Game) {
    let params = {
      TableName: table,
      Key: {
        userID: game.userID,
        gameName: game.gameName          
      },
      KeyConditionExpression: `gameName = ${game.gameName} AND userID = ${game.userID}`,
      ConditionExpression: 'attribute_exists(gameName) and attribute_exists(userID)',
      ReturnValues: 'ALL_OLD'
    };
  
    try {
      let response = await docClient.delete(params).promise();
      let game = serializeDynamoResponse(response.Attributes);
      return game;      
    } catch (err: any) {
      throw new GameError(err.message, err.statusCode);
    }
  }

  export interface IJSONPayload {
    gameName: string,
    yearReleased?: number,
    genre?: string,
    console?: string,
    developer?: string
 }

  export interface IDynamoObject {
     userID: string,
     gameName: string,     
     yearReleased?: number,
     genre?: string,
     console?: string,
     developer?: string
  }
  
  export interface IHttpResponse {
     statusCode: number,
     body: string,
  }

  export function serializeDynamoResponse(data: IDynamoObject) : Game {
    let game = new Game(data.userID, data.gameName, data?.yearReleased, data?.genre, data?.console, data?.developer);
    return game;
  }