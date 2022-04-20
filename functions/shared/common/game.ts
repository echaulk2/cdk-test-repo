import { Game } from "../../models/game";
import * as Interfaces from "../interfaces/interfaces";
import * as Enums from "../enums/enums";
import * as Config from "../config/config";

export function generateModifyExpression(dynamoObject: any) : Interfaces.IUpdateExpression {
  let updateExpression: String[] = [];
  let expressionAttributeNames = {} as any;
  let expressionAttributeValues = {} as any;
  
  //Generate dynammic update expression based on allowed parameters
  for (let [key, value] of Object.entries(dynamoObject)) {
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
  return new Game(data.gameID, data.userID, data.gameName, data?.yearReleased, data?.genre, data?.console, data?.developer, data?.collectionID);
}

export function serializeExistingGameData(userData: Interfaces.IUserData, data: Interfaces.IPayloadData) : Game {
  return new Game(data.gameID, userData.userID, data.gameName, data?.yearReleased, data?.genre, data?.console, data?.developer, data?.collectionID);
}

export function serializeNewGameData(userData: Interfaces.IUserData, data: Interfaces.IPayloadData) : Game {
  let gameID = `G-${Config.uuidv4()}`;
  return new Game(gameID, userData.userID, data.gameName, data?.yearReleased, data?.genre, data?.console, data?.developer, data?.collectionID);
}

export async function getPaginatedData(params: Interfaces.IPaginatedParams) : Promise<Array<any>>{
  let paginatedData = [] as any;
  let lastEvaluatedKeyExists = true;
  do {
    let response = await Config.docClient.query(params).promise();
    if(response['Items'].length > 0) {
      paginatedData = [...paginatedData, ...response['Items']];
    }
    if (response.LastEvaluatedKey) {
      params.ExclusiveStartKey = response.LastEvaluatedKey;
      continue;
    }
    lastEvaluatedKeyExists = false;
  } while (lastEvaluatedKeyExists);
  return paginatedData;
}