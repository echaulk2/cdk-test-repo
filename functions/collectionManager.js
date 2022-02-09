"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeGameFromCollection = exports.modifyGameInCollection = exports.addGameToCollection = exports.getCollection = void 0;
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
const gameManager_1 = require("./gameManager");
async function getCollection(collection) {
    let params = {
        TableName: table,
        KeyConditionExpression: `#partitionKey = :partitionKey AND begins_with(sortKey, :sortKey)`,
        ExpressionAttributeNames: {
            "#partitionKey": "partitionKey",
        },
        ExpressionAttributeValues: {
            ":partitionKey": collection.partitionKey,
            ":sortKey": `[CollectionItem]#[${collection.collectionType}]#[GameItem]`
        }
    };
    try {
        let response = await docClient.query(params).promise();
        let gameList = [];
        response.Items.forEach((game) => {
            let returnedGame = (0, gameManager_1.serializeDynamoResponse)(game);
            gameList.push(returnedGame);
        });
        return gameList;
    }
    catch (err) {
        throw err;
    }
}
exports.getCollection = getCollection;
async function addGameToCollection(game, collection) {
    try {
        let response = await (0, gameManager_1.createGame)(game);
        let updatedCollection = getCollection(collection);
        return updatedCollection;
    }
    catch (err) {
        throw err;
    }
}
exports.addGameToCollection = addGameToCollection;
async function modifyGameInCollection(game, collection) {
    try {
        let response = await (0, gameManager_1.modifyGame)(game);
        let updatedCollection = getCollection(collection);
        return updatedCollection;
    }
    catch (err) {
        throw err;
    }
}
exports.modifyGameInCollection = modifyGameInCollection;
async function removeGameFromCollection(game, collection) {
    try {
        let response = await (0, gameManager_1.deleteGame)(game);
        let updatedCollection = getCollection(collection);
        return updatedCollection;
    }
    catch (err) {
        throw err;
    }
}
exports.removeGameFromCollection = removeGameFromCollection;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29sbGVjdGlvbk1hbmFnZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJjb2xsZWN0aW9uTWFuYWdlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSxNQUFNLEdBQUcsR0FBRyxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUM7QUFDL0IsTUFBTSxNQUFNLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxjQUFjLENBQUM7QUFDMUMsTUFBTSxNQUFNLEdBQUc7SUFDYixrQkFBa0IsRUFBRSxJQUFJO0lBQ3hCLEdBQUcsQ0FBQyxNQUFNLElBQUk7UUFDWixRQUFRLEVBQUUsZ0JBQWdCO1FBQzFCLFVBQVUsRUFBRSxLQUFLO1FBQ2pCLE1BQU0sRUFBRSxXQUFXO0tBQ3BCLENBQUM7Q0FDSCxDQUFDO0FBQ0YsTUFBTSxTQUFTLEdBQUcsSUFBSSxHQUFHLENBQUMsUUFBUSxDQUFDLGNBQWMsQ0FBQyxNQUFNLENBQUMsQ0FBQztBQUMxRCxNQUFNLEtBQUssR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLG9CQUFvQixDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLG9CQUFvQixDQUFDO0FBRTdGLCtDQUEyRztBQUdwRyxLQUFLLFVBQVUsYUFBYSxDQUFDLFVBQXNCO0lBQ3hELElBQUksTUFBTSxHQUFHO1FBQ1gsU0FBUyxFQUFFLEtBQUs7UUFDaEIsc0JBQXNCLEVBQUUsa0VBQWtFO1FBQzFGLHdCQUF3QixFQUFFO1lBQ3RCLGVBQWUsRUFBRSxjQUFjO1NBQ2xDO1FBQ0QseUJBQXlCLEVBQUU7WUFDdkIsZUFBZSxFQUFFLFVBQVUsQ0FBQyxZQUFZO1lBQ3hDLFVBQVUsRUFBRSxxQkFBcUIsVUFBVSxDQUFDLGNBQWMsY0FBYztTQUMzRTtLQUNGLENBQUM7SUFFRixJQUFJO1FBQ0YsSUFBSSxRQUFRLEdBQUcsTUFBTSxTQUFTLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQ3ZELElBQUksUUFBUSxHQUFHLEVBQVMsQ0FBQTtRQUN4QixRQUFRLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDLElBQW1CLEVBQUUsRUFBRTtZQUM3QyxJQUFJLFlBQVksR0FBRyxJQUFBLHFDQUF1QixFQUFDLElBQUksQ0FBQyxDQUFDO1lBQ2pELFFBQVEsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLENBQUM7UUFDOUIsQ0FBQyxDQUFDLENBQUM7UUFDSCxPQUFPLFFBQVEsQ0FBQztLQUNqQjtJQUFDLE9BQU8sR0FBUSxFQUFFO1FBQ2pCLE1BQU0sR0FBRyxDQUFDO0tBQ1g7QUFDSCxDQUFDO0FBeEJELHNDQXdCQztBQUVNLEtBQUssVUFBVSxtQkFBbUIsQ0FBQyxJQUFVLEVBQUUsVUFBc0I7SUFDMUUsSUFBSTtRQUNGLElBQUksUUFBUSxHQUFHLE1BQU0sSUFBQSx3QkFBVSxFQUFDLElBQUksQ0FBQyxDQUFDO1FBQ3RDLElBQUksaUJBQWlCLEdBQUcsYUFBYSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1FBQ2xELE9BQU8saUJBQWlCLENBQUM7S0FDMUI7SUFBQyxPQUFPLEdBQVEsRUFBRTtRQUNqQixNQUFNLEdBQUcsQ0FBQztLQUNYO0FBQ0gsQ0FBQztBQVJELGtEQVFDO0FBRU0sS0FBSyxVQUFVLHNCQUFzQixDQUFDLElBQVUsRUFBRSxVQUFzQjtJQUM3RSxJQUFJO1FBQ0YsSUFBSSxRQUFRLEdBQUcsTUFBTSxJQUFBLHdCQUFVLEVBQUMsSUFBSSxDQUFDLENBQUM7UUFDdEMsSUFBSSxpQkFBaUIsR0FBRyxhQUFhLENBQUMsVUFBVSxDQUFDLENBQUM7UUFDbEQsT0FBTyxpQkFBaUIsQ0FBQztLQUMxQjtJQUFDLE9BQU8sR0FBUSxFQUFFO1FBQ2pCLE1BQU0sR0FBRyxDQUFDO0tBQ1g7QUFDSCxDQUFDO0FBUkQsd0RBUUM7QUFDTSxLQUFLLFVBQVUsd0JBQXdCLENBQUMsSUFBVSxFQUFFLFVBQXNCO0lBQy9FLElBQUk7UUFDRixJQUFJLFFBQVEsR0FBRyxNQUFNLElBQUEsd0JBQVUsRUFBQyxJQUFJLENBQUMsQ0FBQztRQUN0QyxJQUFJLGlCQUFpQixHQUFHLGFBQWEsQ0FBQyxVQUFVLENBQUMsQ0FBQztRQUNsRCxPQUFPLGlCQUFpQixDQUFDO0tBQzFCO0lBQUMsT0FBTyxHQUFRLEVBQUU7UUFDakIsTUFBTSxHQUFHLENBQUM7S0FDWDtBQUNILENBQUM7QUFSRCw0REFRQyIsInNvdXJjZXNDb250ZW50IjpbImNvbnN0IEFXUyA9IHJlcXVpcmUoJ2F3cy1zZGsnKTtcclxuY29uc3QgaXNUZXN0ID0gcHJvY2Vzcy5lbnYuSkVTVF9XT1JLRVJfSUQ7XHJcbmNvbnN0IGNvbmZpZyA9IHtcclxuICBjb252ZXJ0RW1wdHlWYWx1ZXM6IHRydWUsXHJcbiAgLi4uKGlzVGVzdCAmJiB7XHJcbiAgICBlbmRwb2ludDogJ2xvY2FsaG9zdDo4MDAwJyxcclxuICAgIHNzbEVuYWJsZWQ6IGZhbHNlLFxyXG4gICAgcmVnaW9uOiAnbG9jYWwtZW52JyxcclxuICB9KSxcclxufTtcclxuY29uc3QgZG9jQ2xpZW50ID0gbmV3IEFXUy5EeW5hbW9EQi5Eb2N1bWVudENsaWVudChjb25maWcpO1xyXG5jb25zdCB0YWJsZSA9IChpc1Rlc3QpID8gcHJvY2Vzcy5lbnYuRFlOQU1PX0RCX1RFU1RfVEFCTEUgOiBwcm9jZXNzLmVudi5EWU5BTU9fREJfR0FNRV9UQUJMRTtcclxuaW1wb3J0IHsgR2FtZSB9IGZyb20gXCIuL2dhbWVcIjtcclxuaW1wb3J0IHsgY3JlYXRlR2FtZSwgbW9kaWZ5R2FtZSwgZGVsZXRlR2FtZSwgSUR5bmFtb09iamVjdCwgc2VyaWFsaXplRHluYW1vUmVzcG9uc2UgfSBmcm9tIFwiLi9nYW1lTWFuYWdlclwiO1xyXG5pbXBvcnQgeyBDb2xsZWN0aW9uIH0gZnJvbSBcIi4vY29sbGVjdGlvblwiO1xyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGdldENvbGxlY3Rpb24oY29sbGVjdGlvbjogQ29sbGVjdGlvbikgOiBQcm9taXNlPFtHYW1lXT4ge1xyXG4gIGxldCBwYXJhbXMgPSB7XHJcbiAgICBUYWJsZU5hbWU6IHRhYmxlLFxyXG4gICAgS2V5Q29uZGl0aW9uRXhwcmVzc2lvbjogYCNwYXJ0aXRpb25LZXkgPSA6cGFydGl0aW9uS2V5IEFORCBiZWdpbnNfd2l0aChzb3J0S2V5LCA6c29ydEtleSlgLFxyXG4gICAgRXhwcmVzc2lvbkF0dHJpYnV0ZU5hbWVzOiB7XHJcbiAgICAgICAgXCIjcGFydGl0aW9uS2V5XCI6IFwicGFydGl0aW9uS2V5XCIsXHJcbiAgICB9LFxyXG4gICAgRXhwcmVzc2lvbkF0dHJpYnV0ZVZhbHVlczoge1xyXG4gICAgICAgIFwiOnBhcnRpdGlvbktleVwiOiBjb2xsZWN0aW9uLnBhcnRpdGlvbktleSxcclxuICAgICAgICBcIjpzb3J0S2V5XCI6IGBbQ29sbGVjdGlvbkl0ZW1dI1ske2NvbGxlY3Rpb24uY29sbGVjdGlvblR5cGV9XSNbR2FtZUl0ZW1dYFxyXG4gICAgfVxyXG4gIH07XHJcbiAgXHJcbiAgdHJ5IHtcclxuICAgIGxldCByZXNwb25zZSA9IGF3YWl0IGRvY0NsaWVudC5xdWVyeShwYXJhbXMpLnByb21pc2UoKTsgICAgICBcclxuICAgIGxldCBnYW1lTGlzdCA9IFtdIGFzIGFueVxyXG4gICAgcmVzcG9uc2UuSXRlbXMuZm9yRWFjaCgoZ2FtZTogSUR5bmFtb09iamVjdCkgPT4ge1xyXG4gICAgICBsZXQgcmV0dXJuZWRHYW1lID0gc2VyaWFsaXplRHluYW1vUmVzcG9uc2UoZ2FtZSk7XHJcbiAgICAgIGdhbWVMaXN0LnB1c2gocmV0dXJuZWRHYW1lKTtcclxuICAgIH0pO1xyXG4gICAgcmV0dXJuIGdhbWVMaXN0O1xyXG4gIH0gY2F0Y2ggKGVycjogYW55KSB7XHJcbiAgICB0aHJvdyBlcnI7XHJcbiAgfVxyXG59XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gYWRkR2FtZVRvQ29sbGVjdGlvbihnYW1lOiBHYW1lLCBjb2xsZWN0aW9uOiBDb2xsZWN0aW9uKSB7XHJcbiAgdHJ5IHtcclxuICAgIGxldCByZXNwb25zZSA9IGF3YWl0IGNyZWF0ZUdhbWUoZ2FtZSk7XHJcbiAgICBsZXQgdXBkYXRlZENvbGxlY3Rpb24gPSBnZXRDb2xsZWN0aW9uKGNvbGxlY3Rpb24pO1xyXG4gICAgcmV0dXJuIHVwZGF0ZWRDb2xsZWN0aW9uO1xyXG4gIH0gY2F0Y2ggKGVycjogYW55KSB7XHJcbiAgICB0aHJvdyBlcnI7XHJcbiAgfVxyXG59XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gbW9kaWZ5R2FtZUluQ29sbGVjdGlvbihnYW1lOiBHYW1lLCBjb2xsZWN0aW9uOiBDb2xsZWN0aW9uKSB7XHJcbiAgdHJ5IHtcclxuICAgIGxldCByZXNwb25zZSA9IGF3YWl0IG1vZGlmeUdhbWUoZ2FtZSk7XHJcbiAgICBsZXQgdXBkYXRlZENvbGxlY3Rpb24gPSBnZXRDb2xsZWN0aW9uKGNvbGxlY3Rpb24pO1xyXG4gICAgcmV0dXJuIHVwZGF0ZWRDb2xsZWN0aW9uO1xyXG4gIH0gY2F0Y2ggKGVycjogYW55KSB7XHJcbiAgICB0aHJvdyBlcnI7XHJcbiAgfVxyXG59XHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiByZW1vdmVHYW1lRnJvbUNvbGxlY3Rpb24oZ2FtZTogR2FtZSwgY29sbGVjdGlvbjogQ29sbGVjdGlvbikge1xyXG4gIHRyeSB7XHJcbiAgICBsZXQgcmVzcG9uc2UgPSBhd2FpdCBkZWxldGVHYW1lKGdhbWUpO1xyXG4gICAgbGV0IHVwZGF0ZWRDb2xsZWN0aW9uID0gZ2V0Q29sbGVjdGlvbihjb2xsZWN0aW9uKTtcclxuICAgIHJldHVybiB1cGRhdGVkQ29sbGVjdGlvbjtcclxuICB9IGNhdGNoIChlcnI6IGFueSkge1xyXG4gICAgdGhyb3cgZXJyO1xyXG4gIH1cclxufSJdfQ==