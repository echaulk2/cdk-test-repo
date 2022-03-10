import * as Interfaces from "./shared/interfaces/interfaces"
import * as Common from "./shared/common/game";
import * as CollectionCommon from "./shared/common/collection";
import * as HttpResponse from "./shared/common/httpResponse";

exports.handler = async (event: any, context: any, callback: any) => {
  let userData: Interfaces.IUserData = {
    userID: event.requestContext.authorizer.claims['cognito:username'],
    email: event.requestContext.authorizer.claims['email']
  };
  switch (event.path) {
    case ("/getGame"):
      let gameName = { gameName: event.queryStringParameters["gameName"] };
      let getGameData = Common.serializeGameData(userData, gameName)
      callback(null, await HttpResponse.getGameHttpResponse(getGameData));
      break;
    case("/listGames"):
      let listGameData = userData;
      callback(null, await HttpResponse.listGamesHttpResponse(listGameData));
      break;
    case("/createGame"):
      let createGameData = Common.serializeGameData(userData, JSON.parse(event.body));
      callback(null, await HttpResponse.createGameHttpResponse(createGameData));
      break;
    case("/modifyGame"):
      let modifyGameData = Common.serializeGameData(userData, JSON.parse(event.body));
      callback(null, await HttpResponse.modifyGameHttpResponse(modifyGameData));
      break;
    case ("/deleteGame"):
      let deleteGameData = Common.serializeGameData(userData, JSON.parse(event.body));
      callback(null, await HttpResponse.deleteGameHttpResponse(deleteGameData));
      break;
    case ("/collection/wishlist/"):
      callback(null, await HttpResponse.getWishlistHttpResponse(userData.userID));
      break;
    case ("/collection/wishlist/addGame"):
      let addGameData = CollectionCommon.serializeCollectionData(userData, JSON.parse(event.body), 'Wishlist');
      callback(null, await HttpResponse.addGameToWishlistHttpResponse(addGameData, userData));
      break;
    case ("/collection/wishlist/modifyGame"):
      let modifyWishlistData = CollectionCommon.serializeCollectionData(userData, JSON.parse(event.body), 'Wishlist');
      callback(null, await HttpResponse.modifyGameInWishlistHttpResponse(modifyWishlistData, userData));
      break;
    case ("/collection/wishlist/removeGame"):
      let removeGameData = CollectionCommon.serializeCollectionData(userData, JSON.parse(event.body), 'Wishlist');
      callback(null, await HttpResponse.removeGameFromWishlistHttpResponse(removeGameData, userData));
      break;
    default:
      callback(null, HttpResponse.httpResponse({statusCode: 400, body: JSON.stringify("Invalid operation.")}));
      break;
    }
}  
