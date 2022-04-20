import * as Interfaces from "./shared/interfaces/interfaces"
import * as Common from "./shared/common/game";
import * as CommonPriceMonitor from "./shared/common/gamePriceMonitor";
import * as CommonUser from "./shared/common/user";
import * as CommonCollection from "./shared/common/collection";
import * as HttpResponse from "./shared/common/httpResponse";
import { Wishlist } from "./models/wishlist";

exports.handler = async (event: any, context: any, callback: any) => {
  let userData: Interfaces.IUserData = {
    userID: `U-${event.requestContext.authorizer.claims['cognito:username']}`,
    email: event.requestContext.authorizer.claims['email']
  };

  switch (event.path) {
    case ("/createUser"):
      let createUserData = CommonUser.serializeNewUserData(userData);
      callback(null, await HttpResponse.createUserHttpResponse(createUserData));
      break;
    case ("/getGame"):
      let payload: Interfaces.IPayloadData = { 
        gameID: event?.queryStringParameters["gameID"]
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
      let wishlistID = event?.queryStringParameters["collectionID"]
      let wishlist = new Wishlist(userData.userID, wishlistID);
      callback(null, await HttpResponse.getWishlistHttpResponse(wishlist));
      break;
    case ("/collection/wishlist/createWishlist"):
      let createWishlistData = CommonCollection.serializeNewWishlist(userData);
      callback(null, await HttpResponse.createWishlistHttpResponse(createWishlistData));      
    case ("/collection/wishlist/addGame"):
      let addGameData = Common.serializeNewGameData(userData, JSON.parse(event.body));
      callback(null, await HttpResponse.addGameToWishlistHttpResponse(addGameData));
      break;
    case ("/collection/wishlist/modifyGame"):
      let modifyWishlistData = Common.serializeExistingGameData(userData, JSON.parse(event.body));
      callback(null, await HttpResponse.modifyGameInWishlistHttpResponse(modifyWishlistData));
      break;
    case ("/collection/wishlist/removeGame"):
      let removeGameData = Common.serializeExistingGameData(userData, JSON.parse(event.body));
      callback(null, await HttpResponse.removeGameFromWishlistHttpResponse(removeGameData));
      break;
    case ("/collection/wishlist/addPriceMonitor"):
      let addPriceMonitor = CommonPriceMonitor.serializeNewGamePriceMonitorData(userData, JSON.parse(event.body));
      callback(null, await HttpResponse.addPriceMonitorToWishlistHttpResponse(addPriceMonitor));
      break;
    case ("/collection/wishlist/modifyPriceMonitor"):
      let modifyPriceMonitor = CommonPriceMonitor.serializeExistingGamePriceMonitorData(userData, JSON.parse(event.body));
      callback(null, await HttpResponse.modifyPriceMonitorWishlistHttpResponse(modifyPriceMonitor));
      break;      
    case ("/collection/wishlist/deletePriceMonitor"):
      let deletePriceMonitor = CommonPriceMonitor.serializeExistingGamePriceMonitorData(userData, JSON.parse(event.body));
      callback(null, await HttpResponse.deletePriceMonitorWishlistHttpResponse(deletePriceMonitor));
      break;        
    default:
      callback(null, HttpResponse.httpResponse({statusCode: 400, body: JSON.stringify("Invalid operation.")}));
      break;
    }
}  
