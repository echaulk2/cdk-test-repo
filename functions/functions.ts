const AWS = require('aws-sdk');
const docClient = new AWS.DynamoDB.DocumentClient();
const table = process.env.DYNAMO_DB_TABLE;
import { Game, IHttpResponse, IGameObject } from "./modules";
const allowedRequestParameters = JSON.parse(process.env.ALLOWED_REQUEST_PARAMETERS!);

export async function getGame(gameName: string) {
    let params = {
      TableName: table,
      Key: {
        gameName: gameName
      }
    };
  
    try {
      let response = await docClient.get(params).promise();
      if (response.Item) {
        let game = SerializeGameData(response.Item);
        return HttpResponse({statusCode: 200, body: JSON.stringify(game)});
      } else {
        return HttpResponse({statusCode: 404, body: "Unable to find game."});
      }
    } catch (err) {
      return HttpResponse({statusCode: 400, body: "Unable to find game."});
    }
  }
  
  export async function listGames() {
    let params = {
      TableName: table,
      Select: "ALL_ATTRIBUTES"
    };
    
    try {
      let response = await docClient.scan(params).promise();
      let gameList : Game[] = [];
      
      if (response.Items) {
        response.Items.forEach((game: IGameObject) => {
          gameList.push(SerializeGameData(game));
        });
        return HttpResponse({statusCode: 200, body: JSON.stringify(gameList)});
      } else {
        return HttpResponse({statusCode: 404, body: 'Game list could not be found.'})
      }
    } catch (err) {
      return HttpResponse({statusCode: 400, body: 'Game list could not be found.'})
    }
  }
  
  export async function createGame(game: Game) {
    let params = {
      TableName: table,
      Item: {
        gameName: game.gameName,
        genre: game.genre,
        yearReleased: game.yearReleased,
        developer: game.developer,
        console: game.console
      },
      ConditionExpression: 'attribute_not_exists(gameName)'
    }
  
    try {
      let response = await docClient.put(params).promise();
      if (Object.keys(response).length == 0) {
        return HttpResponse({statusCode: 201, body: JSON.stringify(game)});
      } else {
        return HttpResponse({statusCode: 403, body: 'Unable to create game.'});
      }
    } catch(err) {
      return HttpResponse({statusCode: 400, body: 'Unable to create game.'});
    }
  }
  
  export async function modifyGame(game: Game) {
    let updateExpression: String[] = [];
    let expressionAttributeNames = {} as any;
    let expressionAttributeValues = {} as any;
    
    //Generate dynammic update expression based on allowed parameters
    for (let [key, value] of Object.entries(game)) {
      if (allowedRequestParameters.includes(key) && value != undefined) {
        updateExpression.push(`#${key} = :${key}`);
        expressionAttributeNames['#'+key] = key ;
        expressionAttributeValues[':'+key]=`${value}`;  
      }
    }
    
    let params = {
      TableName: table,
      Key: {
        gameName: game.gameName
      },
      UpdateExpression: `SET ${updateExpression.join(",")}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ConditionExpression: 'attribute_exists(gameName)',
      ReturnValues: 'ALL_NEW'
    };
  
    try {
      let response = await docClient.update(params).promise();
      if (response.Attributes) {
        let modifiedGame = SerializeGameData(response.Attributes);
        return HttpResponse({statusCode: 200, body: JSON.stringify(modifiedGame)});
      } else {
        return HttpResponse({statusCode: 403, body: 'Unable to modify game.'});
      }
    } catch (err) {
      return HttpResponse({statusCode: 400, body: 'Unable to modify game.'});
    }
  }
  
  export async function deleteGame(gameName: string) {
    let params = {
      TableName: table,
      Key: {
          gameName: gameName
      },
      ReturnValues: 'ALL_OLD'
    };
    
    try {
      let response = await docClient.delete(params).promise();
      if (response.Attributes) {
        let deletedGame = SerializeGameData(response.Attributes);
        return HttpResponse({statusCode: 200, body: JSON.stringify(deletedGame)});
      } else {
        return HttpResponse({statusCode: 404, body: 'Unable to delete game.'});
      }
    } catch (err) {
      return HttpResponse({statusCode: 400, body: 'Unable to delete game.'});
    }
  }
  
  export function HttpResponse(data: IHttpResponse) {
    return {
      statusCode: data.statusCode,
      body: data.body,
      headers: {
        'Access-Control-Allow-Origin': '*'
      }
    }
  }

  export function SerializeGameData(data: IGameObject) {
    return new Game(data.gameName, data.yearReleased, data.genre, data.console, data.developer);
 }
 