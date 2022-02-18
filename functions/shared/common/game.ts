import { getPriceData } from "../../dataManager/priceDataManager";
import { Game } from "../../models/game";
import * as Interfaces from "../interfaces/interfaces";
import * as Enums from "../enums/enums";
 
export async function generateModifyExpression(game: Game) : Promise<Interfaces.IUpdateExpression> {
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
    //Whenever a game is modified, this rechecks the price
    if (game.desiredPrice) {
      updateExpression.push('#gamePriceData = :gamePriceData');
      expressionAttributeNames['#gamePriceData'] = 'gamePriceData';
      expressionAttributeValues[':gamePriceData'] = await getPriceData(game);       
    }

    return {
      updateExpression: updateExpression,
      expressionAttributeNames: expressionAttributeNames,
      expressionAttributeValues: expressionAttributeValues
    }
  }

  export function serializeDynamoResponse(data: Interfaces.IDynamoObject) : Game {
    let game = new Game(data.partitionKey, data.sortKey, data.gameName, data?.yearReleased, data?.genre, data?.console, data?.developer, data?.desiredCondition, data?.desiredPrice, data?.gamePriceData);
    return game;
  }

  export function deserializeGameData(userID: string, data: Interfaces.IJSONPayload) : Game {
    let partitionKey = `[User]#[${userID}]`;
    let sortKey = `[GameItem]#[${data.gameName}]`;
    return new Game(partitionKey, sortKey, data.gameName, data?.yearReleased, data?.genre, data?.console, data?.developer);
  }
  
  export function deserializeCollectionData(userID: string, data: Interfaces.IJSONPayload, collectionType: string) : Game {
    let partitionKey = `[User]#[${userID}]`;
    let sortKey = `[CollectionItem]#[${collectionType}]#[GameItem]#[${data.gameName}]`;
    return new Game(partitionKey, sortKey, data.gameName, data?.yearReleased, data?.genre, data?.console, data?.developer, data?.desiredCondition, data?.desiredPrice);
  }