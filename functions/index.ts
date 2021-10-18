const AWS = require('aws-sdk');
const docClient = new AWS.DynamoDB.DocumentClient();
const table = process.env.DYNAMO_DB_TABLE;
import { Game as Game, IHttpResponse as IHttpResponse } from "./Modules";
const allowedRequestParameters = JSON.parse(process.env.ALLOWED_REQUEST_PARAMETERS!);

exports.handler = async (event: any, context: any, callback: any) => {
  switch (event.path) {
    case ("/getGame"):
      await getGame(event.queryStringParameters["gameName"]);
      break;
    case ("/listGames"):
      await listGames();
      break;
    case("/createGame"):
      await createGame(new Game(JSON.parse(event.body).gameName, JSON.parse(event.body).yearReleased, JSON.parse(event.body).genre, JSON.parse(event.body).console, JSON.parse(event.body).developer));
      break;
    case("/modifyGame"):
      await modifyGame(new Game(JSON.parse(event.body).gameName, JSON.parse(event.body).yearReleased, JSON.parse(event.body).genre, JSON.parse(event.body).console, JSON.parse(event.body).developer));
      break;
    case ("/deleteGame"):
      await deleteGame(JSON.parse(event.body).gameName);
      break;
    default:
      HttpResponse({statusCode: 400, body: JSON.stringify("Unable to process request")});
      break;
  }
  
  async function getGame(gameName: string) {
    let params = {
      TableName: table,
      Key: {
        gameName: gameName
      }
    };

    try {
      let response = await docClient.get(params).promise();
      if (response.Item) {
        let game = new Game(response.Item.gameName, response.Item.yearReleased, response.Item.genre, response.Item.console, response.Item.developer);
        HttpResponse({statusCode: 200, body: JSON.stringify(game)});
      } else {
        throw Error;
     }
    } catch (err) {
      throw HttpResponse({statusCode: 404, body: `Unable to find game.`});
    }
  }
  
  async function listGames() {
    let params = {
      TableName: table,
      Select: "ALL_ATTRIBUTES"
    };
    
    try {
      let response = await docClient.scan(params).promise();
      let gameList : Game[] = [];
      
      if (response.Items) {
        response.Items.forEach((game: Game) => {
          gameList.push(new Game(game.gameName, game.yearReleased, game.genre, game.console, game.developer));
        })
        HttpResponse({statusCode: 200, body: JSON.stringify(gameList)})
      } else {
        throw Error;
     }
    } catch (err) {
      throw HttpResponse({statusCode: 404, body: `Game list could not be found.`});
    }
  }

  async function createGame(game: Game) {
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
        HttpResponse({statusCode: 201, body: JSON.stringify(game)});
      } else {
        throw Error;
     }
    } catch(err) {
      throw HttpResponse({statusCode: 403, body: `Unable to create game.`});
    }
  }

  async function modifyGame(game: Game) {
    let updateExpression: String[] = [];
    let expressionAttributeNames = {} as any;
    let expressionAttributeValues = {} as any;
    let body = JSON.parse(event.body);
    
    //Generate dynammic update expression based on allowed parameters
    for (let parameter in body) {
      if (allowedRequestParameters.includes(parameter)) {
        updateExpression.push(`#${parameter} = :${parameter}`);
        expressionAttributeNames['#'+parameter] = parameter ;
        expressionAttributeValues[':'+parameter]=`${body[parameter]}`;  
      }
    }
    
    let params = {
      TableName: table,
      Key: {
        gameName: body.gameName
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
        HttpResponse({statusCode: 200, body: JSON.stringify(game)});
      } else {
        throw Error;
      }
    } catch (err) {
      throw HttpResponse({statusCode: 403, body: `Unable to modify game.`});
    }
  }
  
  async function deleteGame(gameName: string) {
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
        let game = new Game(response.Attributes.gameName, response.Attributes.yearReleased, response.Attributes.genre, response.Attributes.console, response.Attributes.developer);
        HttpResponse({statusCode: 200, body: JSON.stringify(game)});
      } else {
        throw Error;
     }
    } catch (err) {
      throw HttpResponse({statusCode: 400, body: `Unable to delete game.`});
    }
  }

  function HttpResponse(data: IHttpResponse) {
    callback(null, {
      statusCode: data.statusCode,
      body: data.body,
      headers: {
        'Access-Control-Allow-Origin': '*'
      }
    })
  }
}