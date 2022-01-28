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
import { Game } from "./game";
import { IDynamoObject } from "./gameManager";
import { getCollection } from "./collectionManager";
import { CollectionError } from "./collectionErrorHandler";

export class Collection {
    userID: string;
    sortKey: string;    
    collectionType: string;
    games?: Game[];

    constructor(userID:string, collectionType:string, games?:Game[]) {
        this.userID = userID,
        this.collectionType = collectionType,
        this.sortKey = `[${userID}]#[collection]#[${collectionType}]`;
        this.games = games;
    }

    async createCollection(): Promise<Collection> {
        let params = {
            TableName: table,
            Item: {
              userID: this.userID,
              sortKey: this.sortKey,
              collectionType: this.collectionType,
              games: this.games
            },
            ConditionExpression: 'attribute_not_exists(collectionType) AND attribute_not_exists(userID) AND attribute_not_exists(sortKey)'
          }
          
        try {
            let response = await docClient.put(params).promise();
            let collection = await getCollection(this.userID, this.collectionType);
            return collection;
        } catch(err: any) {
            throw err;
        }
    }

    isGameInCollection(game: Game) : Boolean {
        let inCollection = false;
        this.games?.forEach((item: IDynamoObject) => {
            if (item.gameName == game.gameName) {
                inCollection = true;
            }
        });
        return inCollection;
    }

    addGame(game: Game) {
        if (this.isGameInCollection(game))
            throw new CollectionError("Game already exists in collection", 400);
        if (!this.games)
            this.games = [];
        this.games.push(game);
    }

    removeGame(game: Game) {
        if (!this.isGameInCollection(game))
            throw new CollectionError("Game not found in the collection.", 404);
            
        this.games?.forEach((item: Game) => {
            if (item.gameName == game.gameName) {
                let index = (this.games?.indexOf(item));
                if (index) {
                    this.games?.splice(index, 1);
                }
            }
        });
    }
}