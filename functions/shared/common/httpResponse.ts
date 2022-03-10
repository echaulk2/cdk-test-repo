import { Game } from "../../models/game"
import { getGame, listGames, deleteGame, modifyGame, createGame } from "../../dataManager/gameManager";
import { Wishlist } from "../../models/wishlist"; 
import { getCollection, addGameToCollection, modifyGameInCollection, removeGameFromCollection } from "../../dataManager/collectionManager";
import * as Interfaces from "../interfaces/interfaces";
import { GameError } from "../../error/gameErrorHandler";
import { CollectionError } from "../../error/collectionErrorHandler";
import { GamePriceError } from "../../error/gamePriceErrorHandler"

export async function getGameHttpResponse(game: Game) {
    try {
      let response = await getGame(game);
      return httpResponse({statusCode: 200, body: JSON.stringify(response)});
    } catch (err: any) {
      if (err instanceof GameError) {
        return httpResponse({statusCode: err.statusCode, body: 'Game not found.'});
      } else {
        return httpResponse({statusCode: err.statusCode, body: 'Error retrieving game.'})
      }
    }
  }
  
  export async function listGamesHttpResponse(userData: Interfaces.IUserData) {
    try {
      let response = await listGames(userData.userID);
      return httpResponse({statusCode: 200, body: JSON.stringify(response)});
    } catch (err: any) {
      if (err instanceof GameError) {
        return httpResponse({statusCode: err.statusCode, body: 'Unable to get game list.'});        
      } else {
        return httpResponse({statusCode: err.statusCode, body: 'Error retrieving game list.'});        
      }
    }
  }
  
  export async function createGameHttpResponse(game: Game) {
    try {
      let response = await createGame(game);
      return httpResponse({statusCode: 200, body: JSON.stringify(response)});
    } catch (err: any) {
      if (err instanceof GameError) {
        return httpResponse({statusCode: err.statusCode, body: 'Unable to create game.  Game already exists.'});
      } else {
        return httpResponse({statusCode: err.statusCode, body: 'Error creating game.'})
      }
    }
  }
  
  export async function modifyGameHttpResponse(game: Game) {
    try {
      let response = await modifyGame(game);
      return httpResponse({statusCode: 200, body: JSON.stringify(response)});
    } catch (err: any) {
      if (err instanceof GameError) {
        return httpResponse({statusCode: err.statusCode, body: 'Unable to modify game.  Game not found.'});
      } else {
        return httpResponse({statusCode: err.statusCode, body: 'Error modifying game.'})
      }
    }
  }
  
  export async function deleteGameHttpResponse(game: Game) {
    try {
      let response = await deleteGame(game);
      return httpResponse({statusCode: 200, body: JSON.stringify(response)});
    } catch (err: any) {
      if (err instanceof GameError) {
        return httpResponse({statusCode: err.statusCode, body: 'Unable to delete game.  Game not found.'});
      } else {
        return httpResponse({statusCode: err.statusCode, body: 'Error deleting game.'})
      }
    }
  }
  
  export async function getWishlistHttpResponse(userID: string) {
    try {
      let wishlist = new Wishlist(userID);
      let response = await getCollection(wishlist);
      return httpResponse({statusCode: 200, body: JSON.stringify(response)});
    } catch (err: any) {
      if (err instanceof CollectionError) {
        return httpResponse({statusCode: err.statusCode, body: 'Unable to get Wishlist.'});
      } else if (err instanceof GamePriceError) {
        return httpResponse({statusCode: err.statusCode, body: 'Error retrieving game price data'});
      } else {
        return httpResponse({statusCode: err.statusCode, body: 'Error retrieving Wishlist.'})
      }
    }
  }
  export async function addGameToWishlistHttpResponse(game: Game, userData: Interfaces.IUserData) {
    try {
      let wishlist = new Wishlist(userData.userID);
      let response = await addGameToCollection(game, wishlist);
      return httpResponse({statusCode: 200, body: JSON.stringify(response)});
    } catch (err: any) {
      if (err instanceof GamePriceError) {
        return httpResponse({statusCode: err.statusCode, body: 'Error retrieving game price data'});
      } else if (err instanceof GameError) { 
        return httpResponse({statusCode: err.statusCode, body: 'Unable to create game'});
      } else {
        return httpResponse({statusCode: err.statusCode, body: 'Error adding game to Wishlist.'})
      }
    }
  }
  
  export async function modifyGameInWishlistHttpResponse(game: Game, userData: Interfaces.IUserData) {
    try {
      let wishlist = new Wishlist(userData.userID);
      let response = await modifyGameInCollection(game, wishlist);
      return httpResponse({statusCode: 200, body: JSON.stringify(response)});
    } catch (err: any) {
      if (err instanceof GamePriceError) {
        return httpResponse({statusCode: err.statusCode, body: 'Error modifying game price data'});
      } else if (err instanceof GameError) { 
        return httpResponse({statusCode: err.statusCode, body: 'Unable to modify game'});
      } else {
        return httpResponse({statusCode: err.statusCode, body: 'Error modifying game in Wishlist.'})
      }
    }
  }
  export async function removeGameFromWishlistHttpResponse(game: Game, userData: Interfaces.IUserData) {
    try {
      let wishlist = new Wishlist(userData.userID);    
      let response = await removeGameFromCollection(game, wishlist);
      return httpResponse({statusCode: 200, body: JSON.stringify(response)});
    } catch (err: any) {
      if (err instanceof GamePriceError) {
        return httpResponse({statusCode: err.statusCode, body: 'Error deleting game price data'});
      } else if (err instanceof GameError) {
        return httpResponse({statusCode: err.statusCode, body: 'Unable to delete game'});
      } else {
        return httpResponse({statusCode: err.statusCode, body: 'Error deleting game from Wishlist.'})
      }
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