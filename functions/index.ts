const AWS = require('aws-sdk');
import { Game, GetGame, ModifyGame, DeleteGame, IHttpResponse, IDynamoObject, ListGames } from "./game"

exports.handler = async (event: any, context: any, callback: any) => {
  switch (event.path) {
    case ("/getGame"):
      let getGameData = DeserializeGameData({gameName: event.queryStringParameters["gameName"]});
      callback(null, await GetGameHttpResponse(getGameData));
      break;
    case ("/listGames"):
      callback(null, await ListGamesHttpResponse());
      break;
    case("/createGame"):
      let createGameData = DeserializeGameData(JSON.parse(event.body));
      callback(null, await CreateGameHttpResponse(createGameData));
      break;
    case("/modifyGame"):
      let modifyGameData = DeserializeGameData(JSON.parse(event.body));
      callback(null, await ModifyGameHttpResponse(modifyGameData));
      break;
    case ("/deleteGame"):
      let deleteGameData = DeserializeGameData(JSON.parse(event.body));
      callback(null, await DeleteGameHttpResponse(deleteGameData));
      break;
    default:
      callback(null, HttpResponse({statusCode: 400, body: JSON.stringify("Invalid operation.")}));
      break;
    }
}  

export async function GetGameHttpResponse(game: Game) {
  let response = await GetGame(game);
  if (response.code) {
    return ParseDynamoError(response.code);
  } else if (response.Item) {
    return HttpResponse({statusCode: 200, body: JSON.stringify(response)});
  } else {
    return HttpResponse({statusCode: 404, body: "Unable to get game."});
  }
}

export async function ListGamesHttpResponse() {
  let response = await ListGames();
  if (response.code) {
    return ParseDynamoError(response.code);
  } else if (response.Items) {
    return HttpResponse({statusCode: 200, body: JSON.stringify(response)});
  } else {
    return HttpResponse({statusCode: 404, body: "Unable to get list of games."})
  }
}

export async function CreateGameHttpResponse(game: Game) {
  let response = await game.CreateGame();
  if (response.code) {
    return ParseDynamoError(response.code);
  } else if (response.Item) {
    return HttpResponse({statusCode: 201, body: JSON.stringify(response)});
  } else {
    return HttpResponse({statusCode: 404, body: "Unable to create game."});
  }
}

export async function ModifyGameHttpResponse(game: Game) {
  let response = await ModifyGame(game);
  if (response.code) {
    return ParseDynamoError(response.code);
  } else if (response.Attributes) {
    return HttpResponse({statusCode: 200, body: JSON.stringify(response.Attributes)});
  }
}

export async function DeleteGameHttpResponse(game: Game) {
  let response = await DeleteGame(game);
  if (response.code) {
    return ParseDynamoError(response.code);
  } else if (response.Attributes) {
    return HttpResponse({statusCode: 200, body: JSON.stringify(response)});
  } else {
    return HttpResponse({statusCode: 404, body: "Unable to delete game."});
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

export function DeserializeGameData(data: IDynamoObject) {
  return new Game(data.gameName, data.yearReleased, data.genre, data.console, data.developer);
}

export function ParseDynamoError(error: string) {
  switch(error) {
    case "ConditionalCheckFailedException":
        return HttpResponse({statusCode: 400, body: "Error with the provided condition."});
    default:
        return HttpResponse({statusCode: 400, body: "Invalid operation."});
  }
}