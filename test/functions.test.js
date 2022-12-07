"use strict";
const game = require("../functions/models/game");
const gameManager = require("../functions/dataManager/gameManager");
const httpResponse = require("../functions/shared/common/httpResponse");
const error = require("../functions/error/gameErrorHandler");
const common = require("../functions/shared/common/game");
test("CreateGame", async () => {
    let gameID = '123456';
    let userID = 'erikchaulk';
    let defaultCollectionID = `Col-${userID}-Default`;
    let priceMonitorData = [];
    let testCreateGame = new game.Game(gameID, userID, 'League of Legends', 2008, 'Moba', 'PC', 'Riot Games', 'https://www.testcoverimageurl.com', defaultCollectionID, priceMonitorData);
    let response = await gameManager.createGame(testCreateGame);
    expect(response).toEqual(testCreateGame);
});
test("GetGame", async () => {
    let gameID = '123456';
    let userID = 'erikchaulk';
    let defaultCollectionID = `Col-${userID}-Default`;
    let priceMonitorData = [];
    let testGetGame = new game.Game(gameID, userID, 'League of Legends', 2008, 'Moba', 'PC', 'Riot Games', 'https://www.testcoverimageurl.com', defaultCollectionID, priceMonitorData);
    let response = await gameManager.getGame(testGetGame);
    expect(response).toEqual(testGetGame);
});
test("ModifyGame", async () => {
    let gameID = '123456';
    let userID = 'erikchaulk';
    let defaultCollectionID = `Col-${userID}-Default`;
    let priceMonitorData = [];
    let testModifyGame = new game.Game(gameID, userID, 'League of Legends', 2010, 'Moba', 'PC', 'Riot Games', 'https://www.testcoverimageurl.com', defaultCollectionID, priceMonitorData);
    let response = await gameManager.modifyGame(testModifyGame);
    expect(response).toEqual(testModifyGame);
});
test("DeleteGame", async () => {
    let gameID = '123456';
    let userID = 'erikchaulk';
    let defaultCollectionID = `Col-${userID}-Default`;
    let testDeleteGame = new game.Game(gameID, userID, 'League of Legends', 2010, 'Moba', 'PC', 'Riot Games', 'https://www.testcoverimageurl.com', defaultCollectionID);
    let response = await gameManager.deleteGame(testDeleteGame);
    expect(response).toEqual(testDeleteGame);
});
test("serializeExistingGameData", async () => {
    let data = {
        'gameID': '123456',
        'gameName': 'League of Legends',
        'yearReleased': 2010,
        'genre': 'Moba',
        'console': 'PC',
        'developer': 'Riot Games',
        'cover': 'https://www.testcoverimageurl.com'
    };
    let userData = {
        userID: 'erikchaulk',
    };
    let defaultCollectionID = `Col-${userData.userID}-Default`;
    let response = common.serializeExistingGameData(userData, data);
    let testDynamoResponse = new game.Game(data.gameID, userData.userID, 'League of Legends', 2010, 'Moba', 'PC', 'Riot Games', 'https://www.testcoverimageurl.com', defaultCollectionID);
    expect(response).toEqual(testDynamoResponse);
});
test("gameErrorHandler", async () => {
    let testError = new error.GameError('Game not found');
    expect(testError.message).toEqual("Game error, datastore response: Game not found");
});
test("createGameHttpResponse", async () => {
    let gameID = '123456';
    let userID = 'erikchaulk';
    let defaultCollectionID = `Col-${userID}-Default`;
    let priceMonitorData = [];
    let testGame = new game.Game(gameID, userID, 'League of Legends', 2010, 'Moba', 'PC', 'Riot Games', 'https://www.testcoverimageurl.com', defaultCollectionID, priceMonitorData);
    let response = await httpResponse.createGameHttpResponse(testGame);
    expect(response).toEqual(httpResponse.httpResponse({ statusCode: 200, body: JSON.stringify(testGame) }));
});
//Game already created
test("createGameHttpResponse", async () => {
    let gameID = '123456';
    let userID = 'erikchaulk';
    let defaultCollectionID = `Col-${userID}-Default`;
    let priceMonitorData = [];
    let testGame = new game.Game(gameID, userID, 'League of Legends', 2010, 'Moba', 'PC', 'Riot Games', 'https://www.testcoverimageurl.com', defaultCollectionID, priceMonitorData);
    let response = await httpResponse.createGameHttpResponse(testGame);
    expect(response).toEqual(httpResponse.httpResponse({ statusCode: 400, body: "Game Error" }));
});
test("getGameHttpResponse", async () => {
    let gameID = '123456';
    let userID = 'erikchaulk';
    let defaultCollectionID = `Col-${userID}-Default`;
    let priceMonitorData = [];
    let testGame = new game.Game(gameID, userID, 'League of Legends', 2010, 'Moba', 'PC', 'Riot Games', 'https://www.testcoverimageurl.com', defaultCollectionID, priceMonitorData);
    let response = await httpResponse.getGameHttpResponse(testGame);
    expect(response).toEqual(httpResponse.httpResponse({ statusCode: 200, body: JSON.stringify(testGame) }));
});
test("modifyGameHttpResponse", async () => {
    let gameID = '123456';
    let userID = 'erikchaulk';
    let defaultCollectionID = `Col-${userID}-Default`;
    let priceMonitorData = [];
    let testGame = new game.Game(gameID, userID, 'League of Legends', 2012, 'Moba', 'PC', 'Riot Games', 'https://www.testcoverimageurl.com', defaultCollectionID, priceMonitorData);
    let response = await httpResponse.modifyGameHttpResponse(testGame);
    expect(response).toEqual(httpResponse.httpResponse({ statusCode: 200, body: JSON.stringify(testGame) }));
});
//Modify a game that doesn't exist
test("modifyGameHttpResponse", async () => {
    let gameID = '234567';
    let userID = 'erikchaulk';
    let testGame = new game.Game(gameID, userID, 'The Witness', 2016, 'Strategy', 'PC', 'Valve', 'https://www.testcoverimageurl.com');
    let response = await httpResponse.modifyGameHttpResponse(testGame);
    expect(response).toEqual(httpResponse.httpResponse({ statusCode: 400, body: "Game Error" }));
});
test("deleteGameHttpResponse", async () => {
    let gameID = '123456';
    let userID = 'erikchaulk';
    let defaultCollectionID = `Col-${userID}-Default`;
    let testGame = new game.Game(gameID, userID, 'League of Legends', 2012, 'Moba', 'PC', 'Riot Games', 'https://www.testcoverimageurl.com', defaultCollectionID);
    let response = await httpResponse.deleteGameHttpResponse(testGame);
    expect(response).toEqual(httpResponse.httpResponse({ statusCode: 200, body: JSON.stringify(testGame) }));
});
//Delete a game that doesn't exist
test("deleteGameHttpResponse", async () => {
    let gameID = '123456';
    let userID = 'erikchaulk';
    let testGame = new game.Game(gameID, userID, 'League of Legends', 2012, 'Moba', 'PC', 'Riot Games', 'https://www.testcoverimageurl.com');
    let response = await httpResponse.deleteGameHttpResponse(testGame);
    expect(response).toEqual(httpResponse.httpResponse({ statusCode: 400, body: "Game Error" }));
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZnVuY3Rpb25zLnRlc3QuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJmdW5jdGlvbnMudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEsTUFBTSxJQUFJLEdBQUcsT0FBTyxDQUFDLDBCQUEwQixDQUFDLENBQUM7QUFDakQsTUFBTSxXQUFXLEdBQUcsT0FBTyxDQUFDLHNDQUFzQyxDQUFDLENBQUM7QUFDcEUsTUFBTSxZQUFZLEdBQUcsT0FBTyxDQUFDLHlDQUF5QyxDQUFDLENBQUM7QUFDeEUsTUFBTSxLQUFLLEdBQUcsT0FBTyxDQUFDLHFDQUFxQyxDQUFDLENBQUE7QUFDNUQsTUFBTSxNQUFNLEdBQUcsT0FBTyxDQUFDLGlDQUFpQyxDQUFDLENBQUM7QUFFMUQsSUFBSSxDQUFDLFlBQVksRUFBRSxLQUFLLElBQUksRUFBRTtJQUMxQixJQUFJLE1BQU0sR0FBRyxRQUFRLENBQUM7SUFDdEIsSUFBSSxNQUFNLEdBQUcsWUFBWSxDQUFDO0lBQzFCLElBQUksbUJBQW1CLEdBQUcsT0FBTyxNQUFNLFVBQVUsQ0FBQztJQUNsRCxJQUFJLGdCQUFnQixHQUFHLEVBQVMsQ0FBQztJQUNqQyxJQUFJLGNBQWMsR0FBRyxJQUFJLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLE1BQU0sRUFBRSxtQkFBbUIsRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxZQUFZLEVBQUUsbUNBQW1DLEVBQUUsbUJBQW1CLEVBQUUsZ0JBQWdCLENBQUMsQ0FBQztJQUN0TCxJQUFJLFFBQVEsR0FBRyxNQUFNLFdBQVcsQ0FBQyxVQUFVLENBQUMsY0FBYyxDQUFDLENBQUM7SUFDNUQsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxjQUFjLENBQUMsQ0FBQztBQUM3QyxDQUFDLENBQUMsQ0FBQztBQUVILElBQUksQ0FBQyxTQUFTLEVBQUUsS0FBSyxJQUFJLEVBQUU7SUFDdkIsSUFBSSxNQUFNLEdBQUcsUUFBUSxDQUFDO0lB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bEMsSUFBSSxDQUFDLHdCQUF3QixFQUFFLEtBQUssSUFBSSxFQUFFO0lBQ3RDLElBQUksTUFBTSxHQUFHLFFBQVEsQ0FBQztJQUN0QixJQUFJLE1BQU0sR0FBRyxZQUFZLENBQUM7SUFDMUIsSUFBSSxRQUFRLEdBQUcsSUFBSSxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxNQUFNLEVBQUUsbUJBQW1CLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsWUFBWSxFQUFFLG1DQUFtQyxDQUFDLENBQUM7SUFDekksSUFBSSxRQUFRLEdBQUcsTUFBTSxZQUFZLENBQUMsc0JBQXNCLENBQUMsUUFBUSxDQUFDLENBQUM7SUFDbkUsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxZQUFZLENBQUMsWUFBWSxDQUFDLEVBQUMsVUFBVSxFQUFFLEdBQUcsRUFBRSxJQUFJLEVBQUUsWUFBWSxFQUFDLENBQUMsQ0FBQyxDQUFDO0FBQy9GLENBQUMsQ0FBQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiY29uc3QgZ2FtZSA9IHJlcXVpcmUoXCIuLi9mdW5jdGlvbnMvbW9kZWxzL2dhbWVcIik7XG5jb25zdCBnYW1lTWFuYWdlciA9IHJlcXVpcmUoXCIuLi9mdW5jdGlvbnMvZGF0YU1hbmFnZXIvZ2FtZU1hbmFnZXJcIik7XG5jb25zdCBodHRwUmVzcG9uc2UgPSByZXF1aXJlKFwiLi4vZnVuY3Rpb25zL3NoYXJlZC9jb21tb24vaHR0cFJlc3BvbnNlXCIpO1xuY29uc3QgZXJyb3IgPSByZXF1aXJlKFwiLi4vZnVuY3Rpb25zL2Vycm9yL2dhbWVFcnJvckhhbmRsZXJcIilcbmNvbnN0IGNvbW1vbiA9IHJlcXVpcmUoXCIuLi9mdW5jdGlvbnMvc2hhcmVkL2NvbW1vbi9nYW1lXCIpO1xuXG50ZXN0KFwiQ3JlYXRlR2FtZVwiLCBhc3luYyAoKSA9PiB7XG4gICAgbGV0IGdhbWVJRCA9ICcxMjM0NTYnO1xuICAgIGxldCB1c2VySUQgPSAnZXJpa2NoYXVsayc7XG4gICAgbGV0IGRlZmF1bHRDb2xsZWN0aW9uSUQgPSBgQ29sLSR7dXNlcklEfS1EZWZhdWx0YDtcbiAgICBsZXQgcHJpY2VNb25pdG9yRGF0YSA9IFtdIGFzIGFueTtcbiAgICBsZXQgdGVzdENyZWF0ZUdhbWUgPSBuZXcgZ2FtZS5HYW1lKGdhbWVJRCwgdXNlcklELCAnTGVhZ3VlIG9mIExlZ2VuZHMnLCAyMDA4LCAnTW9iYScsICdQQycsICdSaW90IEdhbWVzJywgJ2h0dHBzOi8vd3d3LnRlc3Rjb3ZlcmltYWdldXJsLmNvbScsIGRlZmF1bHRDb2xsZWN0aW9uSUQsIHByaWNlTW9uaXRvckRhdGEpO1xuICAgIGxldCByZXNwb25zZSA9IGF3YWl0IGdhbWVNYW5hZ2VyLmNyZWF0ZUdhbWUodGVzdENyZWF0ZUdhbWUpO1xuICAgIGV4cGVjdChyZXNwb25zZSkudG9FcXVhbCh0ZXN0Q3JlYXRlR2FtZSk7XG59KTtcblxudGVzdChcIkdldEdhbWVcIiwgYXN5bmMgKCkgPT4ge1xuICAgIGxldCBnYW1lSUQgPSAnMTIzNDU2JztcbiAgICBsZXQgdXNlcklEID0gJ2VyaWtjaGF1bGsnO1xuICAgIGxldCBkZWZhdWx0Q29sbGVjdGlvbklEID0gYENvbC0ke3VzZXJJRH0tRGVmYXVsdGA7XG4gICAgbGV0IHByaWNlTW9uaXRvckRhdGEgPSBbXSBhcyBhbnk7XG4gICAgbGV0IHRlc3RHZXRHYW1lID0gbmV3IGdhbWUuR2FtZShnYW1lSUQsIHVzZXJJRCwgJ0xlYWd1ZSBvZiBMZWdlbmRzJywgMjAwOCwgJ01vYmEnLCAnUEMnLCAnUmlvdCBHYW1lcycsICdodHRwczovL3d3dy50ZXN0Y292ZXJpbWFnZXVybC5jb20nLCBkZWZhdWx0Q29sbGVjdGlvbklELCBwcmljZU1vbml0b3JEYXRhKTtcbiAgICBsZXQgcmVzcG9uc2UgPSBhd2FpdCBnYW1lTWFuYWdlci5nZXRHYW1lKHRlc3RHZXRHYW1lKTtcbiAgICBleHBlY3QocmVzcG9uc2UpLnRvRXF1YWwodGVzdEdldEdhbWUpO1xufSk7XG5cbnRlc3QoXCJNb2RpZnlHYW1lXCIsIGFzeW5jICgpID0+IHtcbiAgICBsZXQgZ2FtZUlEID0gJzEyMzQ1Nic7XG4gICAgbGV0IHVzZXJJRCA9ICdlcmlrY2hhdWxrJztcbiAgICBsZXQgZGVmYXVsdENvbGxlY3Rpb25JRCA9IGBDb2wtJHt1c2VySUR9LURlZmF1bHRgO1xuICAgIGxldCBwcmljZU1vbml0b3JEYXRhID0gW10gYXMgYW55O1xuICAgIGxldCB0ZXN0TW9kaWZ5R2FtZSA9IG5ldyBnYW1lLkdhbWUoZ2FtZUlELCB1c2VySUQsICdMZWFndWUgb2YgTGVnZW5kcycsIDIwMTAsICdNb2JhJywgJ1BDJywgJ1Jpb3QgR2FtZXMnLCAnaHR0cHM6Ly93d3cudGVzdGNvdmVyaW1hZ2V1cmwuY29tJywgZGVmYXVsdENvbGxlY3Rpb25JRCwgcHJpY2VNb25pdG9yRGF0YSk7XG4gICAgbGV0IHJlc3BvbnNlID0gYXdhaXQgZ2FtZU1hbmFnZXIubW9kaWZ5R2FtZSh0ZXN0TW9kaWZ5R2FtZSk7XG4gICAgZXhwZWN0KHJlc3BvbnNlKS50b0VxdWFsKHRlc3RNb2RpZnlHYW1lKTtcbn0pO1xuXG50ZXN0KFwiRGVsZXRlR2FtZVwiLCBhc3luYyAoKSA9PiB7XG4gICAgbGV0IGdhbWVJRCA9ICcxMjM0NTYnO1xuICAgIGxldCB1c2VySUQgPSAnZXJpa2NoYXVsayc7XG4gICAgbGV0IGRlZmF1bHRDb2xsZWN0aW9uSUQgPSBgQ29sLSR7dXNlcklEfS1EZWZhdWx0YDtcbiAgICBsZXQgdGVzdERlbGV0ZUdhbWUgPSBuZXcgZ2FtZS5HYW1lKGdhbWVJRCwgdXNlcklELCAnTGVhZ3VlIG9mIExlZ2VuZHMnLCAyMDEwLCAnTW9iYScsICdQQycsICdSaW90IEdhbWVzJywgJ2h0dHBzOi8vd3d3LnRlc3Rjb3ZlcmltYWdldXJsLmNvbScsIGRlZmF1bHRDb2xsZWN0aW9uSUQpO1xuICAgIGxldCByZXNwb25zZSA9IGF3YWl0IGdhbWVNYW5hZ2VyLmRlbGV0ZUdhbWUodGVzdERlbGV0ZUdhbWUpO1xuICAgIGV4cGVjdChyZXNwb25zZSkudG9FcXVhbCh0ZXN0RGVsZXRlR2FtZSk7XG59KTtcblxudGVzdChcInNlcmlhbGl6ZUV4aXN0aW5nR2FtZURhdGFcIiwgYXN5bmMgKCkgPT4ge1xuICAgIGxldCBkYXRhID0ge1xuICAgICAgICAnZ2FtZUlEJzonMTIzNDU2JyxcbiAgICAgICAgJ2dhbWVOYW1lJzonTGVhZ3VlIG9mIExlZ2VuZHMnLFxuICAgICAgICAneWVhclJlbGVhc2VkJzoyMDEwLFxuICAgICAgICAnZ2VucmUnOidNb2JhJyxcbiAgICAgICAgJ2NvbnNvbGUnOidQQycsXG4gICAgICAgICdkZXZlbG9wZXInOidSaW90IEdhbWVzJyxcbiAgICAgICAgJ2NvdmVyJzogJ2h0dHBzOi8vd3d3LnRlc3Rjb3ZlcmltYWdldXJsLmNvbSdcbiAgICB9IFxuICAgIGxldCB1c2VyRGF0YSA9IHtcbiAgICAgICAgdXNlcklEOiAnZXJpa2NoYXVsaycsXG4gICAgfVxuICAgIGxldCBkZWZhdWx0Q29sbGVjdGlvbklEID0gYENvbC0ke3VzZXJEYXRhLnVzZXJJRH0tRGVmYXVsdGA7XG4gICAgbGV0IHJlc3BvbnNlID0gY29tbW9uLnNlcmlhbGl6ZUV4aXN0aW5nR2FtZURhdGEodXNlckRhdGEsIGRhdGEpO1xuICAgIGxldCB0ZXN0RHluYW1vUmVzcG9uc2UgPSBuZXcgZ2FtZS5HYW1lKGRhdGEuZ2FtZUlELCB1c2VyRGF0YS51c2VySUQsICdMZWFndWUgb2YgTGVnZW5kcycsIDIwMTAsICdNb2JhJywgJ1BDJywgJ1Jpb3QgR2FtZXMnLCAnaHR0cHM6Ly93d3cudGVzdGNvdmVyaW1hZ2V1cmwuY29tJywgZGVmYXVsdENvbGxlY3Rpb25JRCk7XG4gICAgZXhwZWN0KHJlc3BvbnNlKS50b0VxdWFsKHRlc3REeW5hbW9SZXNwb25zZSk7XG59KTtcblxudGVzdChcImdhbWVFcnJvckhhbmRsZXJcIiwgYXN5bmMgKCkgPT4ge1xuICAgIGxldCB0ZXN0RXJyb3IgPSBuZXcgZXJyb3IuR2FtZUVycm9yKCdHYW1lIG5vdCBmb3VuZCcpO1xuICAgIGV4cGVjdCh0ZXN0RXJyb3IubWVzc2FnZSkudG9FcXVhbChcIkdhbWUgZXJyb3IsIGRhdGFzdG9yZSByZXNwb25zZTogR2FtZSBub3QgZm91bmRcIik7XG59KTtcblxudGVzdChcImNyZWF0ZUdhbWVIdHRwUmVzcG9uc2VcIiwgYXN5bmMgKCkgPT4ge1xuICAgIGxldCBnYW1lSUQgPSAnMTIzNDU2JztcbiAgICBsZXQgdXNlcklEID0gJ2VyaWtjaGF1bGsnO1xuICAgIGxldCBkZWZhdWx0Q29sbGVjdGlvbklEID0gYENvbC0ke3VzZXJJRH0tRGVmYXVsdGA7XG4gICAgbGV0IHByaWNlTW9uaXRvckRhdGEgPSBbXSBhcyBhbnk7XG4gICAgbGV0IHRlc3RHYW1lID0gbmV3IGdhbWUuR2FtZShnYW1lSUQsIHVzZXJJRCwgJ0xlYWd1ZSBvZiBMZWdlbmRzJywgMjAxMCwgJ01vYmEnLCAnUEMnLCAnUmlvdCBHYW1lcycsICdodHRwczovL3d3dy50ZXN0Y292ZXJpbWFnZXVybC5jb20nLCBkZWZhdWx0Q29sbGVjdGlvbklELCBwcmljZU1vbml0b3JEYXRhKTtcbiAgICBsZXQgcmVzcG9uc2UgPSBhd2FpdCBodHRwUmVzcG9uc2UuY3JlYXRlR2FtZUh0dHBSZXNwb25zZSh0ZXN0R2FtZSk7XG4gICAgZXhwZWN0KHJlc3BvbnNlKS50b0VxdWFsKGh0dHBSZXNwb25zZS5odHRwUmVzcG9uc2Uoe3N0YXR1c0NvZGU6IDIwMCwgYm9keTogSlNPTi5zdHJpbmdpZnkodGVzdEdhbWUpfSkpO1xufSk7XG5cbi8vR2FtZSBhbHJlYWR5IGNyZWF0ZWRcbnRlc3QoXCJjcmVhdGVHYW1lSHR0cFJlc3BvbnNlXCIsIGFzeW5jICgpID0+IHtcbiAgICBsZXQgZ2FtZUlEID0gJzEyMzQ1Nic7XG4gICAgbGV0IHVzZXJJRCA9ICdlcmlrY2hhdWxrJztcbiAgICBsZXQgZGVmYXVsdENvbGxlY3Rpb25JRCA9IGBDb2wtJHt1c2VySUR9LURlZmF1bHRgO1xuICAgIGxldCBwcmljZU1vbml0b3JEYXRhID0gW10gYXMgYW55O1xuICAgIGxldCB0ZXN0R2FtZSA9IG5ldyBnYW1lLkdhbWUoZ2FtZUlELCB1c2VySUQsICdMZWFndWUgb2YgTGVnZW5kcycsIDIwMTAsICdNb2JhJywgJ1BDJywgJ1Jpb3QgR2FtZXMnLCAnaHR0cHM6Ly93d3cudGVzdGNvdmVyaW1hZ2V1cmwuY29tJywgZGVmYXVsdENvbGxlY3Rpb25JRCwgcHJpY2VNb25pdG9yRGF0YSk7XG4gICAgbGV0IHJlc3BvbnNlID0gYXdhaXQgaHR0cFJlc3BvbnNlLmNyZWF0ZUdhbWVIdHRwUmVzcG9uc2UodGVzdEdhbWUpO1xuICAgIGV4cGVjdChyZXNwb25zZSkudG9FcXVhbChodHRwUmVzcG9uc2UuaHR0cFJlc3BvbnNlKHtzdGF0dXNDb2RlOiA0MDAsIGJvZHk6IFwiR2FtZSBFcnJvclwifSkpO1xufSk7XG5cbnRlc3QoXCJnZXRHYW1lSHR0cFJlc3BvbnNlXCIsIGFzeW5jICgpID0+IHtcbiAgICBsZXQgZ2FtZUlEID0gJzEyMzQ1Nic7XG4gICAgbGV0IHVzZXJJRCA9ICdlcmlrY2hhdWxrJztcbiAgICBsZXQgZGVmYXVsdENvbGxlY3Rpb25JRCA9IGBDb2wtJHt1c2VySUR9LURlZmF1bHRgO1xuICAgIGxldCBwcmljZU1vbml0b3JEYXRhID0gW10gYXMgYW55O1xuICAgIGxldCB0ZXN0R2FtZSA9IG5ldyBnYW1lLkdhbWUoZ2FtZUlELCB1c2VySUQsICdMZWFndWUgb2YgTGVnZW5kcycsIDIwMTAsICdNb2JhJywgJ1BDJywgJ1Jpb3QgR2FtZXMnLCAnaHR0cHM6Ly93d3cudGVzdGNvdmVyaW1hZ2V1cmwuY29tJywgZGVmYXVsdENvbGxlY3Rpb25JRCwgcHJpY2VNb25pdG9yRGF0YSk7XG4gICAgbGV0IHJlc3BvbnNlID0gYXdhaXQgaHR0cFJlc3BvbnNlLmdldEdhbWVIdHRwUmVzcG9uc2UodGVzdEdhbWUpO1xuICAgIGV4cGVjdChyZXNwb25zZSkudG9FcXVhbChodHRwUmVzcG9uc2UuaHR0cFJlc3BvbnNlKHtzdGF0dXNDb2RlOiAyMDAsIGJvZHk6IEpTT04uc3RyaW5naWZ5KHRlc3RHYW1lKX0pKTtcbn0pO1xuXG50ZXN0KFwibW9kaWZ5R2FtZUh0dHBSZXNwb25zZVwiLCBhc3luYyAoKSA9PiB7XG4gICAgbGV0IGdhbWVJRCA9ICcxMjM0NTYnO1xuICAgIGxldCB1c2VySUQgPSAnZXJpa2NoYXVsayc7XG4gICAgbGV0IGRlZmF1bHRDb2xsZWN0aW9uSUQgPSBgQ29sLSR7dXNlcklEfS1EZWZhdWx0YDtcbiAgICBsZXQgcHJpY2VNb25pdG9yRGF0YSA9IFtdIGFzIGFueTtcbiAgICBsZXQgdGVzdEdhbWUgPSBuZXcgZ2FtZS5HYW1lKGdhbWVJRCwgdXNlcklELCAnTGVhZ3VlIG9mIExlZ2VuZHMnLCAyMDEyLCAnTW9iYScsICdQQycsICdSaW90IEdhbWVzJywgJ2h0dHBzOi8vd3d3LnRlc3Rjb3ZlcmltYWdldXJsLmNvbScsIGRlZmF1bHRDb2xsZWN0aW9uSUQsIHByaWNlTW9uaXRvckRhdGEpO1xuICAgIGxldCByZXNwb25zZSA9IGF3YWl0IGh0dHBSZXNwb25zZS5tb2RpZnlHYW1lSHR0cFJlc3BvbnNlKHRlc3RHYW1lKTtcbiAgICBleHBlY3QocmVzcG9uc2UpLnRvRXF1YWwoaHR0cFJlc3BvbnNlLmh0dHBSZXNwb25zZSh7c3RhdHVzQ29kZTogMjAwLCBib2R5OiBKU09OLnN0cmluZ2lmeSh0ZXN0R2FtZSl9KSk7XG59KTtcblxuLy9Nb2RpZnkgYSBnYW1lIHRoYXQgZG9lc24ndCBleGlzdFxudGVzdChcIm1vZGlmeUdhbWVIdHRwUmVzcG9uc2VcIiwgYXN5bmMgKCkgPT4ge1xuICAgIGxldCBnYW1lSUQgPSAnMjM0NTY3JztcbiAgICBsZXQgdXNlcklEID0gJ2VyaWtjaGF1bGsnO1xuICAgIGxldCB0ZXN0R2FtZSA9IG5ldyBnYW1lLkdhbWUoZ2FtZUlELCB1c2VySUQsICdUaGUgV2l0bmVzcycsIDIwMTYsICdTdHJhdGVneScsICdQQycsICdWYWx2ZScsICdodHRwczovL3d3dy50ZXN0Y292ZXJpbWFnZXVybC5jb20nKTtcbiAgICBsZXQgcmVzcG9uc2UgPSBhd2FpdCBodHRwUmVzcG9uc2UubW9kaWZ5R2FtZUh0dHBSZXNwb25zZSh0ZXN0R2FtZSk7XG4gICAgZXhwZWN0KHJlc3BvbnNlKS50b0VxdWFsKGh0dHBSZXNwb25zZS5odHRwUmVzcG9uc2Uoe3N0YXR1c0NvZGU6IDQwMCwgYm9keTogXCJHYW1lIEVycm9yXCJ9KSk7XG59KTtcblxudGVzdChcImRlbGV0ZUdhbWVIdHRwUmVzcG9uc2VcIiwgYXN5bmMgKCkgPT4ge1xuICAgIGxldCBnYW1lSUQgPSAnMTIzNDU2JztcbiAgICBsZXQgdXNlcklEID0gJ2VyaWtjaGF1bGsnO1xuICAgIGxldCBkZWZhdWx0Q29sbGVjdGlvbklEID0gYENvbC0ke3VzZXJJRH0tRGVmYXVsdGA7XG4gICAgbGV0IHRlc3RHYW1lID0gbmV3IGdhbWUuR2FtZShnYW1lSUQsIHVzZXJJRCwgJ0xlYWd1ZSBvZiBMZWdlbmRzJywgMjAxMiwgJ01vYmEnLCAnUEMnLCAnUmlvdCBHYW1lcycsICdodHRwczovL3d3dy50ZXN0Y292ZXJpbWFnZXVybC5jb20nLCBkZWZhdWx0Q29sbGVjdGlvbklEKTtcbiAgICBsZXQgcmVzcG9uc2UgPSBhd2FpdCBodHRwUmVzcG9uc2UuZGVsZXRlR2FtZUh0dHBSZXNwb25zZSh0ZXN0R2FtZSk7XG4gICAgZXhwZWN0KHJlc3BvbnNlKS50b0VxdWFsKGh0dHBSZXNwb25zZS5odHRwUmVzcG9uc2Uoe3N0YXR1c0NvZGU6IDIwMCwgYm9keTogSlNPTi5zdHJpbmdpZnkodGVzdEdhbWUpfSkpO1xufSk7XG5cbi8vRGVsZXRlIGEgZ2FtZSB0aGF0IGRvZXNuJ3QgZXhpc3RcbnRlc3QoXCJkZWxldGVHYW1lSHR0cFJlc3BvbnNlXCIsIGFzeW5jICgpID0+IHtcbiAgICBsZXQgZ2FtZUlEID0gJzEyMzQ1Nic7XG4gICAgbGV0IHVzZXJJRCA9ICdlcmlrY2hhdWxrJztcbiAgICBsZXQgdGVzdEdhbWUgPSBuZXcgZ2FtZS5HYW1lKGdhbWVJRCwgdXNlcklELCAnTGVhZ3VlIG9mIExlZ2VuZHMnLCAyMDEyLCAnTW9iYScsICdQQycsICdSaW90IEdhbWVzJywgJ2h0dHBzOi8vd3d3LnRlc3Rjb3ZlcmltYWdldXJsLmNvbScpO1xuICAgIGxldCByZXNwb25zZSA9IGF3YWl0IGh0dHBSZXNwb25zZS5kZWxldGVHYW1lSHR0cFJlc3BvbnNlKHRlc3RHYW1lKTtcbiAgICBleHBlY3QocmVzcG9uc2UpLnRvRXF1YWwoaHR0cFJlc3BvbnNlLmh0dHBSZXNwb25zZSh7c3RhdHVzQ29kZTogNDAwLCBib2R5OiBcIkdhbWUgRXJyb3JcIn0pKTtcbn0pOyJdfQ==