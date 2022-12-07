import { Game } from "../../models/game";
import { GamePriceData } from "../../models/gamePriceData";
import { GamePriceMonitor } from "../../models/gamePriceMonitor";

  export interface IUpdateExpression {
    updateExpression: String[],
    expressionAttributeNames: {},
    expressionAttributeValues: {}
  }

  export interface IPayloadData {
    gameID: string,
    gameName?: string,
    collectionID?: string,
    yearReleased?: number,
    genre?: string,
    console?: string,
    developer?: string,
    cover?: string,
    desiredCondition?: string,
    desiredPrice?: number,    
 }

  export interface IDynamoGameItem {
     partitionKey: string,
     sortKey: string,
     GS1: string,
     gameID: string,
     userID: string,
     itemType: string,
     gameName: string,
     yearReleased?: number,
     genre?: string,
     console?: string,
     developer?: string,
     cover?: string,
     collectionID?: string,
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
    getPriceData: (game: Game, gamePriceMonitor: GamePriceMonitor) => Promise<GamePriceData>
  }

  export interface IDynamoPriceData {
    partitionKey: string;
    gamePriceDataID: string;
    priceMonitorID: string;
    gameName: string;
    itemType: string;
    desiredPrice: string;
    desiredCondition: string;
    desiredPriceExists: boolean;
    lastChecked: string;
    lowestPrice?: string;
    averagePrice?: string;
    listedItemTitle?: string;
    listedItemURL?: string;
    listedItemConsole?: string;
    coverImageURL?: string;
  }

  export interface IUserData {
    userID: string,
    email: string
  }

  export interface IPaginatedParams {
    TableName?: string,
    IndexName?: string,
    KeyConditionExpression: string,
    ExpressionAttributeNames: {
      "#partitionKey"?: string,
      "#sortKey"?: string,
      "#itemType"?: string,
      "#GS1"?: string
    },
    ExpressionAttributeValues: {
      ":partitionKey"?: string,
      ":sortKey"?: string,
      ":itemType"?: string,
      ":GS1"?: string
    },
    ExclusiveStartKey?: string,
    LastEvaluatedKey?: string
  }

  export interface IDynamoGamePriceMonitor {
    partitionKey: string,
    sortKey: string,
    GS1: string,
    priceMonitorID: string,
    gameID: string,
    collectionID: string,
    userID: string,
    itemType: string,
    desiredCondition: string,
    desiredPrice: number
  }

  export interface IJSONGamePriceMonitor {
    priceMonitorID: string,
    gameID: string,
    collectionID: string,
    userID: string,
    desiredCondition: string,
    desiredPrice: number
  }
  
  export interface ICollection {
    partitionKey: string,
    sortKey: string,
    GS1: string,
    collectionID: string
  }

  export interface IDynamoUser {
    partitionKey: string,
    sortKey: string,
    GS1: string,
    userID: string,
    email: string
  }