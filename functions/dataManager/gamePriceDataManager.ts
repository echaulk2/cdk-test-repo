import { Game } from "../models/game";
import { GamePriceError } from "../error/gamePriceErrorHandler";
import { PriceCharting } from "./priceChartingDataManager";
import * as Config from "../shared/config/config";
import * as Common from "../shared/common/gamePriceData";
import { GamePriceData } from "../models/gamePriceData";

export async function createGamePriceData(game: Game) : Promise<GamePriceData> {
    let gamePriceData = await new PriceCharting().getPriceData(game);
    try {
        let params = {
          TableName: Config.table,
          Item: {
            partitionKey: game.partitionKey,
            sortKey: `[GamePriceData]#[${game.gameName}]`,
            itemType: '[GamePriceData]',
            lowestPrice: gamePriceData.lowestPrice,
            averagePrice: gamePriceData.averagePrice,
            listedItemTitle: gamePriceData.listedItemTitle,
            listedItemURL: gamePriceData.listedItemURL,
            listedItemConsole: gamePriceData.listedItemConsole,
            lastChecked: gamePriceData.lastChecked
          },
          ConditionExpression: 'attribute_not_exists(partitionKey) AND attribute_not_exists(sortKey)'
        }
        let response = await Config.docClient.put(params).promise();
        let priceDataResponse = await getGamePriceData(game);
        return priceDataResponse;
      } catch(err: any) {
        switch (err.code) {
          case ("ConditionalCheckFailedException"):
            throw new GamePriceError("Unable to create game price data.  Conditional Check Failed.", 400);
          default:
            throw err;
        }
      }
}

export async function getGamePriceData(game: Game) : Promise<GamePriceData> {
    let sortKey = `[GamePriceData]#[${game.gameName}]`;
    let params = {
        TableName: Config.table,
        Key: {
            partitionKey: game.partitionKey,
            sortKey: `[GamePriceData]#[${game.gameName}]`,
        },
        KeyConditionExpression: `sortKey = ${sortKey} AND partitionKey = ${game.partitionKey}`
    }
        
    try {
        let response = await Config.docClient.get(params).promise();
        let gamePriceData = Common.deserializeGamePriceData(response.Item);
        return gamePriceData;
    } catch (err: any) {
        switch (err.code) {
          case ("ConditionalCheckFailedException"):
            throw new GamePriceError("Unable to find game price data.  Conditional Check Failed.", 400);
          default:
            throw err;
        }
    }
}

export async function modifyGamePriceData(game: Game) : Promise<GamePriceData> { 
    try {
      await deleteGamePriceData(game);
      return await createGamePriceData(game);
    } catch (err: any) {
      throw err;
    }
  }

  export async function deleteGamePriceData(game: Game) : Promise<GamePriceData> {
    let params = {
      TableName: Config.table,
      Key: {
        partitionKey: game.partitionKey,
        sortKey: `[GamePriceData]#[${game.gameName}]`
      },
      KeyConditionExpression: `sortKey = ${game.sortKey} AND partitionKey = ${game.partitionKey}`,
      ConditionExpression: 'attribute_exists(sortKey) and attribute_exists(partitionKey)',
      ReturnValues: 'ALL_OLD'
    };
  
    try {
      let response = await Config.docClient.delete(params).promise();
      let gamePriceData = Common.deserializeGamePriceData(response.Attributes);
      return gamePriceData;      
    } catch (err: any) {
      switch (err.code) {
        case ("ConditionalCheckFailedException"):
          throw new GamePriceError("Unable to delete game price data.  Conditional Check Failed.", 400);
        default:
          throw err;
      }
    }
  }