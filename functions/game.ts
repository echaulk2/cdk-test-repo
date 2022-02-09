export class Game { 
    //Fields 
    partitionKey: string;
    sortKey: string;
    gameName: string;         
    yearReleased?: number;
    genre?: string;
    console?: string;
    developer?: string;
  
    //Constructor 
    constructor(userID:string, sortKey:string, gameName:string, yearReleased?:number, genre?:string, console?:string, developer?:string) { 
       this.partitionKey = `[User]#[${userID}]`,
       this.sortKey = sortKey,
       this.gameName = gameName,
       this.yearReleased = yearReleased,
       this.genre = genre,
       this.console = console,
       this.developer = developer
    }
 }