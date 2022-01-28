"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.serializeDynamoResponse = exports.deleteGame = exports.modifyGame = exports.listGames = exports.getGame = void 0;
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
const game_1 = require("./game");
const gameErrorHandler_1 = require("./gameErrorHandler");
async function getGame(game) {
    let params = {
        TableName: table,
        Key: {
            userID: game.userID,
            sortKey: game.sortKey
        },
        KeyConditionExpression: `sortKey = ${game.sortKey} AND userID = ${game.userID}`
    };
    try {
        let response = await docClient.get(params).promise();
        let game = serializeDynamoResponse(response.Item);
        return game;
    }
    catch (err) {
        //Dynamo returns an empty object if the get can't find a record.
        //Not sure how to handle this since the documentClient doesn't throw an error
        if (err.message == "Cannot read property 'userID' of undefined") {
            throw new gameErrorHandler_1.GameError("Unable to find game.", 404);
        }
        throw err;
    }
}
exports.getGame = getGame;
async function listGames(userID) {
    let params = {
        TableName: table,
        KeyConditionExpression: "#userID = :userID",
        FilterExpression: "attribute_exists(gameName)",
        ExpressionAttributeNames: {
            "#userID": "userID"
        },
        ExpressionAttributeValues: {
            ":userID": userID
        }
    };
    try {
        let response = await docClient.query(params).promise();
        let gameList = [];
        response.Items.forEach((game) => {
            let returnedGame = serializeDynamoResponse(game);
            gameList.push(returnedGame);
        });
        return gameList;
    }
    catch (err) {
        throw err;
    }
}
exports.listGames = listGames;
async function modifyGame(game) {
    let updateExpression = [];
    let expressionAttributeNames = {};
    let expressionAttributeValues = {};
    //Generate dynammic update expression based on allowed parameters
    for (let [key, value] of Object.entries(game)) {
        if (key != 'userID' && key != 'gameName' && key != 'sortKey' && value != undefined) {
            updateExpression.push(`#${key} = :${key}`);
            expressionAttributeNames[`#${key}`] = key;
            expressionAttributeValues[`:${key}`] = value;
        }
    }
    let params = {
        TableName: table,
        Key: {
            userID: game.userID,
            sortKey: game.sortKey
        },
        KeyConditionExpression: `sortKey = ${game.sortKey} AND userID = ${game.userID}`,
        UpdateExpression: `SET ${updateExpression.join(",")}`,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
        ConditionExpression: 'attribute_exists(gameName) and attribute_exists(userID) and attribute_exists(sortKey)',
        ReturnValues: 'ALL_NEW'
    };
    try {
        let response = await docClient.update(params).promise();
        let modifiedGame = await getGame(game);
        return modifiedGame;
    }
    catch (err) {
        if (err.message == "The conditional request failed") {
            throw new gameErrorHandler_1.GameError("Unable to modify game.", 400);
        }
        throw err;
    }
}
exports.modifyGame = modifyGame;
async function deleteGame(game) {
    let params = {
        TableName: table,
        Key: {
            userID: game.userID,
            sortKey: game.sortKey
        },
        KeyConditionExpression: `sortKey = ${game.sortKey} AND userID = ${game.userID}`,
        ConditionExpression: 'attribute_exists(sortKey) and attribute_exists(userID)',
        ReturnValues: 'ALL_OLD'
    };
    try {
        let response = await docClient.delete(params).promise();
        let game = serializeDynamoResponse(response.Attributes);
        return game;
    }
    catch (err) {
        if (err.message == "The conditional request failed") {
            throw new gameErrorHandler_1.GameError("Unable to delete game.", 400);
        }
        throw err;
    }
}
exports.deleteGame = deleteGame;
function serializeDynamoResponse(data) {
    let game = new game_1.Game(data.userID, data.gameName, data === null || data === void 0 ? void 0 : data.yearReleased, data === null || data === void 0 ? void 0 : data.genre, data === null || data === void 0 ? void 0 : data.console, data === null || data === void 0 ? void 0 : data.developer);
    return game;
}
exports.serializeDynamoResponse = serializeDynamoResponse;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2FtZU1hbmFnZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJnYW1lTWFuYWdlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSxNQUFNLEdBQUcsR0FBRyxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUM7QUFDL0IsTUFBTSxNQUFNLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxjQUFjLENBQUM7QUFDMUMsTUFBTSxNQUFNLEdBQUc7SUFDYixrQkFBa0IsRUFBRSxJQUFJO0lBQ3hCLEdBQUcsQ0FBQyxNQUFNLElBQUk7UUFDWixRQUFRLEVBQUUsZ0JBQWdCO1FBQzFCLFVBQVUsRUFBRSxLQUFLO1FBQ2pCLE1BQU0sRUFBRSxXQUFXO0tBQ3BCLENBQUM7Q0FDSCxDQUFDO0FBQ0YsTUFBTSxTQUFTLEdBQUcsSUFBSSxHQUFHLENBQUMsUUFBUSxDQUFDLGNBQWMsQ0FBQyxNQUFNLENBQUMsQ0FBQztBQUMxRCxNQUFNLEtBQUssR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLG9CQUFvQixDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLG9CQUFvQixDQUFDO0FBQzdGLGlDQUE4QjtBQUM5Qix5REFBK0M7QUFFdkMsS0FBSyxVQUFVLE9BQU8sQ0FBQyxJQUFVO0lBQ3JDLElBQUksTUFBTSxHQUFHO1FBQ1gsU0FBUyxFQUFFLEtBQUs7UUFDaEIsR0FBRyxFQUFFO1lBQ0gsTUFBTSxFQUFFLElBQUksQ0FBQyxNQUFNO1lBQ25CLE9BQU8sRUFBRSxJQUFJLENBQUMsT0FBTztTQUN0QjtRQUNELHNCQUFzQixFQUFFLGFBQWEsSUFBSSxDQUFDLE9BQU8saUJBQWlCLElBQUksQ0FBQyxNQUFNLEVBQUU7S0FDaEYsQ0FBQTtJQUVELElBQUk7UUFDRixJQUFJLFFBQVEsR0FBRyxNQUFNLFNBQVMsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDckQs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SUFDekQsSUFBSSxJQUFJLEdBQUcsSUFBSSxXQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsUUFBUSxFQUFFLElBQUksYUFBSixJQUFJLHVCQUFKLElBQUksQ0FBRSxZQUFZLEVBQUUsSUFBSSxhQUFKLElBQUksdUJBQUosSUFBSSxDQUFFLEtBQUssRUFBRSxJQUFJLGFBQUosSUFBSSx1QkFBSixJQUFJLENBQUUsT0FBTyxFQUFFLElBQUksYUFBSixJQUFJLHVCQUFKLElBQUksQ0FBRSxTQUFTLENBQUMsQ0FBQztJQUNqSCxPQUFPLElBQUksQ0FBQztBQUNkLENBQUM7QUFIRCwwREFHQyIsInNvdXJjZXNDb250ZW50IjpbImNvbnN0IEFXUyA9IHJlcXVpcmUoJ2F3cy1zZGsnKTtcclxuY29uc3QgaXNUZXN0ID0gcHJvY2Vzcy5lbnYuSkVTVF9XT1JLRVJfSUQ7XHJcbmNvbnN0IGNvbmZpZyA9IHtcclxuICBjb252ZXJ0RW1wdHlWYWx1ZXM6IHRydWUsXHJcbiAgLi4uKGlzVGVzdCAmJiB7XHJcbiAgICBlbmRwb2ludDogJ2xvY2FsaG9zdDo4MDAwJyxcclxuICAgIHNzbEVuYWJsZWQ6IGZhbHNlLFxyXG4gICAgcmVnaW9uOiAnbG9jYWwtZW52JyxcclxuICB9KSxcclxufTtcclxuY29uc3QgZG9jQ2xpZW50ID0gbmV3IEFXUy5EeW5hbW9EQi5Eb2N1bWVudENsaWVudChjb25maWcpO1xyXG5jb25zdCB0YWJsZSA9IChpc1Rlc3QpID8gcHJvY2Vzcy5lbnYuRFlOQU1PX0RCX1RFU1RfVEFCTEUgOiBwcm9jZXNzLmVudi5EWU5BTU9fREJfR0FNRV9UQUJMRTtcclxuaW1wb3J0IHsgR2FtZSB9IGZyb20gXCIuL2dhbWVcIjtcclxuaW1wb3J0IHsgR2FtZUVycm9yIH0gZnJvbSBcIi4vZ2FtZUVycm9ySGFuZGxlclwiO1xyXG4gXHJcbiBleHBvcnQgYXN5bmMgZnVuY3Rpb24gZ2V0R2FtZShnYW1lOiBHYW1lKSA6IFByb21pc2U8R2FtZT4ge1xyXG4gICAgbGV0IHBhcmFtcyA9IHtcclxuICAgICAgVGFibGVOYW1lOiB0YWJsZSxcclxuICAgICAgS2V5OiB7XHJcbiAgICAgICAgdXNlcklEOiBnYW1lLnVzZXJJRCxcclxuICAgICAgICBzb3J0S2V5OiBnYW1lLnNvcnRLZXlcclxuICAgICAgfSxcclxuICAgICAgS2V5Q29uZGl0aW9uRXhwcmVzc2lvbjogYHNvcnRLZXkgPSAke2dhbWUuc29ydEtleX0gQU5EIHVzZXJJRCA9ICR7Z2FtZS51c2VySUR9YFxyXG4gICAgfVxyXG4gICAgXHJcbiAgICB0cnkge1xyXG4gICAgICBsZXQgcmVzcG9uc2UgPSBhd2FpdCBkb2NDbGllbnQuZ2V0KHBhcmFtcykucHJvbWlzZSgpO1xyXG4gICAgICBsZXQgZ2FtZSA9IHNlcmlhbGl6ZUR5bmFtb1Jlc3BvbnNlKHJlc3BvbnNlLkl0ZW0pO1xyXG4gICAgICByZXR1cm4gZ2FtZTtcclxuICAgIH0gY2F0Y2ggKGVycjogYW55KSB7XHJcbiAgICAgIC8vRHluYW1vIHJldHVybnMgYW4gZW1wdHkgb2JqZWN0IGlmIHRoZSBnZXQgY2FuJ3QgZmluZCBhIHJlY29yZC5cclxuICAgICAgLy9Ob3Qgc3VyZSBob3cgdG8gaGFuZGxlIHRoaXMgc2luY2UgdGhlIGRvY3VtZW50Q2xpZW50IGRvZXNuJ3QgdGhyb3cgYW4gZXJyb3JcclxuICAgICAgaWYgKGVyci5tZXNzYWdlID09IFwiQ2Fubm90IHJlYWQgcHJvcGVydHkgJ3VzZXJJRCcgb2YgdW5kZWZpbmVkXCIpIHtcclxuICAgICAgICB0aHJvdyBuZXcgR2FtZUVycm9yKFwiVW5hYmxlIHRvIGZpbmQgZ2FtZS5cIiwgNDA0KTtcclxuICAgICAgfVxyXG4gICAgICB0aHJvdyBlcnJcclxuICAgIH1cclxuICB9XHJcblxyXG4gIGV4cG9ydCBhc3luYyBmdW5jdGlvbiBsaXN0R2FtZXModXNlcklEOiBzdHJpbmcpIDogUHJvbWlzZTxbR2FtZV0+IHtcclxuICAgIGxldCBwYXJhbXMgPSB7XHJcbiAgICAgIFRhYmxlTmFtZTogdGFibGUsXHJcbiAgICAgIEtleUNvbmRpdGlvbkV4cHJlc3Npb246IFwiI3VzZXJJRCA9IDp1c2VySURcIixcclxuICAgICAgRmlsdGVyRXhwcmVzc2lvbjogXCJhdHRyaWJ1dGVfZXhpc3RzKGdhbWVOYW1lKVwiLFxyXG4gICAgICBFeHByZXNzaW9uQXR0cmlidXRlTmFtZXM6IHtcclxuICAgICAgICAgIFwiI3VzZXJJRFwiOiBcInVzZXJJRFwiXHJcbiAgICAgIH0sXHJcbiAgICAgIEV4cHJlc3Npb25BdHRyaWJ1dGVWYWx1ZXM6IHtcclxuICAgICAgICAgIFwiOnVzZXJJRFwiOiB1c2VySURcclxuICAgICAgfVxyXG4gICAgfTtcclxuICAgIFxyXG4gICAgdHJ5IHtcclxuICAgICAgbGV0IHJlc3BvbnNlID0gYXdhaXQgZG9jQ2xpZW50LnF1ZXJ5KHBhcmFtcykucHJvbWlzZSgpOyAgICAgIFxyXG4gICAgICBsZXQgZ2FtZUxpc3QgPSBbXSBhcyBhbnlcclxuICAgICAgcmVzcG9uc2UuSXRlbXMuZm9yRWFjaCgoZ2FtZTogSUR5bmFtb09iamVjdCkgPT4ge1xyXG4gICAgICAgIGxldCByZXR1cm5lZEdhbWUgPSBzZXJpYWxpemVEeW5hbW9SZXNwb25zZShnYW1lKTtcclxuICAgICAgICBnYW1lTGlzdC5wdXNoKHJldHVybmVkR2FtZSk7XHJcbiAgICAgIH0pO1xyXG4gICAgICByZXR1cm4gZ2FtZUxpc3Q7XHJcbiAgICB9IGNhdGNoIChlcnI6IGFueSkge1xyXG4gICAgICB0aHJvdyBlcnJcclxuICAgIH1cclxuICB9XHJcbiAgZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIG1vZGlmeUdhbWUoZ2FtZTogR2FtZSkge1xyXG4gICAgbGV0IHVwZGF0ZUV4cHJlc3Npb246IFN0cmluZ1tdID0gW107XHJcbiAgICBsZXQgZXhwcmVzc2lvbkF0dHJpYnV0ZU5hbWVzID0ge30gYXMgYW55O1xyXG4gICAgbGV0IGV4cHJlc3Npb25BdHRyaWJ1dGVWYWx1ZXMgPSB7fSBhcyBhbnk7XHJcbiAgICBcclxuICAgIC8vR2VuZXJhdGUgZHluYW1taWMgdXBkYXRlIGV4cHJlc3Npb24gYmFzZWQgb24gYWxsb3dlZCBwYXJhbWV0ZXJzXHJcbiAgICBmb3IgKGxldCBba2V5LCB2YWx1ZV0gb2YgT2JqZWN0LmVudHJpZXMoZ2FtZSkpIHtcclxuICAgICAgaWYgKGtleSAhPSAndXNlcklEJyAmJiBrZXkgIT0gJ2dhbWVOYW1lJyAmJiBrZXkgIT0gJ3NvcnRLZXknICYmIHZhbHVlICE9IHVuZGVmaW5lZCkge1xyXG4gICAgICAgIHVwZGF0ZUV4cHJlc3Npb24ucHVzaChgIyR7a2V5fSA9IDoke2tleX1gKTtcclxuICAgICAgICBleHByZXNzaW9uQXR0cmlidXRlTmFtZXNbYCMke2tleX1gXSA9IGtleSA7XHJcbiAgICAgICAgZXhwcmVzc2lvbkF0dHJpYnV0ZVZhbHVlc1tgOiR7a2V5fWBdID0gdmFsdWU7ICBcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGxldCBwYXJhbXMgPSB7XHJcbiAgICAgIFRhYmxlTmFtZTogdGFibGUsXHJcbiAgICAgIEtleToge1xyXG4gICAgICAgIHVzZXJJRDogZ2FtZS51c2VySUQsXHJcbiAgICAgICAgc29ydEtleTogZ2FtZS5zb3J0S2V5XHJcbiAgICAgIH0sXHJcbiAgICAgIEtleUNvbmRpdGlvbkV4cHJlc3Npb246IGBzb3J0S2V5ID0gJHtnYW1lLnNvcnRLZXl9IEFORCB1c2VySUQgPSAke2dhbWUudXNlcklEfWAsXHJcbiAgICAgIFVwZGF0ZUV4cHJlc3Npb246IGBTRVQgJHt1cGRhdGVFeHByZXNzaW9uLmpvaW4oXCIsXCIpfWAsXHJcbiAgICAgIEV4cHJlc3Npb25BdHRyaWJ1dGVOYW1lczogZXhwcmVzc2lvbkF0dHJpYnV0ZU5hbWVzLFxyXG4gICAgICBFeHByZXNzaW9uQXR0cmlidXRlVmFsdWVzOiBleHByZXNzaW9uQXR0cmlidXRlVmFsdWVzLFxyXG4gICAgICBDb25kaXRpb25FeHByZXNzaW9uOiAnYXR0cmlidXRlX2V4aXN0cyhnYW1lTmFtZSkgYW5kIGF0dHJpYnV0ZV9leGlzdHModXNlcklEKSBhbmQgYXR0cmlidXRlX2V4aXN0cyhzb3J0S2V5KScsXHJcbiAgICAgIFJldHVyblZhbHVlczogJ0FMTF9ORVcnXHJcbiAgICB9O1xyXG4gIFxyXG4gICAgdHJ5IHtcclxuICAgICAgbGV0IHJlc3BvbnNlID0gYXdhaXQgZG9jQ2xpZW50LnVwZGF0ZShwYXJhbXMpLnByb21pc2UoKTtcclxuICAgICAgbGV0IG1vZGlmaWVkR2FtZSA9IGF3YWl0IGdldEdhbWUoZ2FtZSk7XHJcbiAgICAgIHJldHVybiBtb2RpZmllZEdhbWU7XHJcbiAgICB9IGNhdGNoIChlcnI6IGFueSkge1xyXG4gICAgICBpZiAoZXJyLm1lc3NhZ2UgPT0gXCJUaGUgY29uZGl0aW9uYWwgcmVxdWVzdCBmYWlsZWRcIikge1xyXG4gICAgICAgIHRocm93IG5ldyBHYW1lRXJyb3IoXCJVbmFibGUgdG8gbW9kaWZ5IGdhbWUuXCIsIDQwMCk7XHJcbiAgICAgIH1cclxuICAgICAgdGhyb3cgZXJyO1xyXG4gICAgfVxyXG4gIH1cclxuICBcclxuICBleHBvcnQgYXN5bmMgZnVuY3Rpb24gZGVsZXRlR2FtZShnYW1lOiBHYW1lKSB7XHJcbiAgICBsZXQgcGFyYW1zID0ge1xyXG4gICAgICBUYWJsZU5hbWU6IHRhYmxlLFxyXG4gICAgICBLZXk6IHtcclxuICAgICAgICB1c2VySUQ6IGdhbWUudXNlcklELFxyXG4gICAgICAgIHNvcnRLZXk6IGdhbWUuc29ydEtleVxyXG4gICAgICB9LFxyXG4gICAgICBLZXlDb25kaXRpb25FeHByZXNzaW9uOiBgc29ydEtleSA9ICR7Z2FtZS5zb3J0S2V5fSBBTkQgdXNlcklEID0gJHtnYW1lLnVzZXJJRH1gLFxyXG4gICAgICBDb25kaXRpb25FeHByZXNzaW9uOiAnYXR0cmlidXRlX2V4aXN0cyhzb3J0S2V5KSBhbmQgYXR0cmlidXRlX2V4aXN0cyh1c2VySUQpJyxcclxuICAgICAgUmV0dXJuVmFsdWVzOiAnQUxMX09MRCdcclxuICAgIH07XHJcbiAgXHJcbiAgICB0cnkge1xyXG4gICAgICBsZXQgcmVzcG9uc2UgPSBhd2FpdCBkb2NDbGllbnQuZGVsZXRlKHBhcmFtcykucHJvbWlzZSgpO1xyXG4gICAgICBsZXQgZ2FtZSA9IHNlcmlhbGl6ZUR5bmFtb1Jlc3BvbnNlKHJlc3BvbnNlLkF0dHJpYnV0ZXMpO1xyXG4gICAgICByZXR1cm4gZ2FtZTsgICAgICBcclxuICAgIH0gY2F0Y2ggKGVycjogYW55KSB7XHJcbiAgICAgIGlmIChlcnIubWVzc2FnZSA9PSBcIlRoZSBjb25kaXRpb25hbCByZXF1ZXN0IGZhaWxlZFwiKSB7XHJcbiAgICAgICAgdGhyb3cgbmV3IEdhbWVFcnJvcihcIlVuYWJsZSB0byBkZWxldGUgZ2FtZS5cIiwgNDAwKTtcclxuICAgICAgfVxyXG4gICAgICB0aHJvdyBlcnI7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBleHBvcnQgaW50ZXJmYWNlIElKU09OUGF5bG9hZCB7XHJcbiAgICBnYW1lTmFtZTogc3RyaW5nLFxyXG4gICAgeWVhclJlbGVhc2VkPzogbnVtYmVyLFxyXG4gICAgZ2VucmU/OiBzdHJpbmcsXHJcbiAgICBjb25zb2xlPzogc3RyaW5nLFxyXG4gICAgZGV2ZWxvcGVyPzogc3RyaW5nXHJcbiB9XHJcblxyXG4gIGV4cG9ydCBpbnRlcmZhY2UgSUR5bmFtb09iamVjdCB7XHJcbiAgICAgdXNlcklEOiBzdHJpbmcsXHJcbiAgICAgZ2FtZU5hbWU6IHN0cmluZywgICBcclxuICAgICB5ZWFyUmVsZWFzZWQ/OiBudW1iZXIsXHJcbiAgICAgZ2VucmU/OiBzdHJpbmcsXHJcbiAgICAgY29uc29sZT86IHN0cmluZyxcclxuICAgICBkZXZlbG9wZXI/OiBzdHJpbmdcclxuICB9XHJcbiAgXHJcbiAgZXhwb3J0IGludGVyZmFjZSBJSHR0cFJlc3BvbnNlIHtcclxuICAgICBzdGF0dXNDb2RlOiBudW1iZXIsXHJcbiAgICAgYm9keTogc3RyaW5nLFxyXG4gIH1cclxuXHJcbiAgZXhwb3J0IGZ1bmN0aW9uIHNlcmlhbGl6ZUR5bmFtb1Jlc3BvbnNlKGRhdGE6IElEeW5hbW9PYmplY3QpIDogR2FtZSB7XHJcbiAgICBsZXQgZ2FtZSA9IG5ldyBHYW1lKGRhdGEudXNlcklELCBkYXRhLmdhbWVOYW1lLCBkYXRhPy55ZWFyUmVsZWFzZWQsIGRhdGE/LmdlbnJlLCBkYXRhPy5jb25zb2xlLCBkYXRhPy5kZXZlbG9wZXIpO1xyXG4gICAgcmV0dXJuIGdhbWU7XHJcbiAgfSJdfQ==