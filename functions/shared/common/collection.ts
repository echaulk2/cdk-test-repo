import { Game } from "../../models/game";
import * as Interfaces from "../interfaces/interfaces";
import { createGamePriceData, getLatestGamePriceData } from "../../dataManager/gamePriceDataManager";
import * as Config from "../config/config";
import { Collection } from "../../models/collection";
import { getAllPriceMonitorsForGame } from "../../dataManager/gamePriceMonitor";
import { GamePriceData } from "../../models/gamePriceData";
import { GamePriceMonitor } from "../../models/gamePriceMonitor";
import { User } from "../../models/user";
import { Wishlist } from "../../models/wishlist";

let AWS = require("aws-sdk");
let ses = new AWS.SES({ region: "us-east-1" });

export async function deserializeDynamoCollection(data: Interfaces.IDynamoGameItem) : Promise<Game> {
    let game = new Game(data.gameID, data.userID, data.gameName, data?.yearReleased, data?.genre, data?.console, data?.developer, data?.cover, data?.collectionID);
    let gamePriceMonitors = await getAllPriceMonitorsForGame(game);
    let priceMonitorsWithLatestData = [] as any;
    if (gamePriceMonitors.length > 0) {
        for (let gamePriceMonitor of gamePriceMonitors) {
            gamePriceMonitor.gamePriceData = await getLatestGamePriceData(gamePriceMonitor);
            priceMonitorsWithLatestData.push(gamePriceMonitor);
        }
    }
    game.priceMonitorData = priceMonitorsWithLatestData;
    return game;
}

export async function sendRunningPriceNotification(game: Game, gamePriceData: GamePriceData, user: User) {
    var params = {
        Destination: {
            ToAddresses: [user.email],
        },
        Message: {
        Body: {
            Text: { Data: `Lowest Price: ${gamePriceData?.lowestPrice}\nURL: ${gamePriceData?.listedItemURL}\nAverage Price: ${gamePriceData?.averagePrice}\nCondition: ${gamePriceData.desiredCondition}` },
        },
        Subject: { Data: `Collection Item: Running Price - ${game.gameName}` },
        },
        Source: Config.sesSourceEmailAddress,
    };   
    return ses.sendEmail(params).promise()
}
  
export async function getLatestPriceData(gamePriceMonitor: GamePriceMonitor) : Promise<GamePriceData> {
  return await createGamePriceData(gamePriceMonitor);
}

export function serializeNewWishlist(userData: Interfaces.IUserData) : Wishlist {
    let wishlistID = `Col-${Config.uuidv4()}`;
    return new Wishlist(userData.userID, wishlistID);
}

export function deserializeCollection(data: Interfaces.ICollection) : Collection {
    let collection = new Collection(data.partitionKey, data.collectionID);
    return collection;
}