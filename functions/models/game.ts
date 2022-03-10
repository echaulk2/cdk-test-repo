import { GamePriceData } from "../models/gamePriceData";

export class Game { 
    //Fields 
    partitionKey: string;
    sortKey: string;
    itemType: string;
    gameName: string;      
    email: string;   
    yearReleased?: number;
    genre?: string;
    console?: string;
    developer?: string;
    desiredCondition?: string;
    desiredPrice?: number;
    gamePriceData?: GamePriceData;

    //Constructor 
    constructor(partitionKey:string, sortKey:string, itemType:string, gameName:string, email: string, yearReleased?:number, genre?:string, console?:string, developer?:string, desiredCondition?:string, desiredPrice?:number, gamePriceData?: GamePriceData) { 
       this.partitionKey = partitionKey,
       this.sortKey = sortKey,
       this.itemType = itemType,
       this.gameName = gameName,
       this.email = email,
       this.yearReleased = yearReleased,
       this.genre = genre,
       this.console = console,
       this.developer = developer,
       this.desiredCondition = desiredCondition,
       this.desiredPrice = desiredPrice,
       this.gamePriceData = gamePriceData
    }    
 }
