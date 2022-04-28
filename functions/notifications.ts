import * as Collections from "./dataManager/collectionManager"
import { CollectionError } from "./error/collectionErrorHandler";
import { GamePriceError } from "./error/gamePriceErrorHandler";
import { httpResponse } from "./shared/common/httpResponse";
import * as Common from "./shared/common/collection";
import { getAllPriceMonitorsForGame } from "./dataManager/gamePriceMonitor";
import { getUser } from "./dataManager/userManager";

exports.handler = async (event: any, context: any, callback: any) => {
    try {
        let totalWishlistItems = await Collections.getAllGamesByCollectionType('Wishlist');
        for (let game of totalWishlistItems) {
          let gamePriceMonitors = await getAllPriceMonitorsForGame(game);
          let user = await getUser(game.userID);
          for (let gamePriceMonitor of gamePriceMonitors) {
            let gamePriceData = await Common.getLatestPriceData(gamePriceMonitor);
            if (gamePriceData.desiredPriceExists)              
              await Common.sendRunningPriceNotification(game, gamePriceData, user);
          }
        };
        return httpResponse({statusCode: 200, body: JSON.stringify("Wishlist Notification Emails Sent Successfully!")});
    } catch (err: any) {
        if (err instanceof CollectionError) {
          return httpResponse({statusCode: 400, body: 'Unable to send Wishlist notifications'});
        } else if (err instanceof GamePriceError) {
          return httpResponse({statusCode: 400, body: 'Error retrieving game price data'});
        } else {
          return httpResponse({statusCode: err.statusCode, body: err.message});    
        }
    }
}