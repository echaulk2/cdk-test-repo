"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.httpResponse = exports.removeGameFromWishlist = exports.modifyGameInWishlist = exports.addGameToWishlist = exports.getWishlistHttpResponse = exports.deleteGameHttpResponse = exports.modifyGameHttpResponse = exports.createGameHttpResponse = exports.listGamesHttpResponse = exports.getGameHttpResponse = void 0;
const gameManager_1 = require("./dataManager/gameManager");
const wishlist_1 = require("./models/wishlist");
const collectionManager_1 = require("./dataManager/collectionManager");
const Common = require("./shared/common/game");
exports.handler = async (event, context, callback) => {
    const userID = event.requestContext.authorizer.claims['cognito:username'];
    switch (event.path) {
        case ("/getGame"):
            let gameName = { gameName: event.queryStringParameters["gameName"] };
            let getGameData = Common.deserializeGameData(userID, gameName);
            callback(null, await getGameHttpResponse(getGameData));
            break;
        case ("/listGames"):
            let listGameData = userID;
            callback(null, await listGamesHttpResponse(listGameData));
            break;
        case ("/createGame"):
            let createGameData = Common.deserializeGameData(userID, JSON.parse(event.body));
            callback(null, await createGameHttpResponse(createGameData));
            break;
        case ("/modifyGame"):
            let modifyGameData = Common.deserializeGameData(userID, JSON.parse(event.body));
            callback(null, await modifyGameHttpResponse(modifyGameData));
            break;
        case ("/deleteGame"):
            let deleteGameData = Common.deserializeGameData(userID, JSON.parse(event.body));
            callback(null, await deleteGameHttpResponse(deleteGameData));
            break;
        case ("/collection/wishlist/"):
            callback(null, await getWishlistHttpResponse(userID));
            break;
        case ("/collection/wishlist/addGame"):
            let addGameData = Common.deserializeCollectionData(userID, JSON.parse(event.body), 'Wishlist');
            callback(null, await addGameToWishlist(addGameData, userID));
            break;
        case ("/collection/wishlist/modifyGame"):
            let modifyWishlistData = Common.deserializeCollectionData(userID, JSON.parse(event.body), 'Wishlist');
            callback(null, await modifyGameInWishlist(modifyWishlistData, userID));
            break;
        case ("/collection/wishlist/removeGame"):
            let removeGameData = Common.deserializeCollectionData(userID, JSON.parse(event.body), 'Wishlist');
            callback(null, await removeGameFromWishlist(removeGameData, userID));
            break;
        default:
            callback(null, httpResponse({ statusCode: 400, body: JSON.stringify("Invalid operation.") }));
            break;
    }
};
async function getGameHttpResponse(game) {
    try {
        let response = await (0, gameManager_1.getGame)(game);
        return httpResponse({ statusCode: 200, body: JSON.stringify(response) });
    }
    catch (err) {
        return httpResponse({ statusCode: err.statusCode, body: err.message });
    }
}
exports.getGameHttpResponse = getGameHttpResponse;
async function listGamesHttpResponse(userID) {
    try {
        let response = await (0, gameManager_1.listGames)(userID);
        return httpResponse({ statusCode: 200, body: JSON.stringify(response) });
    }
    catch (err) {
        return httpResponse({ statusCode: err.statusCode, body: err.message });
    }
}
exports.listGamesHttpResponse = listGamesHttpResponse;
async function createGameHttpResponse(game) {
    try {
        let response = await (0, gameManager_1.createGame)(game);
        return httpResponse({ statusCode: 200, body: JSON.stringify(response) });
    }
    catch (err) {
        return httpResponse({ statusCode: err.statusCode, body: err.message });
    }
}
exports.createGameHttpResponse = createGameHttpResponse;
async function modifyGameHttpResponse(game) {
    try {
        let response = await (0, gameManager_1.modifyGame)(game);
        return httpResponse({ statusCode: 200, body: JSON.stringify(response) });
    }
    catch (err) {
        return httpResponse({ statusCode: err.statusCode, body: err.message });
    }
}
exports.modifyGameHttpResponse = modifyGameHttpResponse;
async function deleteGameHttpResponse(game) {
    try {
        let response = await (0, gameManager_1.deleteGame)(game);
        return httpResponse({ statusCode: 200, body: JSON.stringify(response) });
    }
    catch (err) {
        return httpResponse({ statusCode: err.statusCode, body: err.message });
    }
}
exports.deleteGameHttpResponse = deleteGameHttpResponse;
async function getWishlistHttpResponse(userID) {
    try {
        let wishlist = new wishlist_1.Wishlist(userID);
        let response = await (0, collectionManager_1.getCollection)(wishlist);
        return httpResponse({ statusCode: 200, body: JSON.stringify(response) });
    }
    catch (err) {
        return httpResponse({ statusCode: err.statusCode, body: err.message });
    }
}
exports.getWishlistHttpResponse = getWishlistHttpResponse;
async function addGameToWishlist(game, userID) {
    try {
        let wishlist = new wishlist_1.Wishlist(userID);
        let response = await (0, collectionManager_1.addGameToCollection)(game, wishlist);
        return httpResponse({ statusCode: 200, body: JSON.stringify(response) });
    }
    catch (err) {
        return httpResponse({ statusCode: err.statusCode, body: err.message });
    }
}
exports.addGameToWishlist = addGameToWishlist;
async function modifyGameInWishlist(game, userID) {
    try {
        let wishlist = new wishlist_1.Wishlist(userID);
        let response = await (0, collectionManager_1.modifyGameInCollection)(game, wishlist);
        return httpResponse({ statusCode: 200, body: JSON.stringify(response) });
    }
    catch (err) {
        return httpResponse({ statusCode: err.statusCode, body: err.message });
    }
}
exports.modifyGameInWishlist = modifyGameInWishlist;
async function removeGameFromWishlist(game, userID) {
    try {
        let wishlist = new wishlist_1.Wishlist(userID);
        let response = await (0, collectionManager_1.removeGameFromCollection)(game, wishlist);
        return httpResponse({ statusCode: 200, body: JSON.stringify(response) });
    }
    catch (err) {
        return httpResponse({ statusCode: err.statusCode, body: err.message });
    }
}
exports.removeGameFromWishlist = removeGameFromWishlist;
function httpResponse(data) {
    return {
        statusCode: data.statusCode,
        body: data.body,
        headers: {
            'Access-Control-Allow-Origin': '*'
        }
    };
}
exports.httpResponse = httpResponse;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFDQSwyREFBbUc7QUFDbkcsZ0RBQTZDO0FBQzdDLHVFQUF1STtBQUV2SSwrQ0FBK0M7QUFFL0MsT0FBTyxDQUFDLE9BQU8sR0FBRyxLQUFLLEVBQUUsS0FBVSxFQUFFLE9BQVksRUFBRSxRQUFhLEVBQUUsRUFBRTtJQUNsRSxNQUFNLE1BQU0sR0FBRyxLQUFLLENBQUMsY0FBYyxDQUFDLFVBQVUsQ0FBQyxNQUFNLENBQUMsa0JBQWtCLENBQUMsQ0FBQztJQUMxRSxRQUFRLEtBQUssQ0FBQyxJQUFJLEVBQUU7UUFDbEIsS0FBSyxDQUFDLFVBQVUsQ0FBQztZQUNmLElBQUksUUFBUSxHQUFHLEVBQUUsUUFBUSxFQUFFLEtBQUssQ0FBQyxxQkFBcUIsQ0FBQyxVQUFVLENBQUMsRUFBRSxDQUFDO1lBQ3JFLElBQUksV0FBVyxHQUFHLE1BQU0sQ0FBQyxtQkFBbUIsQ0FBQyxNQUFNLEVBQUUsUUFBUSxDQUFDLENBQUE7WUFDOUQsUUFBUSxDQUFDLElBQUksRUFBRSxNQUFNLG1CQUFtQixDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUM7WUFDdkQsTUFBTTtRQUNSLEtBQUksQ0FBQyxZQUFZLENBQUM7WUFDaEIsSUFBSSxZQUFZLEdBQUcsTUFBTSxDQUFDO1lBQzFCLFFBQVEsQ0FBQyxJQUFJLEVBQUUsTUFBTSxxQkFBcUIsQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDO1lBQzFELE1BQU07UUFDUixLQUFJLENBQUMsYUFBYSxDQUFDO1lBQ2pCLElBQUksY0FBYyxHQUFHLE1BQU0sQ0FBQyxtQkFBbUIsQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztZQUNoRixRQUFRLENBQUMsSUFBSSxFQUFFLE1BQU0sc0JBQXNCLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQztZQUM3RCxN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Q0FBQztRQUM5RCxPQUFPLFlBQVksQ0FBQyxFQUFDLFVBQVUsRUFBRSxHQUFHLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDLEVBQUMsQ0FBQyxDQUFDO0tBQ3hFO0lBQUMsT0FBTyxHQUFRLEVBQUU7UUFDakIsT0FBTyxZQUFZLENBQUMsRUFBQyxVQUFVLEVBQUUsR0FBRyxDQUFDLFVBQVUsRUFBRSxJQUFJLEVBQUUsR0FBRyxDQUFDLE9BQU8sRUFBQyxDQUFDLENBQUM7S0FDdEU7QUFDSCxDQUFDO0FBUkQsd0RBUUM7QUFFRCxTQUFnQixZQUFZLENBQUMsSUFBOEI7SUFDekQsT0FBTztRQUNMLFVBQVUsRUFBRSxJQUFJLENBQUMsVUFBVTtRQUMzQixJQUFJLEVBQUUsSUFBSSxDQUFDLElBQUk7UUFDZixPQUFPLEVBQUU7WUFDUCw2QkFBNkIsRUFBRSxHQUFHO1NBQ25DO0tBQ0YsQ0FBQTtBQUNILENBQUM7QUFSRCxvQ0FRQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEdhbWUgfSBmcm9tIFwiLi9tb2RlbHMvZ2FtZVwiXHJcbmltcG9ydCB7IGdldEdhbWUsIGxpc3RHYW1lcywgZGVsZXRlR2FtZSwgbW9kaWZ5R2FtZSwgY3JlYXRlR2FtZSB9IGZyb20gXCIuL2RhdGFNYW5hZ2VyL2dhbWVNYW5hZ2VyXCI7XHJcbmltcG9ydCB7IFdpc2hsaXN0IH0gZnJvbSBcIi4vbW9kZWxzL3dpc2hsaXN0XCI7XHJcbmltcG9ydCB7IGdldENvbGxlY3Rpb24sIGFkZEdhbWVUb0NvbGxlY3Rpb24sIG1vZGlmeUdhbWVJbkNvbGxlY3Rpb24sIHJlbW92ZUdhbWVGcm9tQ29sbGVjdGlvbiB9IGZyb20gXCIuL2RhdGFNYW5hZ2VyL2NvbGxlY3Rpb25NYW5hZ2VyXCI7XHJcbmltcG9ydCAqIGFzIEludGVyZmFjZXMgZnJvbSBcIi4vc2hhcmVkL2ludGVyZmFjZXMvaW50ZXJmYWNlc1wiXHJcbmltcG9ydCAqIGFzIENvbW1vbiBmcm9tIFwiLi9zaGFyZWQvY29tbW9uL2dhbWVcIjtcclxuXHJcbmV4cG9ydHMuaGFuZGxlciA9IGFzeW5jIChldmVudDogYW55LCBjb250ZXh0OiBhbnksIGNhbGxiYWNrOiBhbnkpID0+IHtcclxuICBjb25zdCB1c2VySUQgPSBldmVudC5yZXF1ZXN0Q29udGV4dC5hdXRob3JpemVyLmNsYWltc1snY29nbml0bzp1c2VybmFtZSddO1xyXG4gIHN3aXRjaCAoZXZlbnQucGF0aCkge1xyXG4gICAgY2FzZSAoXCIvZ2V0R2FtZVwiKTpcclxuICAgICAgbGV0IGdhbWVOYW1lID0geyBnYW1lTmFtZTogZXZlbnQucXVlcnlTdHJpbmdQYXJhbWV0ZXJzW1wiZ2FtZU5hbWVcIl0gfTtcclxuICAgICAgbGV0IGdldEdhbWVEYXRhID0gQ29tbW9uLmRlc2VyaWFsaXplR2FtZURhdGEodXNlcklELCBnYW1lTmFtZSlcclxuICAgICAgY2FsbGJhY2sobnVsbCwgYXdhaXQgZ2V0R2FtZUh0dHBSZXNwb25zZShnZXRHYW1lRGF0YSkpO1xyXG4gICAgICBicmVhaztcclxuICAgIGNhc2UoXCIvbGlzdEdhbWVzXCIpOlxyXG4gICAgICBsZXQgbGlzdEdhbWVEYXRhID0gdXNlcklEO1xyXG4gICAgICBjYWxsYmFjayhudWxsLCBhd2FpdCBsaXN0R2FtZXNIdHRwUmVzcG9uc2UobGlzdEdhbWVEYXRhKSk7XHJcbiAgICAgIGJyZWFrO1xyXG4gICAgY2FzZShcIi9jcmVhdGVHYW1lXCIpOlxyXG4gICAgICBsZXQgY3JlYXRlR2FtZURhdGEgPSBDb21tb24uZGVzZXJpYWxpemVHYW1lRGF0YSh1c2VySUQsIEpTT04ucGFyc2UoZXZlbnQuYm9keSkpO1xyXG4gICAgICBjYWxsYmFjayhudWxsLCBhd2FpdCBjcmVhdGVHYW1lSHR0cFJlc3BvbnNlKGNyZWF0ZUdhbWVEYXRhKSk7XHJcbiAgICAgIGJyZWFrO1xyXG4gICAgY2FzZShcIi9tb2RpZnlHYW1lXCIpOlxyXG4gICAgICBsZXQgbW9kaWZ5R2FtZURhdGEgPSBDb21tb24uZGVzZXJpYWxpemVHYW1lRGF0YSh1c2VySUQsIEpTT04ucGFyc2UoZXZlbnQuYm9keSkpO1xyXG4gICAgICBjYWxsYmFjayhudWxsLCBhd2FpdCBtb2RpZnlHYW1lSHR0cFJlc3BvbnNlKG1vZGlmeUdhbWVEYXRhKSk7XHJcbiAgICAgIGJyZWFrO1xyXG4gICAgY2FzZSAoXCIvZGVsZXRlR2FtZVwiKTpcclxuICAgICAgbGV0IGRlbGV0ZUdhbWVEYXRhID0gQ29tbW9uLmRlc2VyaWFsaXplR2FtZURhdGEodXNlcklELCBKU09OLnBhcnNlKGV2ZW50LmJvZHkpKTtcclxuICAgICAgY2FsbGJhY2sobnVsbCwgYXdhaXQgZGVsZXRlR2FtZUh0dHBSZXNwb25zZShkZWxldGVHYW1lRGF0YSkpO1xyXG4gICAgICBicmVhaztcclxuICAgIGNhc2UgKFwiL2NvbGxlY3Rpb24vd2lzaGxpc3QvXCIpOlxyXG4gICAgICBjYWxsYmFjayhudWxsLCBhd2FpdCBnZXRXaXNobGlzdEh0dHBSZXNwb25zZSh1c2VySUQpKTtcclxuICAgICAgYnJlYWs7XHJcbiAgICBjYXNlIChcIi9jb2xsZWN0aW9uL3dpc2hsaXN0L2FkZEdhbWVcIik6XHJcbiAgICAgIGxldCBhZGRHYW1lRGF0YSA9IENvbW1vbi5kZXNlcmlhbGl6ZUNvbGxlY3Rpb25EYXRhKHVzZXJJRCwgSlNPTi5wYXJzZShldmVudC5ib2R5KSwgJ1dpc2hsaXN0Jyk7XHJcbiAgICAgIGNhbGxiYWNrKG51bGwsIGF3YWl0IGFkZEdhbWVUb1dpc2hsaXN0KGFkZEdhbWVEYXRhLCB1c2VySUQpKTtcclxuICAgICAgYnJlYWs7XHJcbiAgICBjYXNlIChcIi9jb2xsZWN0aW9uL3dpc2hsaXN0L21vZGlmeUdhbWVcIik6XHJcbiAgICAgIGxldCBtb2RpZnlXaXNobGlzdERhdGEgPSBDb21tb24uZGVzZXJpYWxpemVDb2xsZWN0aW9uRGF0YSh1c2VySUQsIEpTT04ucGFyc2UoZXZlbnQuYm9keSksICdXaXNobGlzdCcpO1xyXG4gICAgICBjYWxsYmFjayhudWxsLCBhd2FpdCBtb2RpZnlHYW1lSW5XaXNobGlzdChtb2RpZnlXaXNobGlzdERhdGEsIHVzZXJJRCkpO1xyXG4gICAgICBicmVhaztcclxuICAgIGNhc2UgKFwiL2NvbGxlY3Rpb24vd2lzaGxpc3QvcmVtb3ZlR2FtZVwiKTpcclxuICAgICAgbGV0IHJlbW92ZUdhbWVEYXRhID0gQ29tbW9uLmRlc2VyaWFsaXplQ29sbGVjdGlvbkRhdGEodXNlcklELCBKU09OLnBhcnNlKGV2ZW50LmJvZHkpLCAnV2lzaGxpc3QnKTtcclxuICAgICAgY2FsbGJhY2sobnVsbCwgYXdhaXQgcmVtb3ZlR2FtZUZyb21XaXNobGlzdChyZW1vdmVHYW1lRGF0YSwgdXNlcklEKSk7XHJcbiAgICAgIGJyZWFrO1xyXG4gICAgZGVmYXVsdDpcclxuICAgICAgY2FsbGJhY2sobnVsbCwgaHR0cFJlc3BvbnNlKHtzdGF0dXNDb2RlOiA0MDAsIGJvZHk6IEpTT04uc3RyaW5naWZ5KFwiSW52YWxpZCBvcGVyYXRpb24uXCIpfSkpO1xyXG4gICAgICBicmVhaztcclxuICAgIH1cclxufSAgXHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZ2V0R2FtZUh0dHBSZXNwb25zZShnYW1lOiBHYW1lKSB7XHJcbiAgdHJ5IHtcclxuICAgIGxldCByZXNwb25zZSA9IGF3YWl0IGdldEdhbWUoZ2FtZSk7XHJcbiAgICByZXR1cm4gaHR0cFJlc3BvbnNlKHtzdGF0dXNDb2RlOiAyMDAsIGJvZHk6IEpTT04uc3RyaW5naWZ5KHJlc3BvbnNlKX0pO1xyXG4gIH0gY2F0Y2ggKGVycjogYW55KSB7XHJcbiAgICByZXR1cm4gaHR0cFJlc3BvbnNlKHtzdGF0dXNDb2RlOiBlcnIuc3RhdHVzQ29kZSwgYm9keTogZXJyLm1lc3NhZ2V9KTtcclxuICB9XHJcbn1cclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBsaXN0R2FtZXNIdHRwUmVzcG9uc2UodXNlcklEOiBzdHJpbmcpIHtcclxuICB0cnkge1xyXG4gICAgbGV0IHJlc3BvbnNlID0gYXdhaXQgbGlzdEdhbWVzKHVzZXJJRCk7XHJcbiAgICByZXR1cm4gaHR0cFJlc3BvbnNlKHtzdGF0dXNDb2RlOiAyMDAsIGJvZHk6IEpTT04uc3RyaW5naWZ5KHJlc3BvbnNlKX0pO1xyXG4gIH0gY2F0Y2ggKGVycjogYW55KSB7XHJcbiAgICByZXR1cm4gaHR0cFJlc3BvbnNlKHtzdGF0dXNDb2RlOiBlcnIuc3RhdHVzQ29kZSwgYm9keTogZXJyLm1lc3NhZ2V9KTtcclxuICB9XHJcbn1cclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBjcmVhdGVHYW1lSHR0cFJlc3BvbnNlKGdhbWU6IEdhbWUpIHtcclxuICB0cnkge1xyXG4gICAgbGV0IHJlc3BvbnNlID0gYXdhaXQgY3JlYXRlR2FtZShnYW1lKTtcclxuICAgIHJldHVybiBodHRwUmVzcG9uc2Uoe3N0YXR1c0NvZGU6IDIwMCwgYm9keTogSlNPTi5zdHJpbmdpZnkocmVzcG9uc2UpfSk7XHJcbiAgfSBjYXRjaCAoZXJyOiBhbnkpIHtcclxuICAgIHJldHVybiBodHRwUmVzcG9uc2Uoe3N0YXR1c0NvZGU6IGVyci5zdGF0dXNDb2RlLCBib2R5OiBlcnIubWVzc2FnZX0pO1xyXG4gIH1cclxufVxyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIG1vZGlmeUdhbWVIdHRwUmVzcG9uc2UoZ2FtZTogR2FtZSkge1xyXG4gIHRyeSB7XHJcbiAgICBsZXQgcmVzcG9uc2UgPSBhd2FpdCBtb2RpZnlHYW1lKGdhbWUpO1xyXG4gICAgcmV0dXJuIGh0dHBSZXNwb25zZSh7c3RhdHVzQ29kZTogMjAwLCBib2R5OiBKU09OLnN0cmluZ2lmeShyZXNwb25zZSl9KTtcclxuICB9IGNhdGNoIChlcnI6IGFueSkge1xyXG4gICAgcmV0dXJuIGh0dHBSZXNwb25zZSh7c3RhdHVzQ29kZTogZXJyLnN0YXR1c0NvZGUsIGJvZHk6IGVyci5tZXNzYWdlfSk7XHJcbiAgfVxyXG59XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZGVsZXRlR2FtZUh0dHBSZXNwb25zZShnYW1lOiBHYW1lKSB7XHJcbiAgdHJ5IHtcclxuICAgIGxldCByZXNwb25zZSA9IGF3YWl0IGRlbGV0ZUdhbWUoZ2FtZSk7XHJcbiAgICByZXR1cm4gaHR0cFJlc3BvbnNlKHtzdGF0dXNDb2RlOiAyMDAsIGJvZHk6IEpTT04uc3RyaW5naWZ5KHJlc3BvbnNlKX0pO1xyXG4gIH0gY2F0Y2ggKGVycjogYW55KSB7XHJcbiAgICByZXR1cm4gaHR0cFJlc3BvbnNlKHtzdGF0dXNDb2RlOiBlcnIuc3RhdHVzQ29kZSwgYm9keTogZXJyLm1lc3NhZ2V9KTtcclxuICB9XHJcbn1cclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBnZXRXaXNobGlzdEh0dHBSZXNwb25zZSh1c2VySUQ6IHN0cmluZykge1xyXG4gIHRyeSB7XHJcbiAgICBsZXQgd2lzaGxpc3QgPSBuZXcgV2lzaGxpc3QodXNlcklEKTtcclxuICAgIGxldCByZXNwb25zZSA9IGF3YWl0IGdldENvbGxlY3Rpb24od2lzaGxpc3QpO1xyXG4gICAgcmV0dXJuIGh0dHBSZXNwb25zZSh7c3RhdHVzQ29kZTogMjAwLCBib2R5OiBKU09OLnN0cmluZ2lmeShyZXNwb25zZSl9KTtcclxuICB9IGNhdGNoIChlcnI6IGFueSkge1xyXG4gICAgcmV0dXJuIGh0dHBSZXNwb25zZSh7c3RhdHVzQ29kZTogZXJyLnN0YXR1c0NvZGUsIGJvZHk6IGVyci5tZXNzYWdlfSk7XHJcbiAgfVxyXG59XHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBhZGRHYW1lVG9XaXNobGlzdChnYW1lOiBHYW1lLCB1c2VySUQ6IHN0cmluZykge1xyXG4gIHRyeSB7XHJcbiAgICBsZXQgd2lzaGxpc3QgPSBuZXcgV2lzaGxpc3QodXNlcklEKTtcclxuICAgIGxldCByZXNwb25zZSA9IGF3YWl0IGFkZEdhbWVUb0NvbGxlY3Rpb24oZ2FtZSwgd2lzaGxpc3QpO1xyXG4gICAgcmV0dXJuIGh0dHBSZXNwb25zZSh7c3RhdHVzQ29kZTogMjAwLCBib2R5OiBKU09OLnN0cmluZ2lmeShyZXNwb25zZSl9KTtcclxuICB9IGNhdGNoIChlcnI6IGFueSkge1xyXG4gICAgcmV0dXJuIGh0dHBSZXNwb25zZSh7c3RhdHVzQ29kZTogZXJyLnN0YXR1c0NvZGUsIGJvZHk6IGVyci5tZXNzYWdlfSk7XHJcbiAgfVxyXG59XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gbW9kaWZ5R2FtZUluV2lzaGxpc3QoZ2FtZTogR2FtZSwgdXNlcklEOiBzdHJpbmcpIHtcclxuICB0cnkge1xyXG4gICAgbGV0IHdpc2hsaXN0ID0gbmV3IFdpc2hsaXN0KHVzZXJJRCk7XHJcbiAgICBsZXQgcmVzcG9uc2UgPSBhd2FpdCBtb2RpZnlHYW1lSW5Db2xsZWN0aW9uKGdhbWUsIHdpc2hsaXN0KTtcclxuICAgIHJldHVybiBodHRwUmVzcG9uc2Uoe3N0YXR1c0NvZGU6IDIwMCwgYm9keTogSlNPTi5zdHJpbmdpZnkocmVzcG9uc2UpfSk7XHJcbiAgfSBjYXRjaCAoZXJyOiBhbnkpIHtcclxuICAgIHJldHVybiBodHRwUmVzcG9uc2Uoe3N0YXR1c0NvZGU6IGVyci5zdGF0dXNDb2RlLCBib2R5OiBlcnIubWVzc2FnZX0pO1xyXG4gIH1cclxufVxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcmVtb3ZlR2FtZUZyb21XaXNobGlzdChnYW1lOiBHYW1lLCB1c2VySUQ6IHN0cmluZykge1xyXG4gIHRyeSB7XHJcbiAgICBsZXQgd2lzaGxpc3QgPSBuZXcgV2lzaGxpc3QodXNlcklEKTsgICAgXHJcbiAgICBsZXQgcmVzcG9uc2UgPSBhd2FpdCByZW1vdmVHYW1lRnJvbUNvbGxlY3Rpb24oZ2FtZSwgd2lzaGxpc3QpO1xyXG4gICAgcmV0dXJuIGh0dHBSZXNwb25zZSh7c3RhdHVzQ29kZTogMjAwLCBib2R5OiBKU09OLnN0cmluZ2lmeShyZXNwb25zZSl9KTtcclxuICB9IGNhdGNoIChlcnI6IGFueSkge1xyXG4gICAgcmV0dXJuIGh0dHBSZXNwb25zZSh7c3RhdHVzQ29kZTogZXJyLnN0YXR1c0NvZGUsIGJvZHk6IGVyci5tZXNzYWdlfSk7XHJcbiAgfVxyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gaHR0cFJlc3BvbnNlKGRhdGE6IEludGVyZmFjZXMuSUh0dHBSZXNwb25zZSkgOiB7fSB7XHJcbiAgcmV0dXJuIHtcclxuICAgIHN0YXR1c0NvZGU6IGRhdGEuc3RhdHVzQ29kZSxcclxuICAgIGJvZHk6IGRhdGEuYm9keSxcclxuICAgIGhlYWRlcnM6IHtcclxuICAgICAgJ0FjY2Vzcy1Db250cm9sLUFsbG93LU9yaWdpbic6ICcqJ1xyXG4gICAgfVxyXG4gIH1cclxufSJdfQ==