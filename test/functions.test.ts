const game = require("../functions/models/game");
const gameManager = require("../functions/dataManager/gameManager");
const httpResponse = require("../functions/shared/common/httpResponse");
const error = require("../functions/error/gameErrorHandler")
const common = require("../functions/shared/common/game");

test("CreateGame", async () => {
    let gameID = '123456';
    let userID = 'erikchaulk';
    let email = 'erikchaulk@gmail.com';
    let itemType = '[GameItem]';
    let testCreateGame = new game.Game(gameID, userID, email, 'League of Legends', itemType, undefined, 2008, 'Moba', 'PC', 'Riot Games');
    let response = await gameManager.createGame(testCreateGame);
    expect(response).toEqual(testCreateGame);
});

test("GetGame", async () => {
    let gameID = '123456';
    let userID = 'erikchaulk';
    let email = 'erikchaulk@gmail.com';
    let itemType = '[GameItem]';
    let testGetGame = new game.Game(gameID, userID, email, 'League of Legends', itemType, undefined, 2008, 'Moba', 'PC', 'Riot Games');
    let response = await gameManager.getGame(testGetGame);
    expect(response).toEqual(testGetGame);
});

test("ModifyGame", async () => {
    let gameID = '123456';
    let userID = 'erikchaulk';
    let email = 'erikchaulk@gmail.com';
    let itemType = '[GameItem]';
    let testModifyGame = new game.Game(gameID, userID, email, 'League of Legends', itemType, undefined, 2010, 'Moba', 'PC', 'Riot Games');
    let response = await gameManager.modifyGame(testModifyGame);
    expect(response).toEqual(testModifyGame);
});

test("DeleteGame", async () => {
    let gameID = '123456';
    let userID = 'erikchaulk';
    let email = 'erikchaulk@gmail.com';
    let itemType = '[GameItem]';
    let testDeleteGame = new game.Game(gameID, userID, email, 'League of Legends', itemType, undefined, 2010, 'Moba', 'PC', 'Riot Games');
    let response = await gameManager.deleteGame(testDeleteGame);
    expect(response).toEqual(testDeleteGame);
});

test("serializeExistingGameData", async () => {
    let data = {
        'id':'123456',
        'gameName':'League of Legends',
        'yearReleased':2010,
        'genre':'Moba',
        'console':'PC',
        'developer':'Riot Games'
    } 
    let userData = {
        userID: 'erikchaulk',
        email: 'erikchaulk@gmail.com'
    }
    let response = common.serializeExistingGameData(userData, data);
    let testDynamoResponse = new game.Game(data.id, userData.userID, userData.email, 'League of Legends', undefined, undefined, 2010, 'Moba', 'PC', 'Riot Games');
    expect(response).toEqual(testDynamoResponse);
});

test("gameErrorHandler", async () => {
    let testError = new error.GameError('Game not found');
    expect(testError.message).toEqual("Game error, datastore response: Game not found");
});

test("createGameHttpResponse", async () => {
    let gameID = '123456';
    let userID = 'erikchaulk';
    let email = 'erikchaulk@gmail.com';
    let itemType = '[GameItem]';
    let testGame = new game.Game(gameID, userID, email, 'League of Legends', itemType, undefined, 2010, 'Moba', 'PC', 'Riot Games');
    let response = await httpResponse.createGameHttpResponse(testGame);
    expect(response).toEqual(httpResponse.httpResponse({statusCode: 200, body: JSON.stringify(testGame)}));
});

//Game already created
test("createGameHttpResponse", async () => {
    let gameID = '123456';
    let userID = 'erikchaulk';
    let email = 'erikchaulk@gmail.com';
    let itemType = '[GameItem]';
    let testGame = new game.Game(gameID, userID, email, 'League of Legends', itemType, undefined, 2010, 'Moba', 'PC', 'Riot Games');
    let response = await httpResponse.createGameHttpResponse(testGame);
    expect(response).toEqual(httpResponse.httpResponse({statusCode: 400, body: "Game Error"}));
});

test("getGameHttpResponse", async () => {
    let gameID = '123456';
    let userID = 'erikchaulk';
    let email = 'erikchaulk@gmail.com';
    let itemType = '[GameItem]';
    let testGame = new game.Game(gameID, userID, email, 'League of Legends', itemType, undefined, 2010, 'Moba', 'PC', 'Riot Games');
    let response = await httpResponse.getGameHttpResponse(testGame);
    expect(response).toEqual(httpResponse.httpResponse({statusCode: 200, body: JSON.stringify(testGame)}));
});

test("modifyGameHttpResponse", async () => {
    let gameID = '123456';
    let userID = 'erikchaulk';
    let email = 'erikchaulk@gmail.com';
    let itemType = '[GameItem]';
    let testGame = new game.Game(gameID, userID, email, 'League of Legends', itemType, undefined, 2012, 'Moba', 'PC', 'Riot Games');
    let response = await httpResponse.modifyGameHttpResponse(testGame);
    expect(response).toEqual(httpResponse.httpResponse({statusCode: 200, body: JSON.stringify(testGame)}));
});

//Modify a game that doesn't exist
test("modifyGameHttpResponse", async () => {
    let gameID = '234567';
    let userID = 'erikchaulk';
    let email = 'erikchaulk@gmail.com';
    let itemType = '[GameItem]';
    let testGame = new game.Game(gameID, userID, email, 'The Witness', itemType, 2016, 'Strategy', 'PC', 'Valve');
    let response = await httpResponse.modifyGameHttpResponse(testGame);
    expect(response).toEqual(httpResponse.httpResponse({statusCode: 400, body: "Game Error"}));
});

test("deleteGameHttpResponse", async () => {
    let gameID = '123456';
    let userID = 'erikchaulk';
    let email = 'erikchaulk@gmail.com';
    let itemType = '[GameItem]';
    let testGame = new game.Game(gameID, userID, email, 'League of Legends', itemType, undefined, 2012, 'Moba', 'PC', 'Riot Games');
    let response = await httpResponse.deleteGameHttpResponse(testGame);
    expect(response).toEqual(httpResponse.httpResponse({statusCode: 200, body: JSON.stringify(testGame)}));
});

//Delete a game that doesn't exist
test("deleteGameHttpResponse", async () => {
    let gameID = '123456';
    let userID = 'erikchaulk';
    let email = 'erikchaulk@gmail.com';
    let itemType = '[GameItem]';
    let testGame = new game.Game(gameID, userID, email, 'League of Legends', itemType, undefined, 2012, 'Moba', 'PC', 'Riot Games');
    let response = await httpResponse.deleteGameHttpResponse(testGame);
    expect(response).toEqual(httpResponse.httpResponse({statusCode: 400, body: "Game Error"}));
});