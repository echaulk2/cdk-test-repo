import { Game } from "./models/game"
import { getGame, listGames, deleteGame, modifyGame, createGame } from "./dataManager/gameManager";
import { Wishlist } from "./models/wishlist";
import { getCollection, addGameToCollection, modifyGameInCollection, removeGameFromCollection } from "./dataManager/collectionManager";
import * as Interfaces from "./shared/interfaces/interfaces"
import * as Common from "./shared/common/game";

exports.handler = async (event: any, context: any, callback: any) => {
  const userID = event.requestContext.authorizer.claims['cognito:username'];
  switch (event.path) {
    case ("/getGame"):
      let gameName = { gameName: event.queryStringParameters["gameName"] };
      let getGameData = Common.deserializeGameData(userID, gameName)
      callback(null, await getGameHttpResponse(getGameData));
      break;
    case("/listGames"):
      let listGameData = userID;
      callback(null, await listGamesHttpResponse(listGameData));
      break;
    case("/createGame"):
      let createGameData = Common.deserializeGameData(userID, JSON.parse(event.body));
      callback(null, await createGameHttpResponse(createGameData));
      break;
    case("/modifyGame"):
      let modifyGameData = Common.deserializeGameData(userID, JSON.parse(event.body));
      callback(null, await modifyGameHttpResponse(modifyGameData));
      break;
    case ("/deleteGame"):
      let deleteGameData = Common.deserializeGameData(userID, JSON.parse(event.body));
      callback(null, await deleteGameHttpResponse(deleteGameData));
      break;
    case ("/collection/wishlist/"):
      callback(null, await getWishlistHttpResponse(userID));
      break;
    case ("/collection/wishlist/addGame"):
      let addGameData = Common.deserializeCollectionData(userID, JSON.parse(event.body), 'Wishlist');
      callback(null, await addGameToWishlist(addGameData, userID));
      break;
    case ("/collection/wishlist/modifyGame"):
      let modifyWishlistData = Common.deserializeCollectionData(userID, JSON.parse(event.body), 'Wishlist');
      callback(null, await modifyGameInWishlist(modifyWishlistData, userID));
      break;
    case ("/collection/wishlist/removeGame"):
      let removeGameData = Common.deserializeCollectionData(userID, JSON.parse(event.body), 'Wishlist');
      callback(null, await removeGameFromWishlist(removeGameData, userID));
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
export async function addGameToWishlist(game: Game, userID: string) {
  try {
    let wishlist = new Wishlist(userID);
    let response = await addGameToCollection(game, wishlist);
    return httpResponse({statusCode: 200, body: JSON.stringify(response)});
  } catch (err: any) {
    return httpResponse({statusCode: err.statusCode, body: err.message});
  }
}

export async function modifyGameInWishlist(game: Game, userID: string) {
  try {
    let wishlist = new Wishlist(userID);
    let response = await modifyGameInCollection(game, wishlist);
    return httpResponse({statusCode: 200, body: JSON.stringify(response)});
  } catch (err: any) {
    return httpResponse({statusCode: err.statusCode, body: err.message});
  }
}
export async function removeGameFromWishlist(game: Game, userID: string) {
  try {
    let wishlist = new Wishlist(userID);    
    let response = await removeGameFromCollection(game, wishlist);
    return httpResponse({statusCode: 200, body: JSON.stringify(response)});
  } catch (err: any) {
    return httpResponse({statusCode: err.statusCode, body: err.message});
  }
}

export function httpResponse(data: Interfaces.IHttpResponse) : {} {
  return {
    statusCode: data.statusCode,
    body: data.body,
    headers: {
      'Access-Control-Allow-Origin': '*'
    }
  }
}