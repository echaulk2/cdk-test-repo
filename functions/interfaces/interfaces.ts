import { RunningPriceData } from "../models/runningPriceData";

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
    desiredCondition?: string
    desiredPrice?: number,    
 }

  export interface IDynamoObject {
     partitionKey: string,   
     sortKey: string,
     gameName: string,
     yearReleased?: number,
     genre?: string,
     console?: string,
     developer?: string,
     desiredCondition?: string,
     desiredPrice?: number,     
     lowestRunningPrice?: RunningPriceData,
  }
  
  export interface IHttpResponse {
     statusCode: number,
     body: string,
  }

  export interface IGamePriceObject {
    gameName: string,
    price: number,
    url: string
  }