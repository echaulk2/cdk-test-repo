import { GamePriceMonitor } from "./gamePriceMonitor";

export class Game { 
    //Fields 
    gameID: string;
    userID: string;
    gameName?: string;
    yearReleased?: number;
    genre?: string;
    console?: string;
    developer?: string;    
    collectionID?: string;
    priceMonitorData?: [GamePriceMonitor];

    //Constructor 
    constructor(gameID: string, userID: string, gameName?:string, yearReleased?:number, genre?:string, console?:string, developer?:string, collectionID?:string, priceMonitorData?: [GamePriceMonitor]) { 
       this.gameID = gameID,
       this.userID = userID,      
       this.gameName = gameName,
       this.yearReleased = yearReleased,
       this.genre = genre,
       this.console = console,
       this.developer = developer,       
       this.collectionID = collectionID,
       this.priceMonitorData = priceMonitorData
    }    
 }

