import { Game } from "../../models/game";
import * as Interfaces from "../interfaces/interfaces";
import * as Enums from "../enums/enums";
import { modifyGamePriceData } from "../../dataManager/gamePriceDataManager";

export function generateModifyExpression(game: Game) : Interfaces.IUpdateExpression {
  let updateExpression: String[] = [];
  let expressionAttributeNames = {} as any;
  let expressionAttributeValues = {} as any;
  
  //Generate dynammic update expression based on allowed parameters
  for (let [key, value] of Object.entries(game)) {
    if (!Object.keys(Enums.excludedKeys).includes(key) && value != undefined) {
      updateExpression.push(`#${key} = :${key}`);
      expressionAttributeNames[`#${key}`] = key ;
      expressionAttributeValues[`:${key}`] = value;  
    }
  }
  return {
    updateExpression: updateExpression,
    expressionAttributeNames: expressionAttributeNames,
    expressionAttributeValues: expressionAttributeValues
  }
}

export function deserializeGameData(data: Interfaces.IDynamoGameItem) : Game {
  return new Game(data.partitionKey, data.sortKey, data.itemType, data.gameName, data.email, data?.yearReleased, data?.genre, data?.console, data?.developer, data?.desiredCondition, data?.desiredPrice);
}

export function serializeGameData(userData: Interfaces.IUserData, data: Interfaces.IJSONPayload) : Game {
  let partitionKey = `[User]#[${userData.userID}]`;
  let sortKey = `[GameItem]#[${data.gameName}]`;
  let itemType = '[GameItem]'
  return new Game(partitionKey, sortKey, itemType, data.gameName, userData.email, data?.yearReleased, data?.genre, data?.console, data?.developer);
}