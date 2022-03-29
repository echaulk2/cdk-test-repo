import * as Interfaces from "./shared/interfaces/interfaces"
import * as Common from "./shared/common/game";
import * as CommonPriceMonitor from "./shared/common/gamePriceMonitor";
import * as HttpResponse from "./shared/common/httpResponse";
import { Wishlist } from "./models/wishlist";

exports.handler = async (event: any, context: any, callback: any) => {
  let userData: Interfaces.IUserData = {
    userID: event.requestContext.authorizer.claims['cognito:username'],
    email: event.requestContext.authorizer.claims['email']
  };

  switch (event.path) {
    case ("/getGame"):
      let payload = { 
        id: event?.queryStringParameters["id"],
        gameName: event?.queryStringParameters["gameName"] 
      };
      let getGameData = Common.serializeExistingGameData(userData, payload)
      callback(null, await HttpResponse.getGameHttpResponse(getGameData));
      break;
    case("/listGames"):
      let listGameData = userData;
      callback(null, await HttpResponse.listGamesHttpResponse(listGameData));
      break;
    case("/createGame"):
      let createGameData = Common.serializeNewGameData(userData, JSON.parse(event.body));
      callback(null, await HttpResponse.createGameHttpResponse(createGameData));
      break;
    case("/modifyGame"):
      let modifyGameData = Common.serializeExistingGameData(userData, JSON.parse(event.body));
      callback(null, await HttpResponse.modifyGameHttpResponse(modifyGameData));
      break;
    case ("/deleteGame"):
      let deleteGameData = Common.serializeExistingGameData(userData, JSON.parse(event.body));
      callback(null, await HttpResponse.deleteGameHttpResponse(deleteGameData));
      break;
    case ("/collection/wishlist/"):
      let wishlistPayload = { 
        collectionID: event?.queryStringParameters["collectionID"] ,
      };
      let wishlist = new Wishlist(userData.userID, wishlistPayload.collectionID);
      callback(null, await HttpResponse.getWishlistHttpResponse(wishlist));
      break;
    case ("/collection/wishlist/addGame"):
      let addGamecollectionID = JSON.parse(event.body)['collectionID'];
      let addGameToWishlist = new Wishlist(userData.userID, addGamecollectionID);
      let addGameData = Common.serializeNewGameData(userData, JSON.parse(event.body));
      callback(null, await HttpResponse.addGameToWishlistHttpResponse(addGameData, addGameToWishlist));
      break;
    case ("/collection/wishlist/modifyGame"):
      let modifyGameCollectionID = JSON.parse(event.body)['collectionID'];
      let modifyGameInWishlist = new Wishlist(userData.userID, modifyGameCollectionID);
      let modifyWishlistData = Common.serializeExistingGameData(userData, JSON.parse(event.body));
      callback(null, await HttpResponse.modifyGameInWishlistHttpResponse(modifyWishlistData, modifyGameInWishlist));
      break;
    case ("/collection/wishlist/removeGame"):
      let removeGamecollectionID = JSON.parse(event.body)['collectionID'];
      let removeGameInWishlist = new Wishlist(userData.userID, removeGamecollectionID);
      let removeGameData = Common.serializeExistingGameData(userData, JSON.parse(event.body));
      callback(null, await HttpResponse.removeGameFromWishlistHttpResponse(removeGameData, removeGameInWishlist));
      break;
    case ("/collection/wishlist/addPriceMonitor"):
      let addPriceMonitor = CommonPriceMonitor.serializeGamePriceMonitorData(userData, JSON.parse(event.body));
      callback(null, await HttpResponse.addPriceMonitorToWishlistHttpResponse(addPriceMonitor));
      break;
    case ("/collection/wishlist/modifyPriceMonitor"):
      let modifyPriceMonitor = CommonPriceMonitor.serializeGamePriceMonitorData(userData, JSON.parse(event.body));
      callback(null, await HttpResponse.modifyPriceMonitorWishlistHttpResponse(modifyPriceMonitor));
      break;      
    case ("/collection/wishlist/deletePriceMonitor"):
      let deletePriceMonitor = CommonPriceMonitor.serializeGamePriceMonitorData(userData, JSON.parse(event.body));
      callback(null, await HttpResponse.deletePriceMonitorWishlistHttpResponse(deletePriceMonitor));
      break;        
    default:
      callback(null, HttpResponse.httpResponse({statusCode: 400, body: JSON.stringify("Invalid operation.")}));
      break;
    }
}  
