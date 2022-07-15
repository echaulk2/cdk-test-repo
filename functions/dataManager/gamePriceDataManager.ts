import { Game } from "../models/game";
import { GamePriceError } from "../error/gamePriceErrorHandler";
import { PriceCharting } from "./priceChartingDataManager";
import * as Config from "../shared/config/config";
import * as Common from "../shared/common/gamePriceData";
import { GamePriceData } from "../models/gamePriceData";
import { GamePriceMonitor } from "../models/gamePriceMonitor";
import { getGameInCollection } from "./collectionManager";

export async function createGamePriceData(gamePriceMonitor: GamePriceMonitor) : Promise<GamePriceData> {
    let game: Game = {
      gameID: gamePriceMonitor.gameID,
      userID: gamePriceMonitor.userID,
      collectionID: gamePriceMonitor.collectionID
    };
    let gameData = await getGameInCollection(game);
    let gamePriceData = await new PriceCharting().getPriceData(gameData, gamePriceMonitor);

    try {
        let params = {
          TableName: Config.table,
          Item: {
            partitionKey: gamePriceMonitor.userID,
            sortKey: `[Collection]#[${gamePriceMonitor.collectionID}]#[Game]#[${gamePriceMonitor.gameID}]#[GamePriceMonitor]#[${gamePriceMonitor.priceMonitorID}]#[GamePriceData]#[${gamePriceData.gamePriceDataID}]`,
            GS1: gamePriceData.gamePriceDataID,
            gamePriceDataID: gamePriceData.gamePriceDataID,
            priceMonitorID: gamePriceMonitor.priceMonitorID,
            itemType: `[GamePriceData]`,
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
  let sortKey = `[Collection]#[${gamePriceMonitor?.collectionID}]#[Game]#[${gamePriceMonitor.gameID}]#[GamePriceMonitor]#[${gamePriceMonitor.priceMonitorID}]#[GamePriceData]`;

  let params = {
      TableName: Config.table,
      KeyConditionExpression: "#partitionKey = :partitionKey AND begins_with(#sortKey, :sortKey)",
      ExpressionAttributeNames: {
        "#partitionKey": "partitionKey",
        "#sortKey": "sortKey"
      },
      ExpressionAttributeValues: {
        ":partitionKey": gamePriceMonitor.userID,
        ":sortKey": sortKey
      },
      ScanIndexForward: false,
      Limit: 1
  }
      
  try {
      let response = await Config.docClient.query(params).promise();
      let gamePriceData = [] as any;
      if (response.Items) {
        gamePriceData = Common.deserializeGamePriceData(response.Items[0]);
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