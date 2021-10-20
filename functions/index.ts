const AWS = require('aws-sdk');
import { getGame, listGames, createGame, modifyGame, deleteGame, HttpResponse, SerializeGameData } from "./functions"

exports.handler = async (event: any, context: any, callback: any) => {
  switch (event.path) {
    case ("/getGame"):
      let getGameData = SerializeGameData({gameName: event.queryStringParameters["gameName"]})
      callback(null, await getGame(getGameData.gameName))
      break;
    case ("/listGames"):
      callback(null, await listGames());
      break;
    case("/createGame"):
      let createGameData = SerializeGameData(JSON.parse(event.body));
      callback(null, await createGame(createGameData));
      break;
    case("/modifyGame"):
      let modifyGameData = SerializeGameData(JSON.parse(event.body));
      callback(null, await modifyGame(modifyGameData));
      break;
    case ("/deleteGame"):
      let deleteGameData = SerializeGameData(JSON.parse(event.body));
      callback(null, await deleteGame(deleteGameData.gameName));
      break;
    default:
      callback(null, HttpResponse({statusCode: 400, body: JSON.stringify("Invalid operation.")}));
      break;
  }
}  