const AWS = require('aws-sdk');
import { Game } from "./game"
import { getGame, listGames, IHttpResponse, IJSONPayload, deleteGame, modifyGame } from "./gameManager";
import { Collection } from "./collection";
import { addGameToCollection, getCollection, removeGameFromCollection } from "./collectionManager";

exports.handler = async (event: any, context: any, callback: any) => {
  const userID = event.requestContext.authorizer.claims['cognito:username'];
  switch (event.path) {
    case ("/getGame"):
      let gameName = { gameName: event.queryStringParameters["gameName"] };
      let getGameData = deserializeGameData(userID, gameName)
      callback(null, await getGameHttpResponse(getGameData));
      break;
    case("/listGames"):
      let listGameData = userID;
      callback(null, await listGamesHttpResponse(listGameData));
      break;
    case("/createGame"):
      let createGameData = deserializeGameData(userID, JSON.parse(event.body));
      callback(null, await createGameHttpResponse(createGameData));
      break;
    case("/modifyGame"):
      let modifyGameData = deserializeGameData(userID, JSON.parse(event.body));
      callback(null, await modifyGameHttpResponse(modifyGameData));
      break;
    case ("/deleteGame"):
      let deleteGameData = deserializeGameData(userID, JSON.parse(event.body));
      callback(null, await deleteGameHttpResponse(deleteGameData));
      break;
    case ("/collection/wishlist/createWishlist"):
      callback(null, await createWishlistHttpResponse(userID));
      break;
    case ("/collection/wishlist/getWishlist"):
      callback(null, await getWishlistHttpResponse(userID));
      break;
    case ("/collection/wishlist/addGame"):
      let addGameData = deserializeGameData(userID, JSON.parse(event.body));
      callback(null, await addGameToWishlist(addGameData));
      break;
    case ("/collection/wishlist/removeGame"):
      let removeGameData = deserializeGameData(userID, JSON.parse(event.body));
      callback(null, await removeGameFromWishlist(removeGameData));
      break;
    default:
      callback(null, httpResponse({statusCode: 400, body: JSON.stringify("Invalid operation.")}));
      break;
    }
}  

export async function getGameHttpResponse(game: Game) {
  try {
    let response = await getGame(game);
    return httpResponse({statusCode: 200, body: JSON.stringify(response)});
  } catch (err: any) {
    return httpResponse({statusCode: err.statusCode, body: err.message});
  }
}

export async function listGamesHttpResponse(userID: string) {
  try {
    let response = await listGames(userID);
    return httpResponse({statusCode: 200, body: JSON.stringify(response)});
  } catch (err: any) {
    return httpResponse({statusCode: err.statusCode, body: err.message});
  }
}

export async function createGameHttpResponse(game: Game) {
  try {
    let response = await game.createGame();
    return httpResponse({statusCode: 200, body: JSON.stringify(response)});
  } catch (err: any) {
    return httpResponse({statusCode: err.statusCode, body: err.message});
  }
}

export async function modifyGameHttpResponse(game: Game) {
  try {
    let response = await modifyGame(game);
    return httpResponse({statusCode: 200, body: JSON.stringify(response)});
  } catch (err: any) {
    return httpResponse({statusCode: err.statusCode, body: err.message});
  }
}

export async function deleteGameHttpResponse(game: Game) {
  try {
    let response = await deleteGame(game);
    return httpResponse({statusCode: 200, body: JSON.stringify(response)});
  } catch (err: any) {
    return httpResponse({statusCode: err.statusCode, body: err.message});
  }
}

export async function createWishlistHttpResponse(userID: string) {
  try {
    let wishlist = new Collection(userID, 'wishlist');
    let response = await wishlist.createCollection();
    return httpResponse({statusCode: 200, body: JSON.stringify(response)});
  } catch (err: any) {
    return httpResponse({statusCode: err.statusCode, body: err.message});
  }
}

export async function getWishlistHttpResponse(userID: string) {
  try {
    let response = await getCollection(userID, "wishlist");
    return httpResponse({statusCode: 200, body: JSON.stringify(response)});
  } catch (err: any) {
    return httpResponse({statusCode: err.statusCode, body: err.message});
  }
}
export async function addGameToWishlist(game: Game) {
  try {
    let wishlist = await getCollection(game.userID, 'wishlist');
    let response = await addGameToCollection(game, wishlist);
    return httpResponse({statusCode: 200, body: JSON.stringify(response)});
  } catch (err: any) {
    return httpResponse({statusCode: err.statusCode, body: err.message});
  }
}

export async function removeGameFromWishlist(game: Game) {
  try {
    let wishlist = await getCollection(game.userID, 'wishlist');
    let response = await removeGameFromCollection(game, wishlist);
    return httpResponse({statusCode: 200, body: JSON.stringify(response)});
  } catch (err: any) {
    return httpResponse({statusCode: err.statusCode, body: err.message});
  }
}

export function httpResponse(data: IHttpResponse) : {} {
  return {
    statusCode: data.statusCode,
    body: data.body,
    headers: {
      'Access-Control-Allow-Origin': '*'
    }
  }
}

export function deserializeGameData(userID: string, data: IJSONPayload) {
  return new Game(userID, data.gameName, data?.yearReleased, data?.genre, data?.console, data?.developer);
}

export function deserializeCollectionData(userID: string, collectionType: string) {
  return new Collection(userID, collectionType);
}