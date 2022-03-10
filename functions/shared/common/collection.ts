import { Game } from "../../models/game";
import * as Interfaces from "../interfaces/interfaces";
import { getGamePriceData, modifyGamePriceData } from "../../dataManager/gamePriceDataManager";
import * as Config from "../config/config";
let AWS = require("aws-sdk");
let ses = new AWS.SES({ region: "us-east-1" });

export async function deserializeDynamoCollection(data: Interfaces.IDynamoGameItem) : Promise<Game> {
    let game = new Game(data.partitionKey, data.sortKey, data.itemType, data.gameName, data.email, data?.yearReleased, data?.genre, data?.console, data?.developer, data?.desiredCondition, data?.desiredPrice);
    if (game.desiredPrice)
      game.gamePriceData = await getGamePriceData(game);
    return game;
}
  
export function serializeCollectionData(userData: Interfaces.IUserData, data: Interfaces.IJSONPayload, collectionType: string) : Game {
    let partitionKey = `[User]#[${userData.userID}]`;
    let sortKey = `[CollectionItem]#[${collectionType}]#[GameItem]#[${data.gameName}]`;
    let itemType = `[CollectionItem]#[${collectionType}]#[GameItem]`;
    return new Game(partitionKey, sortKey, itemType, data.gameName, userData.email, data?.yearReleased, data?.genre, data?.console, data?.developer, data?.desiredCondition, data?.desiredPrice);
}

export async function sendRunningPriceNotification(game: Game) {
    var params = {
        Destination: {
            ToAddresses: [game.email],
        },
        Message: {
        Body: {
            Text: { Data: `Lowest Price: ${game.gamePriceData?.lowestPrice}\nURL: ${game.gamePriceData?.listedItemURL}\nAverage Price: ${game.gamePriceData?.averagePrice}` },
        },
        Subject: { Data: `Collection Item: Running Price - ${game.gameName}` },
        },
        Source: Config.sesSourceEmailAddress,
    };   
    return ses.sendEmail(params).promise()
}
  
export async function monitorRunningPrice(data: Interfaces.IDynamoGameItem) : Promise<Game> {
  let game = new Game(data.partitionKey, data.sortKey, data.itemType, data.gameName, data.email, data?.yearReleased, data?.genre, data?.console, data?.developer, data?.desiredCondition, data?.desiredPrice);
  if (game.desiredPrice)
    game.gamePriceData = await modifyGamePriceData(game);
  return game;
}