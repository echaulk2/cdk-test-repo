const AWS = require('aws-sdk');
import { Game } from "./game"
import { getGame, listGames, IHttpResponse, IJSONPayload, deleteGame, modifyGame, createGame } from "./gameManager";
import { Collection } from "./collection";
import { Wishlist } from "./wishlist";
import { getCollection, addGameToCollection, modifyGameInCollection, removeGameFromCollection } from "./collectionManager";

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
    case ("/collection/wishlist/"):
      callback(null, await getWishlistHttpResponse(userID));
      break;
    case ("/collection/wishlist/addGame"):
      let addGameData = deserializeCollectionData(userID, JSON.parse(event.body), 'Wishlist');
      callback(null, await addGameToWishlist(addGameData));
      break;
    case ("/collection/wishlist/modifyGame"):
      let modifyWishlistData = deserializeCollectionData(userID, JSON.parse(event.body), 'Wishlist');
      callback(null, await modifyGameInWishlist(modifyWishlistData));
      break;
    case ("/collection/wishlist/removeGame"):
      let removeGameData = deserializeCollectionData(userID, JSON.parse(event.body), 'Wishlist');
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
    let response = await createGame(game);
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

export async function getWishlistHttpResponse(userID: string) {
  try {
    let wishlist = new Wishlist(userID);
    let response = await getCollection(wishlist);
    return httpResponse({statusCode: 200, body: JSON.stringify(response)});
  } catch (err: any) {
    return httpResponse({statusCode: err.statusCode, body: err.message});
  }
}
export async function addGameToWishlist(game: Game) {
  try {
    let wishlist = new Wishlist(game.partitionKey);
    let response = await addGameToCollection(game, wishlist);
    return httpResponse({statusCode: 200, body: JSON.stringify(response)});
  } catch (err: any) {
    return httpResponse({statusCode: err.statusCode, body: err.message});
  }
}

export async function modifyGameInWishlist(game: Game) {
  try {
    let wishlist = new Wishlist(game.partitionKey);
    let response = await modifyGameInCollection(game, wishlist);
    return httpResponse({statusCode: 200, body: JSON.stringify(response)});
  } catch (err: any) {
    return httpResponse({statusCode: err.statusCode, body: err.message});
  }
}
export async function removeGameFromWishlist(game: Game) {
  try {
    let wishlist = new Wishlist(game.partitionKey);    
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

export function deserializeGameData(userID: string, data: IJSONPayload) : Game {
  let sortKey = `[GameItem]#[${data.gameName}]`;
  return new Game(userID, sortKey, data.gameName, data?.yearReleased, data?.genre, data?.console, data?.developer);
}

export function deserializeCollectionData(userID: string, data: IJSONPayload, collectionType: string) : Game{
  let sortKey = `[CollectionItem]#[${collectionType}]#[GameItem]#[${data.gameName}]`;
  return new Game(userID, sortKey, data.gameName, data?.yearReleased, data?.genre, data?.console, data?.developer);

}