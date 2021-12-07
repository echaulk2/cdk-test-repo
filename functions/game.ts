const AWS = require('aws-sdk');
const isTest = process.env.JEST_WORKER_ID;
const config = {
  convertEmptyValues: true,
  ...(isTest && {
    endpoint: 'localhost:8000',
    sslEnabled: false,
    region: 'local-env',
  }),
};
const docClient = new AWS.DynamoDB.DocumentClient(config);
const table = (isTest) ? process.env.DYNAMO_DB_TEST_TABLE : process.env.DYNAMO_DB_GAME_TABLE;
import { GameError } from "./gameErrorHandler";
import { getGame } from "./gameManager";

export class Game { 
    //Fields 
    userID: string;
    gameName: string;     
    yearReleased?: number;
    genre?: string;
    console?: string;
    developer?: string;
  
    //Constructor 
    constructor(userID:string, gameName:string, yearReleased?:number, genre?:string, console?:string, developer?:string) { 
       this.userID = userID,
       this.gameName = gameName,
       this.yearReleased = yearReleased,
       this.genre = genre,
       this.console = console,
       this.developer = developer
    }
    
    async createGame(): Promise<Game> {
      let params = {
        TableName: table,
        Item: {
          userID: this.userID,
          gameName: this.gameName,          
          genre: this.genre,
          yearReleased: this.yearReleased,
          developer: this.developer,
          console: this.console
        },
        ConditionExpression: 'attribute_not_exists(gameName) AND attribute_not_exists(userID)'
      }
  
      try {
        let response = await docClient.put(params).promise();
        let game = await getGame(this);
        return game;
      } catch(err: any) {
        throw new GameError(err.message, err.statusCode);
      }
    }
 }