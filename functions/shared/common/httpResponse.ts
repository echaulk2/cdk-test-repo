import { Game } from "../../models/game"
import { getGame, listGames, deleteGame, modifyGame, createGame } from "../../dataManager/gameManager";
import { Wishlist } from "../../models/wishlist"; 
import { createCollection, getAllGamesInCollection, addGameToCollection, modifyGameInCollection, removeGameFromCollection } from "../../dataManager/collectionManager";
import * as Interfaces from "../interfaces/interfaces";
import { GameError } from "../../error/gameErrorHandler";
import { GamePriceError } from "../../error/gamePriceErrorHandler"
import { GamePriceMonitor } from "../../models/gamePriceMonitor";
import { createGamePriceMonitor, deleteGamePriceMonitor, modifyGamePriceMonitor } from "../../dataManager/gamePriceMonitor";
import { createGamePriceData } from "../../dataManager/gamePriceDataManager";
import { User } from "../../models/user";
import { createUser } from "../../dataManager/userManager";
import { UserError } from "../../error/userErrorHandler";

export async function getGameHttpResponse(game: Game) {
    try {
      let response = await getGame(game);
      return httpResponse({statusCode: 200, body: JSON.stringify(response)});
    } catch (err: any) {
      if (err instanceof GameError) {
        return httpResponse({statusCode: 400, body: 'Game Error'});
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
        return httpResponse({statusCode: 400, body: 'Game Error'});        
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
        return httpResponse({statusCode: 400, body: 'Game Error'});
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
        return httpResponse({statusCode: 400, body: 'Game Error'});
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
        return httpResponse({statusCode: 400, body: 'Game Error'});
      } else {
        return httpResponse({statusCode: err.statusCode, body: 'Error deleting game.'})
      }
    }
  }
  export async function createWishlistHttpResponse(wishlist: Wishlist) {
    try {
      let response = await createCollection(wishlist);
      return httpResponse({statusCode: 200, body: JSON.stringify(response)});
    } catch (err: any) {
      if (err instanceof GamePriceError) {
        return httpResponse({statusCode: 400, body: 'Game Price Error'});
      } else if (err instanceof GameError) {
        return httpResponse({statusCode: 400, body: 'Game Error'});
      } else if (err instanceof GamePriceMonitor) {
        return httpResponse({statusCode: 400, body: 'Game Price Monitor Error'});
      } else {
        return httpResponse({statusCode: err.statusCode, body: 'Error retrieving wishlist.'})
      }
    }
  }
  
  export async function getWishlistHttpResponse(wishlist: Wishlist) {
    try {
      let response = await getAllGamesInCollection(wishlist);
      return httpResponse({statusCode: 200, body: JSON.stringify(response)});
    } catch (err: any) {
      if (err instanceof GamePriceError) {
        return httpResponse({statusCode: 400, body: 'Game Price Error'});
      } else if (err instanceof GameError) {
        return httpResponse({statusCode: 400, body: 'Game Error'});
      } else if (err instanceof GamePriceMonitor) {
        return httpResponse({statusCode: 400, body: 'Game Price Monitor Error'});
      } else {
        return httpResponse({statusCode: err.statusCode, body: 'Error retrieving wishlist.'})
      }
    }
  }

  export async function addGameToWishlistHttpResponse(game: Game) {
    try {
      let response = await addGameToCollection(game);
      return httpResponse({statusCode: 200, body: JSON.stringify(response)});
    } catch (err: any) {
      if (err instanceof GamePriceError) {
        return httpResponse({statusCode: 400, body: 'Game Price Error'});
      } else if (err instanceof GameError) {
        return httpResponse({statusCode: 400, body: 'Game Error'});
      } else if (err instanceof GamePriceMonitor) {
        return httpResponse({statusCode: 400, body: 'Game Price Monitor Error'});
      } else {
        return httpResponse({statusCode: err.statusCode, body: 'Error adding game to wishlist.'})
      }
    }
  }
  
  export async function modifyGameInWishlistHttpResponse(game: Game) {
    try {
      let response = await modifyGameInCollection(game);
      return httpResponse({statusCode: 200, body: JSON.stringify(response)});
    } catch (err: any) {
      if (err instanceof GamePriceError) {
        return httpResponse({statusCode: 400, body: 'Game Price Error'});
      } else if (err instanceof GameError) {
        return httpResponse({statusCode: 400, body: 'Game Error'});
      } else if (err instanceof GamePriceMonitor) {
        return httpResponse({statusCode: 400, body: 'Game Price Monitor Error'});
      } else {
        return httpResponse({statusCode: err.statusCode, body: 'Error modifying game in wishlist.'})
      }
    }
  }
  export async function removeGameFromWishlistHttpResponse(game: Game) {
    try {
      let response = await removeGameFromCollection(game);
      return httpResponse({statusCode: 200, body: JSON.stringify(response)});
    } catch (err: any) {
      if (err instanceof GamePriceError) {
        return httpResponse({statusCode: 400, body: 'Game Price Error'});
      } else if (err instanceof GameError) {
        return httpResponse({statusCode: 400, body: 'Game Error'});
      } else if (err instanceof GamePriceMonitor) {
        return httpResponse({statusCode: 400, body: 'Game Price Monitor Error'});
      } else {
        return httpResponse({statusCode: err.statusCode, body: 'Error removing game from wishlist.'})
      }
    }
  }
  
  export async function addPriceMonitorToWishlistHttpResponse(gamePriceMonitor: GamePriceMonitor) {
    try {
      let priceMonitor = await createGamePriceMonitor(gamePriceMonitor)
      if (priceMonitor) {
        priceMonitor.gamePriceData = await createGamePriceData(priceMonitor);         
      }
      return httpResponse({statusCode: 200, body: JSON.stringify(priceMonitor)});
    } catch (err: any) {
      if (err instanceof GamePriceError) {
        return httpResponse({statusCode: 400, body: 'Game Price Error'});
      } else if (err instanceof GameError) {
        return httpResponse({statusCode: 400, body: 'Game Error'});
      } else if (err instanceof GamePriceMonitor) {
        return httpResponse({statusCode: 400, body: 'Game Price Monitor Error'});
      } else {
        return httpResponse({statusCode: err.statusCode, body: 'Error adding Price Monitor'})
      }
    }
  }

  export async function modifyPriceMonitorWishlistHttpResponse(gamePriceMonitor: GamePriceMonitor) {
    try {
      let priceMonitor = await modifyGamePriceMonitor(gamePriceMonitor)
      if (priceMonitor) {
        priceMonitor.gamePriceData = await createGamePriceData(priceMonitor);         
      }
      return httpResponse({statusCode: 200, body: JSON.stringify(priceMonitor)});
    } catch (err: any) {
      if (err instanceof GamePriceError) {
        return httpResponse({statusCode: 400, body: 'Game Price Error'});
      } else if (err instanceof GameError) {
        return httpResponse({statusCode: 400, body: 'Game Error'});
      } else if (err instanceof GamePriceMonitor) {
        return httpResponse({statusCode: 400, body: 'Game Price Monitor Error'});
      } else {
        return httpResponse({statusCode: err.statusCode, body: 'Error modifying price monitor'})
      }
    }
  }

  export async function deletePriceMonitorWishlistHttpResponse(gamePriceMonitor: GamePriceMonitor) {
    try {
      let priceMonitor = await deleteGamePriceMonitor(gamePriceMonitor)
      return httpResponse({statusCode: 200, body: JSON.stringify(priceMonitor)});
    } catch (err: any) {
      if (err instanceof GamePriceError) {
        return httpResponse({statusCode: 400, body: 'Game Price Error'});
      } else if (err instanceof GameError) {
        return httpResponse({statusCode: 400, body: 'Game Error'});
      } else if (err instanceof GamePriceMonitor) {
        return httpResponse({statusCode: 400, body: 'Game Price Monitor Error'});
      } else {
        return httpResponse({statusCode: err.statusCode, body: 'Error deleting price monitor'})
      }
    }
  }
  
  export async function createUserHttpResponse(user: User) {
    try {
      let response = await createUser(user);
      return httpResponse({statusCode: 200, body: JSON.stringify(response)});
    } catch (err: any) {
      if (err instanceof UserError) {
        return httpResponse({statusCode: 400, body: 'User Error'});
      } else {
        return httpResponse({statusCode: err.statusCode, body: 'Error creating user.'})
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