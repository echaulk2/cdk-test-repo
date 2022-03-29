import { Game } from "../../models/game";
import { GamePriceData } from "../../models/gamePriceData";
import { GamePriceMonitor } from "../../models/gamePriceMonitor";

  export interface IUpdateExpression {
    updateExpression: String[],
    expressionAttributeNames: {},
    expressionAttributeValues: {}
  }

  export interface IPayloadData {
    id: string,
    gameName: string,
    collectionID?: string,
    yearReleased?: number,
    genre?: string,
    console?: string,
    developer?: string,
    desiredCondition?: string,
    desiredPrice?: number,    
 }

  export interface IDynamoGameItem {
     id: string,
     collectionID: string,
     gameName: string,
     userID: string,
     email: string,
     itemType: string,
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
    getPriceData: (game: Game, gamePriceMonitor: GamePriceMonitor) => Promise<GamePriceData>
  }

  export interface IDynamoPriceData {
    partitionKey: string;
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

  export interface IDynamoGamePriceMonitor {
    partitionKey: string,
    sortKey: string,
    collectionID: string,
    userID: string,
    email: string,
    desiredCondition: string,
    desiredPrice: number
  }

  export interface IJSONGamePriceMonitor {
    id: string,
    collectionID: string,
    userID: string,
    email: string,
    desiredCondition: string,
    desiredPrice: number
  }