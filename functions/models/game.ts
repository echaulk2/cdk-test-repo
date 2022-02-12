import { getLowestPriceData } from "../dataManger/runningPriceDataManager"
import { RunningPriceData } from "../models/runningPriceData";
export class Game { 
    //Fields 
    partitionKey: string;
    sortKey: string;
    gameName: string;         
    yearReleased?: number;
    genre?: string;
    console?: string;
    developer?: string;
    desiredCondition?: string;
    desiredPrice?: number;
    lowestRunningPrice?: RunningPriceData;
  
    //Constructor 
    constructor(userID:string, sortKey:string, gameName:string, yearReleased?:number, genre?:string, console?:string, developer?:string, desiredCondition?:string, desiredPrice?:number, lowestRunningPrice?: RunningPriceData) { 
       this.partitionKey = `[User]#[${userID}]`,
       this.sortKey = sortKey,
       this.gameName = gameName,
       this.yearReleased = yearReleased,
       this.genre = genre,
       this.console = console,
       this.developer = developer,
       this.desiredCondition = desiredCondition,
       this.desiredPrice = desiredPrice,
       this.lowestRunningPrice = lowestRunningPrice
    }
 }