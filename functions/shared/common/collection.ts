import { Game } from "../../models/game";
import * as Interfaces from "../interfaces/interfaces";
import { createGamePriceData, getLatestGamePriceData } from "../../dataManager/gamePriceDataManager";
import * as Config from "../config/config";
import { Collection } from "../../models/collection";
import { getAllPriceMonitorsForGame } from "../../dataManager/gamePriceMonitor";
import { GamePriceData } from "../../models/gamePriceData";
import { GamePriceMonitor } from "../../models/gamePriceMonitor";

let AWS = require("aws-sdk");
let ses = new AWS.SES({ region: "us-east-1" });

export async function deserializeDynamoCollection(data: Interfaces.IDynamoGameItem, collection: Collection) : Promise<Game> {
    let game = new Game(data.id, data.userID, data.email, data.gameName, data.itemType, data.collectionID, data?.yearReleased, data?.genre, data?.console, data?.developer);
    let gamePriceMonitors = await getAllPriceMonitorsForGame(game.id);
    let gamePriceDataList = [] as any;
    if (gamePriceMonitors.length > 0) {
        for (let gamePriceMonitor of gamePriceMonitors) {
            gamePriceDataList.push(await getLatestGamePriceData(gamePriceMonitor));
        }
        game.gamePriceData = gamePriceDataList;
    }
    return game;
}

export async function sendRunningPriceNotification(game: Game, gamePriceData: GamePriceData) {
    var params = {
        Destination: {
            ToAddresses: [game.email],
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