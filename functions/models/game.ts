import { PriceData } from "../models/priceData";
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
    priceData?: PriceData;
  
    //Constructor 
    constructor(userID:string, sortKey:string, gameName:string, yearReleased?:number, genre?:string, console?:string, developer?:string, desiredCondition?:string, desiredPrice?:number, priceData?: PriceData) { 
       this.partitionKey = `[User]#[${userID}]`,
       this.sortKey = sortKey,
       this.gameName = gameName,
       this.yearReleased = yearReleased,
       this.genre = genre,
       this.console = console,
       this.developer = developer,
       this.desiredCondition = desiredCondition,
       this.desiredPrice = desiredPrice,
       this.priceData = priceData
    }
 }