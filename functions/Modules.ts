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
const table = process.env.DYNAMO_DB_TABLE;

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
    
    //Database CRUD Methods
    async GetGame() {
      let params = {
        TableName: table,
        Key: {
          gameName: this.gameName
        }
      };
      try {
        let response = await docClient.get(params).promise();
        return response;
      } catch (err) {
        return err;
      }
    }

    async CreateGame() {
      let params = {
        TableName: table,
        Item: {
          gameName: this.gameName,
          genre: this.genre,
          yearReleased: this.yearReleased,
          developer: this.developer,
          console: this.console
        },
        ConditionExpression: 'attribute_not_exists(gameName)'
      }
  
      try {
        await docClient.put(params).promise();
        let createdGame = this.GetGame();
        return createdGame;
      } catch(err) {
        return err;
      }
    }
  
    async ModifyGame() {
      let updateExpression: String[] = [];
      let expressionAttributeNames = {} as any;
      let expressionAttributeValues = {} as any;
      //Generate dynammic update expression based on allowed parameters
      for (let [key, value] of Object.entries(this)) {
        if (key != 'gameName' && value != undefined) {
          updateExpression.push(`#${key} = :${key}`);
          expressionAttributeNames['#'+key] = key ;
          expressionAttributeValues[':'+key]=`${value}`;  
        }
      }
  
      let params = {
        TableName: table,
        Key: {
          gameName: this.gameName
        },
        UpdateExpression: `SET ${updateExpression.join(",")}`,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
        ConditionExpression: 'attribute_exists(gameName)',
        ReturnValues: 'ALL_NEW'
      };
  
      try {
        await docClient.update(params).promise();
        let modifiedGame = this.GetGame();
        return modifiedGame;
      } catch (err) {
        return err;
      }
    }
  
    async DeleteGame() {
      let params = {
        TableName: table,
        Key: {
            gameName: this.gameName
        },
        ReturnValues: 'ALL_OLD'
      };
  
      try {
        let response = await docClient.delete(params).promise();
        return response;
      } catch (err) {
        return err;
      }
    }
 }

export async function ListGames() {
  let params = {
    TableName: table,
    Select: "ALL_ATTRIBUTES"
  };

  try {
     let response = await docClient.scan(params).promise();
     return response;
  } catch (err) {
     return err;
  }
}

export interface IDynamoObject {
   gameName: string,
   yearReleased?: number,
   genre?: string,
   console?: string,
   developer?: string
}

export interface IHttpResponse {
   statusCode: number,
   body: string,
}