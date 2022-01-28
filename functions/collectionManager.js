"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.serializeDynamoCollectionResponse = exports.removeGameFromCollection = exports.addGameToCollection = exports.getCollection = void 0;
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
const collection_1 = require("./collection");
const collectionErrorHandler_1 = require("./collectionErrorHandler");
async function getCollection(userID, collectionType) {
    let sortKey = `[${userID}]#[collection]#[${collectionType}]`;
    let params = {
        TableName: table,
        Key: {
            userID: userID,
            sortKey: sortKey
        },
        KeyConditionExpression: `sortKey = ${sortKey} AND userID = ${userID}`,
        ConditionExpression: 'attribute_exists(sortKey) and attribute_exists(userID)'
    };
    try {
        let response = await docClient.get(params).promise();
        let collection = serializeDynamoCollectionResponse(response.Item);
        return collection;
    }
    catch (err) {
        //Dynamo returns an empty object if the get can't find a record.
        //Not sure how to handle this since the documentClient doesn't throw an error
        if (err.message == "Cannot read property 'userID' of undefined") {
            throw new collectionErrorHandler_1.CollectionError("Unable to find collection", 404);
        }
        throw err;
    }
}
exports.getCollection = getCollection;
async function addGameToCollection(game, collection) {
    collection.addGame(game);
    let games = collection.games;
    let params = {
        TableName: table,
        Key: {
            userID: collection.userID,
            sortKey: collection.sortKey
        },
        KeyConditionExpression: `sortKey = ${collection.sortKey} AND userID = ${collection.userID}`,
        UpdateExpression: `SET #games = :games`,
        ExpressionAttributeNames: {
            "#games": "games"
        },
        ExpressionAttributeValues: {
            ":games": games
        },
        ConditionExpression: 'attribute_exists(sortKey) and attribute_exists(userID)',
        ReturnValues: 'ALL_NEW'
    };
    try {
        let response = await docClient.update(params).promise();
        let updatedCollection = await getCollection(collection.userID, 'wishlist');
        return updatedCollection;
    }
    catch (err) {
        console.log(err);
        //Throws an error if a collection does not already exist.
        if (err.message == "The conditional request failed") {
            throw new collectionErrorHandler_1.CollectionError("Unable to find collection.", 404);
        }
        throw err;
    }
}
exports.addGameToCollection = addGameToCollection;
async function removeGameFromCollection(game, collection) {
    collection.removeGame(game);
    let params = {
        TableName: table,
        Key: {
            userID: collection.userID,
            sortKey: collection.sortKey
        },
        KeyConditionExpression: `sortKey = ${collection.sortKey} AND userID = ${collection.userID}`,
        UpdateExpression: `SET #games = :games`,
        ExpressionAttributeNames: {
            "#games": "games"
        },
        ExpressionAttributeValues: {
            ":games": collection.games
        },
        ConditionExpression: 'attribute_exists(sortKey) and attribute_exists(userID)',
        ReturnValues: 'ALL_NEW'
    };
    try {
        let response = await docClient.update(params).promise();
        let updatedCollection = await getCollection(collection.userID, 'wishlist');
        return updatedCollection;
    }
    catch (err) {
        console.log(err);
        //Throws an error if a collection does not already exist.
        if (err.message == "The conditional request failed") {
            throw new collectionErrorHandler_1.CollectionError("Unable to find collection.", 404);
        }
        throw err;
    }
}
exports.removeGameFromCollection = removeGameFromCollection;
function serializeDynamoCollectionResponse(data) {
    let collection = new collection_1.Collection(data.userID, data.collectionType, data === null || data === void 0 ? void 0 : data.games);
    return collection;
}
exports.serializeDynamoCollectionResponse = serializeDynamoCollectionResponse;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29sbGVjdGlvbk1hbmFnZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJjb2xsZWN0aW9uTWFuYWdlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSxNQUFNLEdBQUcsR0FBRyxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUM7QUFDL0IsTUFBTSxNQUFNLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxjQUFjLENBQUM7QUFDMUMsTUFBTSxNQUFNLEdBQUc7SUFDYixrQkFBa0IsRUFBRSxJQUFJO0lBQ3hCLEdBQUcsQ0FBQyxNQUFNLElBQUk7UUFDWixRQUFRLEVBQUUsZ0JBQWdCO1FBQzFCLFVBQVUsRUFBRSxLQUFLO1FBQ2pCLE1BQU0sRUFBRSxXQUFXO0tBQ3BCLENBQUM7Q0FDSCxDQUFDO0FBQ0YsTUFBTSxTQUFTLEdBQUcsSUFBSSxHQUFHLENBQUMsUUFBUSxDQUFDLGNBQWMsQ0FBQyxNQUFNLENBQUMsQ0FBQztBQUMxRCxNQUFNLEtBQUssR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLG9CQUFvQixDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLG9CQUFvQixDQUFDO0FBRTdGLDZDQUEwQztBQUMxQyxxRUFBMkQ7QUFFcEQsS0FBSyxVQUFVLGFBQWEsQ0FBQyxNQUFjLEVBQUUsY0FBc0I7SUFDdEUsSUFBSSxPQUFPLEdBQUcsSUFBSSxNQUFNLG1CQUFtQixjQUFjLEdBQUcsQ0FBQztJQUM3RCxJQUFJLE1BQU0sR0FBRztRQUNYLFNBQVMsRUFBRSxLQUFLO1FBQ2hCLEdBQUcsRUFBRTtZQUNILE1BQU0sRUFBRSxNQUFNO1lBQ2QsT0FBTyxFQUFFLE9BQU87U0FDakI7UUFDRCxzQkFBc0IsRUFBRSxhQUFhLE9BQU8saUJBQWlCLE1BQU0sRUFBRTtRQUNyRSxtQkFBbUIsRUFBRSx3REFBd0Q7S0FDOUUsQ0FBQTtJQUVELElBQUk7UUFDRixJQUFJLFFBQVEsR0FBRyxN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Q0FBQyxVQUFVLENBQUMsTUFBTSxFQUFFLFVBQVUsQ0FBQyxDQUFDO1FBQzNFLE9BQU8saUJBQWlCLENBQUM7S0FDMUI7SUFBQyxPQUFPLEdBQVEsRUFBRTtRQUNmLE9BQU8sQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDbkIseURBQXlEO1FBQ3pELElBQUksR0FBRyxDQUFDLE9BQU8sSUFBSSxnQ0FBZ0MsRUFBRTtZQUNuRCxNQUFNLElBQUksd0NBQWUsQ0FBQyw0QkFBNEIsRUFBRSxHQUFHLENBQUMsQ0FBQztTQUM5RDtRQUNELE1BQU0sR0FBRyxDQUFBO0tBQ1Y7QUFDUCxDQUFDO0FBaENELDREQWdDQztBQVFELFNBQWdCLGlDQUFpQyxDQUFDLElBQXVCO0lBQ3RFLElBQUksVUFBVSxHQUFHLElBQUksdUJBQVUsQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxjQUFjLEVBQUUsSUFBSSxhQUFKLElBQUksdUJBQUosSUFBSSxDQUFFLEtBQUssQ0FBQyxDQUFDO0lBQy9FLE9BQU8sVUFBVSxDQUFDO0FBQ3JCLENBQUM7QUFIRCw4RUFHQyIsInNvdXJjZXNDb250ZW50IjpbImNvbnN0IEFXUyA9IHJlcXVpcmUoJ2F3cy1zZGsnKTtcclxuY29uc3QgaXNUZXN0ID0gcHJvY2Vzcy5lbnYuSkVTVF9XT1JLRVJfSUQ7XHJcbmNvbnN0IGNvbmZpZyA9IHtcclxuICBjb252ZXJ0RW1wdHlWYWx1ZXM6IHRydWUsXHJcbiAgLi4uKGlzVGVzdCAmJiB7XHJcbiAgICBlbmRwb2ludDogJ2xvY2FsaG9zdDo4MDAwJyxcclxuICAgIHNzbEVuYWJsZWQ6IGZhbHNlLFxyXG4gICAgcmVnaW9uOiAnbG9jYWwtZW52JyxcclxuICB9KSxcclxufTtcclxuY29uc3QgZG9jQ2xpZW50ID0gbmV3IEFXUy5EeW5hbW9EQi5Eb2N1bWVudENsaWVudChjb25maWcpO1xyXG5jb25zdCB0YWJsZSA9IChpc1Rlc3QpID8gcHJvY2Vzcy5lbnYuRFlOQU1PX0RCX1RFU1RfVEFCTEUgOiBwcm9jZXNzLmVudi5EWU5BTU9fREJfR0FNRV9UQUJMRTtcclxuaW1wb3J0IHsgR2FtZSB9IGZyb20gXCIuL2dhbWVcIjtcclxuaW1wb3J0IHsgQ29sbGVjdGlvbiB9IGZyb20gXCIuL2NvbGxlY3Rpb25cIjtcclxuaW1wb3J0IHsgQ29sbGVjdGlvbkVycm9yIH0gZnJvbSBcIi4vY29sbGVjdGlvbkVycm9ySGFuZGxlclwiO1xyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGdldENvbGxlY3Rpb24odXNlcklEOiBzdHJpbmcsIGNvbGxlY3Rpb25UeXBlOiBzdHJpbmcpIDogUHJvbWlzZTxDb2xsZWN0aW9uPiB7XHJcbiAgICBsZXQgc29ydEtleSA9IGBbJHt1c2VySUR9XSNbY29sbGVjdGlvbl0jWyR7Y29sbGVjdGlvblR5cGV9XWA7XHJcbiAgICBsZXQgcGFyYW1zID0ge1xyXG4gICAgICBUYWJsZU5hbWU6IHRhYmxlLFxyXG4gICAgICBLZXk6IHtcclxuICAgICAgICB1c2VySUQ6IHVzZXJJRCxcclxuICAgICAgICBzb3J0S2V5OiBzb3J0S2V5XHJcbiAgICAgIH0sXHJcbiAgICAgIEtleUNvbmRpdGlvbkV4cHJlc3Npb246IGBzb3J0S2V5ID0gJHtzb3J0S2V5fSBBTkQgdXNlcklEID0gJHt1c2VySUR9YCxcclxuICAgICAgQ29uZGl0aW9uRXhwcmVzc2lvbjogJ2F0dHJpYnV0ZV9leGlzdHMoc29ydEtleSkgYW5kIGF0dHJpYnV0ZV9leGlzdHModXNlcklEKSdcclxuICAgIH1cclxuICAgIFxyXG4gICAgdHJ5IHtcclxuICAgICAgbGV0IHJlc3BvbnNlID0gYXdhaXQgZG9jQ2xpZW50LmdldChwYXJhbXMpLnByb21pc2UoKTtcclxuICAgICAgbGV0IGNvbGxlY3Rpb24gPSBzZXJpYWxpemVEeW5hbW9Db2xsZWN0aW9uUmVzcG9uc2UocmVzcG9uc2UuSXRlbSk7XHJcbiAgICAgIHJldHVybiBjb2xsZWN0aW9uO1xyXG4gICAgfSBjYXRjaCAoZXJyOiBhbnkpIHtcclxuICAgICAgLy9EeW5hbW8gcmV0dXJucyBhbiBlbXB0eSBvYmplY3QgaWYgdGhlIGdldCBjYW4ndCBmaW5kIGEgcmVjb3JkLlxyXG4gICAgICAvL05vdCBzdXJlIGhvdyB0byBoYW5kbGUgdGhpcyBzaW5jZSB0aGUgZG9jdW1lbnRDbGllbnQgZG9lc24ndCB0aHJvdyBhbiBlcnJvclxyXG4gICAgICBpZiAoZXJyLm1lc3NhZ2UgPT0gXCJDYW5ub3QgcmVhZCBwcm9wZXJ0eSAndXNlcklEJyBvZiB1bmRlZmluZWRcIikge1xyXG4gICAgICAgIHRocm93IG5ldyBDb2xsZWN0aW9uRXJyb3IoXCJVbmFibGUgdG8gZmluZCBjb2xsZWN0aW9uXCIsIDQwNCk7XHJcbiAgICAgIH1cclxuICAgICAgdGhyb3cgZXJyXHJcbiAgICB9XHJcbn1cclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBhZGRHYW1lVG9Db2xsZWN0aW9uKGdhbWU6IEdhbWUsIGNvbGxlY3Rpb246IENvbGxlY3Rpb24pIDogUHJvbWlzZTxDb2xsZWN0aW9uPiB7XHJcbiAgICBjb2xsZWN0aW9uLmFkZEdhbWUoZ2FtZSk7XHJcbiAgICBsZXQgZ2FtZXMgPSBjb2xsZWN0aW9uLmdhbWVzO1xyXG4gICAgbGV0IHBhcmFtcyA9IHtcclxuICAgICAgICBUYWJsZU5hbWU6IHRhYmxlLFxyXG4gICAgICAgIEtleToge1xyXG4gICAgICAgICAgdXNlcklEOiBjb2xsZWN0aW9uLnVzZXJJRCxcclxuICAgICAgICAgIHNvcnRLZXk6IGNvbGxlY3Rpb24uc29ydEtleVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgS2V5Q29uZGl0aW9uRXhwcmVzc2lvbjogYHNvcnRLZXkgPSAke2NvbGxlY3Rpb24uc29ydEtleX0gQU5EIHVzZXJJRCA9ICR7Y29sbGVjdGlvbi51c2VySUR9YCxcclxuICAgICAgICBVcGRhdGVFeHByZXNzaW9uOiBgU0VUICNnYW1lcyA9IDpnYW1lc2AsXHJcbiAgICAgICAgRXhwcmVzc2lvbkF0dHJpYnV0ZU5hbWVzOiB7XHJcbiAgICAgICAgICAgIFwiI2dhbWVzXCI6IFwiZ2FtZXNcIlxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgRXhwcmVzc2lvbkF0dHJpYnV0ZVZhbHVlczoge1xyXG4gICAgICAgICAgICBcIjpnYW1lc1wiOiBnYW1lc1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgQ29uZGl0aW9uRXhwcmVzc2lvbjogJ2F0dHJpYnV0ZV9leGlzdHMoc29ydEtleSkgYW5kIGF0dHJpYnV0ZV9leGlzdHModXNlcklEKScsXHJcbiAgICAgICAgUmV0dXJuVmFsdWVzOiAnQUxMX05FVydcclxuICAgICAgfVxyXG4gICAgICBcclxuICAgICAgdHJ5IHtcclxuICAgICAgICBsZXQgcmVzcG9uc2UgPSBhd2FpdCBkb2NDbGllbnQudXBkYXRlKHBhcmFtcykucHJvbWlzZSgpO1xyXG4gICAgICAgIGxldCB1cGRhdGVkQ29sbGVjdGlvbiA9IGF3YWl0IGdldENvbGxlY3Rpb24oY29sbGVjdGlvbi51c2VySUQsICd3aXNobGlzdCcpO1xyXG4gICAgICAgIHJldHVybiB1cGRhdGVkQ29sbGVjdGlvbjtcclxuICAgICAgfSBjYXRjaCAoZXJyOiBhbnkpIHtcclxuICAgICAgICAgIGNvbnNvbGUubG9nKGVycik7XHJcbiAgICAgICAgLy9UaHJvd3MgYW4gZXJyb3IgaWYgYSBjb2xsZWN0aW9uIGRvZXMgbm90IGFscmVhZHkgZXhpc3QuXHJcbiAgICAgICAgaWYgKGVyci5tZXNzYWdlID09IFwiVGhlIGNvbmRpdGlvbmFsIHJlcXVlc3QgZmFpbGVkXCIpIHtcclxuICAgICAgICAgIHRocm93IG5ldyBDb2xsZWN0aW9uRXJyb3IoXCJVbmFibGUgdG8gZmluZCBjb2xsZWN0aW9uLlwiLCA0MDQpO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aHJvdyBlcnJcclxuICAgICAgfVxyXG59XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcmVtb3ZlR2FtZUZyb21Db2xsZWN0aW9uKGdhbWU6IEdhbWUsIGNvbGxlY3Rpb246IENvbGxlY3Rpb24pIDogUHJvbWlzZTxDb2xsZWN0aW9uPiB7XHJcbiAgICBjb2xsZWN0aW9uLnJlbW92ZUdhbWUoZ2FtZSk7XHJcbiAgICBsZXQgcGFyYW1zID0ge1xyXG4gICAgICAgIFRhYmxlTmFtZTogdGFibGUsXHJcbiAgICAgICAgS2V5OiB7XHJcbiAgICAgICAgICB1c2VySUQ6IGNvbGxlY3Rpb24udXNlcklELFxyXG4gICAgICAgICAgc29ydEtleTogY29sbGVjdGlvbi5zb3J0S2V5XHJcbiAgICAgICAgfSxcclxuICAgICAgICBLZXlDb25kaXRpb25FeHByZXNzaW9uOiBgc29ydEtleSA9ICR7Y29sbGVjdGlvbi5zb3J0S2V5fSBBTkQgdXNlcklEID0gJHtjb2xsZWN0aW9uLnVzZXJJRH1gLFxyXG4gICAgICAgIFVwZGF0ZUV4cHJlc3Npb246IGBTRVQgI2dhbWVzID0gOmdhbWVzYCxcclxuICAgICAgICBFeHByZXNzaW9uQXR0cmlidXRlTmFtZXM6IHtcclxuICAgICAgICAgICAgXCIjZ2FtZXNcIjogXCJnYW1lc1wiXHJcbiAgICAgICAgfSxcclxuICAgICAgICBFeHByZXNzaW9uQXR0cmlidXRlVmFsdWVzOiB7XHJcbiAgICAgICAgICAgIFwiOmdhbWVzXCI6IGNvbGxlY3Rpb24uZ2FtZXNcclxuICAgICAgICB9LFxyXG4gICAgICAgIENvbmRpdGlvbkV4cHJlc3Npb246ICdhdHRyaWJ1dGVfZXhpc3RzKHNvcnRLZXkpIGFuZCBhdHRyaWJ1dGVfZXhpc3RzKHVzZXJJRCknLFxyXG4gICAgICAgIFJldHVyblZhbHVlczogJ0FMTF9ORVcnXHJcbiAgICAgIH1cclxuICAgICAgXHJcbiAgICAgIHRyeSB7XHJcbiAgICAgICAgbGV0IHJlc3BvbnNlID0gYXdhaXQgZG9jQ2xpZW50LnVwZGF0ZShwYXJhbXMpLnByb21pc2UoKTtcclxuICAgICAgICBsZXQgdXBkYXRlZENvbGxlY3Rpb24gPSBhd2FpdCBnZXRDb2xsZWN0aW9uKGNvbGxlY3Rpb24udXNlcklELCAnd2lzaGxpc3QnKTtcclxuICAgICAgICByZXR1cm4gdXBkYXRlZENvbGxlY3Rpb247XHJcbiAgICAgIH0gY2F0Y2ggKGVycjogYW55KSB7XHJcbiAgICAgICAgICBjb25zb2xlLmxvZyhlcnIpO1xyXG4gICAgICAgIC8vVGhyb3dzIGFuIGVycm9yIGlmIGEgY29sbGVjdGlvbiBkb2VzIG5vdCBhbHJlYWR5IGV4aXN0LlxyXG4gICAgICAgIGlmIChlcnIubWVzc2FnZSA9PSBcIlRoZSBjb25kaXRpb25hbCByZXF1ZXN0IGZhaWxlZFwiKSB7XHJcbiAgICAgICAgICB0aHJvdyBuZXcgQ29sbGVjdGlvbkVycm9yKFwiVW5hYmxlIHRvIGZpbmQgY29sbGVjdGlvbi5cIiwgNDA0KTtcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhyb3cgZXJyXHJcbiAgICAgIH1cclxufVxyXG5cclxuZXhwb3J0IGludGVyZmFjZSBJQ29sbGVjdGlvbk9iamVjdCB7XHJcbiAgICB1c2VySUQ6IHN0cmluZyxcclxuICAgIGNvbGxlY3Rpb25UeXBlOiBzdHJpbmcsXHJcbiAgICBnYW1lcz86IEdhbWVbXVxyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gc2VyaWFsaXplRHluYW1vQ29sbGVjdGlvblJlc3BvbnNlKGRhdGE6IElDb2xsZWN0aW9uT2JqZWN0KSA6IENvbGxlY3Rpb24ge1xyXG4gICBsZXQgY29sbGVjdGlvbiA9IG5ldyBDb2xsZWN0aW9uKGRhdGEudXNlcklELCBkYXRhLmNvbGxlY3Rpb25UeXBlLCBkYXRhPy5nYW1lcyk7XHJcbiAgIHJldHVybiBjb2xsZWN0aW9uO1xyXG59XHJcbiJdfQ==