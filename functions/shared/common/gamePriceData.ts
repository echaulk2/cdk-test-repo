import * as Enums from "../enums/enums";
import * as Interfaces from "../interfaces/interfaces";
import { Game } from "../../models/game";
import { GamePriceData } from "../../models/gamePriceData";
import { last } from "cheerio/lib/api/traversing";

export function setDesiredCondition(condition: string) : Enums.DesiredCondition {
    switch(condition) {
       case('loose'):
          return Enums.DesiredCondition.loose;
          break;
       case('cib'):
          return Enums.DesiredCondition.completeInBox;
          break;
       default:
          return Enums.DesiredCondition.new;
          break;        
    }
  }
  
  export function invalidData(game: Game, price: number, console: string) : Boolean {
    //Validates whether the game in the row is for the same console in the user's game collection
    if (game.console && !console.includes(game.console)) {
      return true;
    } 
    //Validates whether a price exists in the row
    if (price == 0) {
      return true;
    }
    return false;
  }

  export function generateModifyExpression(gamePriceData: GamePriceData) : Interfaces.IUpdateExpression {
    let updateExpression: String[] = [];
    let expressionAttributeNames = {} as any;
    let expressionAttributeValues = {} as any;
    
    //Generate dynammic update expression based on allowed parameters
    for (let [key, value] of Object.entries(gamePriceData)) {
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

  export function deserializeGamePriceData(data: Interfaces.IDynamoPriceData) : GamePriceData {
    return new GamePriceData(data.partitionKey, data.gameName, data.itemType, data.desiredPrice, data.desiredCondition, data.desiredPriceExists, data.lastChecked, data?.lowestPrice, data?.averagePrice, data?.listedItemTitle, data?.listedItemURL, data?.listedItemConsole);    
  }

  export function generateTimeToLive(date: string) {
    //Expire after 30 days
    let newDate = new Date(date);
    return newDate.setDate(newDate.getDate() + 30);
  }