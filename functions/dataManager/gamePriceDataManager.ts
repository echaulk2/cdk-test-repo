import { Game } from "../models/game";
import { GamePriceError } from "../error/gamePriceErrorHandler";
import { PriceCharting } from "./priceChartingDataManager";
import * as Config from "../shared/config/config";
import * as Common from "../shared/common/gamePriceData";
import { GamePriceData } from "../models/gamePriceData";
import { GamePriceMonitor } from "../models/gamePriceMonitor";
import { getGameInCollection } from "./collectionManager";
import { Wishlist } from "../models/wishlist";

export async function createGamePriceData(gamePriceMonitor: GamePriceMonitor) : Promise<GamePriceData> {
    console.log('hello world');
    let game = new Game(gamePriceMonitor.id, gamePriceMonitor.userID, gamePriceMonitor.email);
    let collection = new Wishlist(gamePriceMonitor.userID, gamePriceMonitor.collectionID);
    let gameData = await getGameInCollection(game, collection);
    let gamePriceData = await new PriceCharting().getPriceData(gameData, gamePriceMonitor);

    try {
        let params = {
          TableName: Config.table,
          Item: {
            partitionKey: gamePriceMonitor.id,
            sortKey: `[GamePriceData]#[${gamePriceMonitor.id}]#[${gamePriceMonitor.desiredCondition}]#[${Date.parse(gamePriceData.lastChecked)}]`,
            itemType: `[GamePriceData]#[${gamePriceMonitor.desiredCondition}]`,
            collectionID: gamePriceMonitor.collectionID,
            desiredPrice: gamePriceMonitor.desiredPrice,
            desiredCondition: gamePriceMonitor.desiredCondition,
            desiredPriceExists: gamePriceData.desiredPriceExists,
            lastChecked: gamePriceData.lastChecked,
            lowestPrice: gamePriceData.lowestPrice,
            averagePrice: gamePriceData.averagePrice,
            listedItemTitle: gamePriceData.listedItemTitle,
            listedItemURL: gamePriceData.listedItemURL,
            listedItemConsole: gamePriceData.listedItemConsole,
            expirationDate: Common.generateTimeToLive(gamePriceData.lastChecked)
          }
        }
        let response = await Config.docClient.put(params).promise();
        let priceDataResponse = await getLatestGamePriceData(gamePriceMonitor);
        return priceDataResponse;
      } catch(err: any) {
        switch (err.code) {
          case ("ConditionalCheckFailedException"):
            throw new GamePriceError("Unable to create game price data.  Conditional Check Failed.");
          default:
            throw err;
        }
      }
}

export async function getLatestGamePriceData(gamePriceMonitor: GamePriceMonitor) : Promise<GamePriceData> {
  let sortKey = `[GamePriceData]#[${gamePriceMonitor.id}]#[${gamePriceMonitor.desiredCondition}]`;

  let params = {
      TableName: Config.table,
      KeyConditionExpression: "#partitionKey = :partitionKey AND begins_with(#sortKey, :sortKey)",
      ExpressionAttributeNames: {
        "#partitionKey": "partitionKey",
        "#sortKey": "sortKey"
      },
      ExpressionAttributeValues: {
        ":partitionKey": gamePriceMonitor.id,
        ":sortKey": sortKey
      }
  }
      
  try {
      let response = await Config.docClient.query(params).promise();
      let gamePriceData = [] as any;
      if (response.Items) {
        let index = response.Items.length - 1;
        gamePriceData = Common.deserializeGamePriceData(response.Items[index]);
      }
      return gamePriceData;
  } catch (err: any) {
      switch (err.code) {
        case ("ConditionalCheckFailedException"):
          throw new GamePriceError("Unable to find game price data.  Conditional Check Failed.");
        default:
          throw err;
      }
  }
}