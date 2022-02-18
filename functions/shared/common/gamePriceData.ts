import * as Enums from "../enums/enums";
import { Game } from "../../models/game";

export function setDesiredCondition(condition?: string) : Enums.DesiredCondition {
    switch(condition) {
       case('loose'):
          return Enums.DesiredCondition.loose;
          break;
       case('cib'):
          return Enums.DesiredCondition.cib;
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