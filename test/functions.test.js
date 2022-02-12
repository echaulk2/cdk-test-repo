"use strict";
const game = require("../functions/game");
const gameManager = require("../functions/gameManager");
const index = require("../functions/index");
const error = require("../functions/gameErrorHandler");
/*
test("CreateGame", async () => {
    let testGame = new game.Game('erikchaulk', 'League of Legends', 2008, 'Moba', 'PC', 'Riot Games');
    let response = await testGame.createGame();
    expect(response).toEqual(testGame);
});

test("GetGame", async () => {
    let testGame = new game.Game('erikchaulk', 'League of Legends', 2008, 'Moba', 'PC', 'Riot Games');
    let response = await gameManager.getGame(testGame);
    expect(response).toEqual(testGame);
});

test("Cheerio", () => {
    let testGame = new game.Game('erikchaulk', 'Overwatch', 2016, 'Strategy', 'PC', 'Blizzard');
    let response = testGame.getPrice();
    expect(response).toEqual(50);
});

test("ModifyGame", async () => {
    let testGame = new game.Game('erikchaulk', 'League of Legends', 2010, 'Moba', 'PC', 'Riot Games');
    let response = await gameManager.modifyGame(testGame);
    expect(response).toEqual(testGame);
});

test("DeleteGame", async () => {
    let testGame = new game.Game('erikchaulk', 'League of Legends', 2010, 'Moba', 'PC', 'Riot Games');
    let response = await gameManager.deleteGame(testGame);
    expect(response).toEqual(testGame);
});

test("serializeDynamoResponse", async () => {
    let dynamoResponse = {
        'userID':'erikchaulk',
        'gameName':'League of Legends',
        'yearReleased':2010,
        'genre':'Moba',
        'console':'PC',
        'developer':'Riot Games'
    }
    let response = gameManager.serializeDynamoResponse(dynamoResponse);
    let testGame = new game.Game('erikchaulk', 'League of Legends', 2010, 'Moba', 'PC', 'Riot Games');
    expect(response).toEqual(testGame);
});

test("gameErrorHandler", async () => {
    let testError = new error.GameError('Game not found', 404);
    expect(testError.message).toEqual("Game error, datastore response: Game not found");
    expect(testError.statusCode).toEqual(404);
});

test("createGameHttpResponse", async () => {
    let testGame = new game.Game('erikchaulk', 'League of Legends', 2010, 'Moba', 'PC', 'Riot Games');
    let response = await index.createGameHttpResponse(testGame);
    expect(response).toEqual(index.httpResponse({statusCode: 200, body: JSON.stringify(testGame)}));
});

//Game already created
test("createGameHttpResponse", async () => {
    let testGame = new game.Game('erikchaulk', 'League of Legends', 2010, 'Moba', 'PC', 'Riot Games');
    let response = await index.createGameHttpResponse(testGame);
    expect(response).toEqual(index.httpResponse({statusCode: 400, body: "Game error, datastore response: The conditional request failed"}));
});

test("getGameHttpResponse", async () => {
    let testGame = new game.Game('erikchaulk', 'League of Legends', 2010, 'Moba', 'PC', 'Riot Games');
    let response = await index.getGameHttpResponse(testGame);
    expect(response).toEqual(index.httpResponse({statusCode: 200, body: JSON.stringify(testGame)}));
});

test("listGamesHttpResponse", async () => {
    let testGame = new game.Game('erikchaulk', 'League of Legends', 2010, 'Moba', 'PC', 'Riot Games');
    let secondTestGame = new game.Game('erikchaulk', 'Magic: The Gathering', 2019, 'Trading Card Game', 'PC', 'Wizards of the Coast');
    let gameArray = [];
    gameArray.push(testGame, secondTestGame);
    let userID = 'erikchaulk'
    await secondTestGame.createGame();
    let response = await index.listGamesHttpResponse(userID);
    expect(response).toEqual(index.httpResponse({statusCode: 200, body: JSON.stringify(gameArray)}));
});

test("modifyGameHttpResponse", async () => {
    let testGame = new game.Game('erikchaulk', 'League of Legends', 2008, 'Moba', 'PC', 'Riot Games');
    let response = await index.modifyGameHttpResponse(testGame);
    expect(response).toEqual(index.httpResponse({statusCode: 200, body: JSON.stringify(testGame)}));
});

//Modify a game that doesn't exist
test("modifyGameHttpResponse", async () => {
    let testGame = new game.Game('erikchaulk', 'The Witness', 2016, 'Strategy', 'PC', 'Valve');
    let response = await index.modifyGameHttpResponse(testGame);
    expect(response).toEqual(index.httpResponse({statusCode: 400, body: "Game error, datastore response: Unable to modify game."}));
});

test("deleteGameHttpResponse", async () => {
    let testGame = new game.Game('erikchaulk', 'League of Legends', 2008, 'Moba', 'PC', 'Riot Games');
    let response = await index.deleteGameHttpResponse(testGame);
    expect(response).toEqual(index.httpResponse({statusCode: 200, body: JSON.stringify(testGame)}));
});

//Delete a game that doesn't exist
test("deleteGameHttpResponse", async () => {
    let testGame = new game.Game('erikchaulk', 'The Witness', 2016, 'Strategy', 'PC', 'Valve');
    let response = await index.deleteGameHttpResponse(testGame);
    expect(response).toEqual(index.httpResponse({statusCode: 400, body: "Game error, datastore response: Unable to delete game."}));
}); */ 
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZnVuY3Rpb25zLnRlc3QuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJmdW5jdGlvbnMudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEsTUFBTSxJQUFJLEdBQUcsT0FBTyxDQUFDLG1CQUFtQixDQUFDLENBQUM7QUFDMUMsTUFBTSxXQUFXLEdBQUcsT0FBTyxDQUFDLDBCQUEwQixDQUFDLENBQUM7QUFDeEQsTUFBTSxLQUFLLEdBQUcsT0FBTyxDQUFDLG9CQUFvQixDQUFDLENBQUM7QUFDNUMsTUFBTSxLQUFLLEdBQUcsT0FBTyxDQUFDLCtCQUErQixDQUFDLENBQUE7QUFDdEQ7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztNQXlHTSIsInNvdXJjZXNDb250ZW50IjpbImNvbnN0IGdhbWUgPSByZXF1aXJlKFwiLi4vZnVuY3Rpb25zL2dhbWVcIik7XHJcbmNvbnN0IGdhbWVNYW5hZ2VyID0gcmVxdWlyZShcIi4uL2Z1bmN0aW9ucy9nYW1lTWFuYWdlclwiKTtcclxuY29uc3QgaW5kZXggPSByZXF1aXJlKFwiLi4vZnVuY3Rpb25zL2luZGV4XCIpO1xyXG5jb25zdCBlcnJvciA9IHJlcXVpcmUoXCIuLi9mdW5jdGlvbnMvZ2FtZUVycm9ySGFuZGxlclwiKVxyXG4vKlxyXG50ZXN0KFwiQ3JlYXRlR2FtZVwiLCBhc3luYyAoKSA9PiB7XHJcbiAgICBsZXQgdGVzdEdhbWUgPSBuZXcgZ2FtZS5HYW1lKCdlcmlrY2hhdWxrJywgJ0xlYWd1ZSBvZiBMZWdlbmRzJywgMjAwOCwgJ01vYmEnLCAnUEMnLCAnUmlvdCBHYW1lcycpO1xyXG4gICAgbGV0IHJlc3BvbnNlID0gYXdhaXQgdGVzdEdhbWUuY3JlYXRlR2FtZSgpO1xyXG4gICAgZXhwZWN0KHJlc3BvbnNlKS50b0VxdWFsKHRlc3RHYW1lKTtcclxufSk7XHJcblxyXG50ZXN0KFwiR2V0R2FtZVwiLCBhc3luYyAoKSA9PiB7XHJcbiAgICBsZXQgdGVzdEdhbWUgPSBuZXcgZ2FtZS5HYW1lKCdlcmlrY2hhdWxrJywgJ0xlYWd1ZSBvZiBMZWdlbmRzJywgMjAwOCwgJ01vYmEnLCAnUEMnLCAnUmlvdCBHYW1lcycpO1xyXG4gICAgbGV0IHJlc3BvbnNlID0gYXdhaXQgZ2FtZU1hbmFnZXIuZ2V0R2FtZSh0ZXN0R2FtZSk7XHJcbiAgICBleHBlY3QocmVzcG9uc2UpLnRvRXF1YWwodGVzdEdhbWUpO1xyXG59KTtcclxuXHJcbnRlc3QoXCJDaGVlcmlvXCIsICgpID0+IHtcclxuICAgIGxldCB0ZXN0R2FtZSA9IG5ldyBnYW1lLkdhbWUoJ2VyaWtjaGF1bGsnLCAnT3ZlcndhdGNoJywgMjAxNiwgJ1N0cmF0ZWd5JywgJ1BDJywgJ0JsaXp6YXJkJyk7XHJcbiAgICBsZXQgcmVzcG9uc2UgPSB0ZXN0R2FtZS5nZXRQcmljZSgpO1xyXG4gICAgZXhwZWN0KHJlc3BvbnNlKS50b0VxdWFsKDUwKTtcclxufSk7XHJcblxyXG50ZXN0KFwiTW9kaWZ5R2FtZVwiLCBhc3luYyAoKSA9PiB7XHJcbiAgICBsZXQgdGVzdEdhbWUgPSBuZXcgZ2FtZS5HYW1lKCdlcmlrY2hhdWxrJywgJ0xlYWd1ZSBvZiBMZWdlbmRzJywgMjAxMCwgJ01vYmEnLCAnUEMnLCAnUmlvdCBHYW1lcycpO1xyXG4gICAgbGV0IHJlc3BvbnNlID0gYXdhaXQgZ2FtZU1hbmFnZXIubW9kaWZ5R2FtZSh0ZXN0R2FtZSk7XHJcbiAgICBleHBlY3QocmVzcG9uc2UpLnRvRXF1YWwodGVzdEdhbWUpO1xyXG59KTtcclxuXHJcbnRlc3QoXCJEZWxldGVHYW1lXCIsIGFzeW5jICgpID0+IHtcclxuICAgIGxldCB0ZXN0R2FtZSA9IG5ldyBnYW1lLkdhbWUoJ2VyaWtjaGF1bGsnLCAnTGVhZ3VlIG9mIExlZ2VuZHMnLCAyMDEwLCAnTW9iYScsICdQQycsICdSaW90IEdhbWVzJyk7XHJcbiAgICBsZXQgcmVzcG9uc2UgPSBhd2FpdCBnYW1lTWFuYWdlci5kZWxldGVHYW1lKHRlc3RHYW1lKTtcclxuICAgIGV4cGVjdChyZXNwb25zZSkudG9FcXVhbCh0ZXN0R2FtZSk7XHJcbn0pO1xyXG5cclxudGVzdChcInNlcmlhbGl6ZUR5bmFtb1Jlc3BvbnNlXCIsIGFzeW5jICgpID0+IHtcclxuICAgIGxldCBkeW5hbW9SZXNwb25zZSA9IHtcclxuICAgICAgICAndXNlcklEJzonZXJpa2NoYXVsaycsXHJcbiAgICAgICAgJ2dhbWVOYW1lJzonTGVhZ3VlIG9mIExlZ2VuZHMnLFxyXG4gICAgICAgICd5ZWFyUmVsZWFzZWQnOjIwMTAsXHJcbiAgICAgICAgJ2dlbnJlJzonTW9iYScsXHJcbiAgICAgICAgJ2NvbnNvbGUnOidQQycsXHJcbiAgICAgICAgJ2RldmVsb3Blcic6J1Jpb3QgR2FtZXMnXHJcbiAgICB9XHJcbiAgICBsZXQgcmVzcG9uc2UgPSBnYW1lTWFuYWdlci5zZXJpYWxpemVEeW5hbW9SZXNwb25zZShkeW5hbW9SZXNwb25zZSk7XHJcbiAgICBsZXQgdGVzdEdhbWUgPSBuZXcgZ2FtZS5HYW1lKCdlcmlrY2hhdWxrJywgJ0xlYWd1ZSBvZiBMZWdlbmRzJywgMjAxMCwgJ01vYmEnLCAnUEMnLCAnUmlvdCBHYW1lcycpO1xyXG4gICAgZXhwZWN0KHJlc3BvbnNlKS50b0VxdWFsKHRlc3RHYW1lKTtcclxufSk7XHJcblxyXG50ZXN0KFwiZ2FtZUVycm9ySGFuZGxlclwiLCBhc3luYyAoKSA9PiB7XHJcbiAgICBsZXQgdGVzdEVycm9yID0gbmV3IGVycm9yLkdhbWVFcnJvcignR2FtZSBub3QgZm91bmQnLCA0MDQpO1xyXG4gICAgZXhwZWN0KHRlc3RFcnJvci5tZXNzYWdlKS50b0VxdWFsKFwiR2FtZSBlcnJvciwgZGF0YXN0b3JlIHJlc3BvbnNlOiBHYW1lIG5vdCBmb3VuZFwiKTtcclxuICAgIGV4cGVjdCh0ZXN0RXJyb3Iuc3RhdHVzQ29kZSkudG9FcXVhbCg0MDQpOyAgICBcclxufSk7XHJcblxyXG50ZXN0KFwiY3JlYXRlR2FtZUh0dHBSZXNwb25zZVwiLCBhc3luYyAoKSA9PiB7XHJcbiAgICBsZXQgdGVzdEdhbWUgPSBuZXcgZ2FtZS5HYW1lKCdlcmlrY2hhdWxrJywgJ0xlYWd1ZSBvZiBMZWdlbmRzJywgMjAxMCwgJ01vYmEnLCAnUEMnLCAnUmlvdCBHYW1lcycpO1xyXG4gICAgbGV0IHJlc3BvbnNlID0gYXdhaXQgaW5kZXguY3JlYXRlR2FtZUh0dHBSZXNwb25zZSh0ZXN0R2FtZSk7XHJcbiAgICBleHBlY3QocmVzcG9uc2UpLnRvRXF1YWwoaW5kZXguaHR0cFJlc3BvbnNlKHtzdGF0dXNDb2RlOiAyMDAsIGJvZHk6IEpTT04uc3RyaW5naWZ5KHRlc3RHYW1lKX0pKTtcclxufSk7XHJcblxyXG4vL0dhbWUgYWxyZWFkeSBjcmVhdGVkXHJcbnRlc3QoXCJjcmVhdGVHYW1lSHR0cFJlc3BvbnNlXCIsIGFzeW5jICgpID0+IHtcclxuICAgIGxldCB0ZXN0R2FtZSA9IG5ldyBnYW1lLkdhbWUoJ2VyaWtjaGF1bGsnLCAnTGVhZ3VlIG9mIExlZ2VuZHMnLCAyMDEwLCAnTW9iYScsICdQQycsICdSaW90IEdhbWVzJyk7XHJcbiAgICBsZXQgcmVzcG9uc2UgPSBhd2FpdCBpbmRleC5jcmVhdGVHYW1lSHR0cFJlc3BvbnNlKHRlc3RHYW1lKTtcclxuICAgIGV4cGVjdChyZXNwb25zZSkudG9FcXVhbChpbmRleC5odHRwUmVzcG9uc2Uoe3N0YXR1c0NvZGU6IDQwMCwgYm9keTogXCJHYW1lIGVycm9yLCBkYXRhc3RvcmUgcmVzcG9uc2U6IFRoZSBjb25kaXRpb25hbCByZXF1ZXN0IGZhaWxlZFwifSkpO1xyXG59KTtcclxuXHJcbnRlc3QoXCJnZXRHYW1lSHR0cFJlc3BvbnNlXCIsIGFzeW5jICgpID0+IHtcclxuICAgIGxldCB0ZXN0R2FtZSA9IG5ldyBnYW1lLkdhbWUoJ2VyaWtjaGF1bGsnLCAnTGVhZ3VlIG9mIExlZ2VuZHMnLCAyMDEwLCAnTW9iYScsICdQQycsICdSaW90IEdhbWVzJyk7XHJcbiAgICBsZXQgcmVzcG9uc2UgPSBhd2FpdCBpbmRleC5nZXRHYW1lSHR0cFJlc3BvbnNlKHRlc3RHYW1lKTtcclxuICAgIGV4cGVjdChyZXNwb25zZSkudG9FcXVhbChpbmRleC5odHRwUmVzcG9uc2Uoe3N0YXR1c0NvZGU6IDIwMCwgYm9keTogSlNPTi5zdHJpbmdpZnkodGVzdEdhbWUpfSkpO1xyXG59KTtcclxuXHJcbnRlc3QoXCJsaXN0R2FtZXNIdHRwUmVzcG9uc2VcIiwgYXN5bmMgKCkgPT4ge1xyXG4gICAgbGV0IHRlc3RHYW1lID0gbmV3IGdhbWUuR2FtZSgnZXJpa2NoYXVsaycsICdMZWFndWUgb2YgTGVnZW5kcycsIDIwMTAsICdNb2JhJywgJ1BDJywgJ1Jpb3QgR2FtZXMnKTtcclxuICAgIGxldCBzZWNvbmRUZXN0R2FtZSA9IG5ldyBnYW1lLkdhbWUoJ2VyaWtjaGF1bGsnLCAnTWFnaWM6IFRoZSBHYXRoZXJpbmcnLCAyMDE5LCAnVHJhZGluZyBDYXJkIEdhbWUnLCAnUEMnLCAnV2l6YXJkcyBvZiB0aGUgQ29hc3QnKTtcclxuICAgIGxldCBnYW1lQXJyYXkgPSBbXTtcclxuICAgIGdhbWVBcnJheS5wdXNoKHRlc3RHYW1lLCBzZWNvbmRUZXN0R2FtZSk7XHJcbiAgICBsZXQgdXNlcklEID0gJ2VyaWtjaGF1bGsnXHJcbiAgICBhd2FpdCBzZWNvbmRUZXN0R2FtZS5jcmVhdGVHYW1lKCk7XHJcbiAgICBsZXQgcmVzcG9uc2UgPSBhd2FpdCBpbmRleC5saXN0R2FtZXNIdHRwUmVzcG9uc2UodXNlcklEKTtcclxuICAgIGV4cGVjdChyZXNwb25zZSkudG9FcXVhbChpbmRleC5odHRwUmVzcG9uc2Uoe3N0YXR1c0NvZGU6IDIwMCwgYm9keTogSlNPTi5zdHJpbmdpZnkoZ2FtZUFycmF5KX0pKTtcclxufSk7XHJcblxyXG50ZXN0KFwibW9kaWZ5R2FtZUh0dHBSZXNwb25zZVwiLCBhc3luYyAoKSA9PiB7XHJcbiAgICBsZXQgdGVzdEdhbWUgPSBuZXcgZ2FtZS5HYW1lKCdlcmlrY2hhdWxrJywgJ0xlYWd1ZSBvZiBMZWdlbmRzJywgMjAwOCwgJ01vYmEnLCAnUEMnLCAnUmlvdCBHYW1lcycpO1xyXG4gICAgbGV0IHJlc3BvbnNlID0gYXdhaXQgaW5kZXgubW9kaWZ5R2FtZUh0dHBSZXNwb25zZSh0ZXN0R2FtZSk7XHJcbiAgICBleHBlY3QocmVzcG9uc2UpLnRvRXF1YWwoaW5kZXguaHR0cFJlc3BvbnNlKHtzdGF0dXNDb2RlOiAyMDAsIGJvZHk6IEpTT04uc3RyaW5naWZ5KHRlc3RHYW1lKX0pKTtcclxufSk7XHJcblxyXG4vL01vZGlmeSBhIGdhbWUgdGhhdCBkb2Vzbid0IGV4aXN0XHJcbnRlc3QoXCJtb2RpZnlHYW1lSHR0cFJlc3BvbnNlXCIsIGFzeW5jICgpID0+IHtcclxuICAgIGxldCB0ZXN0R2FtZSA9IG5ldyBnYW1lLkdhbWUoJ2VyaWtjaGF1bGsnLCAnVGhlIFdpdG5lc3MnLCAyMDE2LCAnU3RyYXRlZ3knLCAnUEMnLCAnVmFsdmUnKTtcclxuICAgIGxldCByZXNwb25zZSA9IGF3YWl0IGluZGV4Lm1vZGlmeUdhbWVIdHRwUmVzcG9uc2UodGVzdEdhbWUpO1xyXG4gICAgZXhwZWN0KHJlc3BvbnNlKS50b0VxdWFsKGluZGV4Lmh0dHBSZXNwb25zZSh7c3RhdHVzQ29kZTogNDAwLCBib2R5OiBcIkdhbWUgZXJyb3IsIGRhdGFzdG9yZSByZXNwb25zZTogVW5hYmxlIHRvIG1vZGlmeSBnYW1lLlwifSkpO1xyXG59KTtcclxuXHJcbnRlc3QoXCJkZWxldGVHYW1lSHR0cFJlc3BvbnNlXCIsIGFzeW5jICgpID0+IHtcclxuICAgIGxldCB0ZXN0R2FtZSA9IG5ldyBnYW1lLkdhbWUoJ2VyaWtjaGF1bGsnLCAnTGVhZ3VlIG9mIExlZ2VuZHMnLCAyMDA4LCAnTW9iYScsICdQQycsICdSaW90IEdhbWVzJyk7XHJcbiAgICBsZXQgcmVzcG9uc2UgPSBhd2FpdCBpbmRleC5kZWxldGVHYW1lSHR0cFJlc3BvbnNlKHRlc3RHYW1lKTtcclxuICAgIGV4cGVjdChyZXNwb25zZSkudG9FcXVhbChpbmRleC5odHRwUmVzcG9uc2Uoe3N0YXR1c0NvZGU6IDIwMCwgYm9keTogSlNPTi5zdHJpbmdpZnkodGVzdEdhbWUpfSkpO1xyXG59KTtcclxuXHJcbi8vRGVsZXRlIGEgZ2FtZSB0aGF0IGRvZXNuJ3QgZXhpc3RcclxudGVzdChcImRlbGV0ZUdhbWVIdHRwUmVzcG9uc2VcIiwgYXN5bmMgKCkgPT4ge1xyXG4gICAgbGV0IHRlc3RHYW1lID0gbmV3IGdhbWUuR2FtZSgnZXJpa2NoYXVsaycsICdUaGUgV2l0bmVzcycsIDIwMTYsICdTdHJhdGVneScsICdQQycsICdWYWx2ZScpO1xyXG4gICAgbGV0IHJlc3BvbnNlID0gYXdhaXQgaW5kZXguZGVsZXRlR2FtZUh0dHBSZXNwb25zZSh0ZXN0R2FtZSk7XHJcbiAgICBleHBlY3QocmVzcG9uc2UpLnRvRXF1YWwoaW5kZXguaHR0cFJlc3BvbnNlKHtzdGF0dXNDb2RlOiA0MDAsIGJvZHk6IFwiR2FtZSBlcnJvciwgZGF0YXN0b3JlIHJlc3BvbnNlOiBVbmFibGUgdG8gZGVsZXRlIGdhbWUuXCJ9KSk7XHJcbn0pOyAqLyJdfQ==