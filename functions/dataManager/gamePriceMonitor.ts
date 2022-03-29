import { GamePriceMonitor } from "../models/gamePriceMonitor";
import * as Config from "../shared/config/config";
import * as CommonGame from "../shared/common/game";
import * as Common from "../shared/common/gamePriceMonitor";
import { createGamePriceData } from "./gamePriceDataManager";
import  { GamePriceMonitorError } from "../error/gamePriceMonitorErrorHandler";

export async function createGamePriceMonitor(gamePriceMonitor: GamePriceMonitor) {
    try {
      let params = {
        TableName: Config.table,
        Item: {
            partitionKey: gamePriceMonitor.id,
            sortKey: `[GamePriceMonitor]#[${gamePriceMonitor.desiredCondition}]`,
            userID: gamePriceMonitor.userID,
            email: gamePriceMonitor.email,
            itemType: `[GamePriceMonitor]`,
            collectionID: gamePriceMonitor.collectionID,
            desiredCondition: gamePriceMonitor.desiredCondition,
            desiredPrice: gamePriceMonitor.desiredPrice
        },
        ConditionExpression: 'attribute_not_exists(partitionKey) AND attribute_not_exists(sortKey)'
    }
    let response = await Config.docClient.put(params).promise();
    let priceMonitor = getGamePriceMonitor(gamePriceMonitor);
    return priceMonitor;
  } catch (err: any) {
    switch (err.code) {
      case ("ConditionalCheckFailedException"):
        throw new GamePriceMonitorError("Unable to create Game Price Monitor.  Conditional Check Failed.");
      default:
        throw err;
    }
  }
}

export async function modifyGamePriceMonitor(gamePriceMonitor: GamePriceMonitor) {
  try {
    let partitionKey = gamePriceMonitor.id;
    let sortKey = `[GamePriceMonitor]#[${gamePriceMonitor.desiredCondition}]`; 
    let template = await CommonGame.generateModifyExpression(gamePriceMonitor);
  
    let params = {
      TableName: Config.table,
      Key: {
        partitionKey: partitionKey,
        sortKey: sortKey,
      },
      KeyConditionExpression: `partitionKey = ${partitionKey} and sortKey = ${sortKey}`,
      UpdateExpression: `SET ${template.updateExpression.join(",")}`,
      ExpressionAttributeNames: template.expressionAttributeNames,
      ExpressionAttributeValues: template.expressionAttributeValues,
      ConditionExpression: 'attribute_exists(partitionKey) and attribute_exists(sortKey)',
      ReturnValues: 'ALL_NEW'
    };
    let response = await Config.docClient.update(params).promise();
    let priceMonitor = getGamePriceMonitor(gamePriceMonitor);
    return priceMonitor;
  } catch (err: any) {
    switch (err.code) {
      case ("ConditionalCheckFailedException"):
        throw new GamePriceMonitorError("Unable to modify Game Price Monitor.  Conditional Check Failed.");
      default:
        throw err;
    }
  }
}

export async function deleteGamePriceMonitor(gamePriceMonitor: GamePriceMonitor) {
  let partitionKey = gamePriceMonitor.id;
  let sortKey = `[GamePriceMonitor]#[${gamePriceMonitor.desiredCondition}]`; 
  let params = {
    TableName: Config.table,
    Key: {
      partitionKey: partitionKey,
      sortKey: sortKey
    },
    KeyConditionExpression: `partitionKey = ${partitionKey} AND sortKey = ${sortKey}`,
    ConditionExpression: 'attribute_exists(partitionKey) and attribute_exists(sortKey)',
    ReturnValues: 'ALL_OLD'
  };

  try {
    let response = await Config.docClient.delete(params).promise();
    let priceMonitor = Common.deserializeGamePriceMonitorData(response.Attributes);
    return priceMonitor;
  } catch (err: any) {
    switch (err.code) {
      case ("ConditionalCheckFailedException"):
        throw new GamePriceMonitorError("Unable to delete game price monitor.  Conditional Check Failed.");
      default:
        throw err;
    }
  }
}

export async function getGamePriceMonitor(gamePriceMonitor: GamePriceMonitor) : Promise<GamePriceMonitor> {
  let partitionKey = gamePriceMonitor.id;
  let sortKey = `[GamePriceMonitor]#[${gamePriceMonitor.desiredCondition}]`;
  let params = {
    TableName: Config.table,
    Key: {
      partitionKey: partitionKey,
      sortKey: sortKey
    },
    KeyConditionExpression: `partitionKey = ${partitionKey} and sortKey = ${sortKey}`
  }
    
  try {
    let response = await Config.docClient.get(params).promise();
    if (response.Item) {
      return Common.deserializeGamePriceMonitorData(response.Item);
    } else {
      throw new GamePriceMonitorError("Unable to get game price monitor. Game price monitor not found.");
    }      
  } catch (err: any) {
    switch (err.code) {
      case ("ConditionalCheckFailedException"):
        throw new GamePriceMonitorError("Unable to get game price monitor.  Conditional Check Failed.");
      default:
        throw err;
    }
  }
}

export async function getAllPriceMonitorsForGame(id: string) : Promise<[GamePriceMonitor]> {
    let params = {
      TableName: Config.table,
      KeyConditionExpression: "#partitionKey = :partitionKey and begins_with(#sortKey, :sortKey)",
      ExpressionAttributeNames: {
          "#partitionKey": "partitionKey",
          "#sortKey": "sortKey"
      },
      ExpressionAttributeValues: {
          ":partitionKey": id,
          ":sortKey": "[GamePriceMonitor]"
      }
    };
    
    let paginatedData = await CommonGame.getPaginatedData(params);
    let gamePriceMonitorList = [] as any;
    if (paginatedData.length > 0) {
      for (let data of paginatedData) {
        let gamePriceMonitor = Common.deserializeGamePriceMonitorData(data);
        gamePriceMonitorList.push(gamePriceMonitor);
      }
    }
    return gamePriceMonitorList;
  }