import { Game } from "../../models/game";
import { GamePriceData } from "../../models/gamePriceData";

  export interface IUpdateExpression {
    updateExpression: String[],
    expressionAttributeNames: {},
    expressionAttributeValues: {}
  }

  export interface IJSONPayload {
    gameName: string,
    yearReleased?: number,
    genre?: string,
    console?: string,
    developer?: string,
    desiredCondition?: string,
    desiredPrice?: number,    
 }

  export interface IDynamoGameItem {
     partitionKey: string,   
     sortKey: string,
     itemType: string,
     gameName: string,
     email: string,
     yearReleased?: number,
     genre?: string,
     console?: string,
     developer?: string,
     desiredCondition?: string,
     desiredPrice?: number
  }
  
  export interface IHttpResponse {
     statusCode: number,
     body: string,
  }

  export interface IDynamoGamePriceItem {
    gameName: string,
    price: number,
    url: string
  }

  export interface IPriceProviders {
    getPriceData: (game: Game) => Promise<GamePriceData>
  }

  export interface IDynamoPriceData {
    partitionKey: string;
    sortKey: string;
    itemType: string;
    lowestPrice?: string;
    averagePrice?: string;
    listedItemTitle?: string;
    listedItemURL?: string;
    listedItemConsole?: string;
    lastChecked?: string;
  }

  export interface IUserData {
    userID: string,
    email: string
  }

  export interface IGameParams {
    TableName?: string,
    KeyConditionExpression: string,
    ExpressionAttributeNames: {
      "#partitionKey": string,
      "#sortKey": string
    },
    ExpressionAttributeValues: {
      ":partitionKey": string,
      ":sortKey": string
    },
    ExclusiveStartKey?: string,
    LastEvaluatedKey?: string
  }

  export interface ICollecionParams {
    TableName?: string,
    IndexName?: string,
    KeyConditionExpression: string,
    ExpressionAttributeNames: {
      "#partitionKey"?: string,
      "#sortKey"?: string,
      "#itemType"?: string
    },
    ExpressionAttributeValues: {
      ":partitionKey"?: string,
      ":sortKey"?: string,
      ":itemType"?: string
    },
    ExclusiveStartKey?: string,
    LastEvaluatedKey?: string
  }