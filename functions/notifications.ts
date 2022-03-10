import * as Collections from "./dataManager/collectionManager"
import { CollectionError } from "./error/collectionErrorHandler";
import { GamePriceError } from "./error/gamePriceErrorHandler";
import { httpResponse } from "./shared/common/httpResponse";

exports.handler = async (event: any, context: any, callback: any) => {
    try {
        let response = await Collections.getAllCollectionItems('Wishlist');
        return httpResponse({statusCode: 200, body: JSON.stringify("Wishlist Notification Emails Sent Successfully!")});
    } catch (err: any) {
        if (err instanceof CollectionError) {
          return httpResponse({statusCode: err.statusCode, body: 'Unable to send Wishlist notifications'});
        } else if (err instanceof GamePriceError) {
          return httpResponse({statusCode: err.statusCode, body: 'Error retrieving game price data'});
        } else {
          return httpResponse({statusCode: err.statusCode, body: err.message});    
        }
    }
}