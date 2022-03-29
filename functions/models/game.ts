import { GamePriceData } from "../models/gamePriceData";

export class Game { 
    //Fields 
    id: string;
    userID: string;
    email: string;
    gameName?: string;
    itemType?: string;
    collectionID?: string;
    yearReleased?: number;
    genre?: string;
    console?: string;
    developer?: string;
    gamePriceData?: [GamePriceData];

    //Constructor 
    constructor(id: string, userID: string, email: string, gameName?:string, itemType?:string, collectionID?: string,  yearReleased?:number, genre?:string, console?:string, developer?:string, gamePriceData?: [GamePriceData]) { 
       this.id = id,
       this.userID = userID,
       this.email = email,          
       this.gameName = gameName,
       this.itemType = itemType,
       this.collectionID = collectionID,
       this.yearReleased = yearReleased,
       this.genre = genre,
       this.console = console,
       this.developer = developer,
       this.gamePriceData = gamePriceData
    }    
 }
