export class Game { 
    //Fields 
    gameName: string; 
    yearReleased?: number;
    genre?: string;
    console?: string;
    developer?: string;
  
    //Constructor 
    constructor(gameName:string, yearReleased?:number, genre?:string, console?:string, developer?:string) { 
       this.gameName = gameName,
       this.yearReleased = yearReleased,
       this.genre = genre,
       this.console = console,
       this.developer = developer
    }
 }

export interface IHttpResponse {
   statusCode: number,
   body: string,
}