const game = require("../functions/models/game");
const gameManager = require("../functions/dataManager/gameManager");
const httpResponse = require("../functions/shared/common/httpResponse");
const error = require("../functions/error/gameErrorHandler")
const common = require("../functions/shared/common/game");

test("CreateGame", async () => {
    let gameID = '123456';
    let userID = 'erikchaulk';
    let defaultCollectionID = `Col-${userID}-Default`;
    let priceMonitorData = [] as any;
    let testCreateGame = new game.Game(gameID, userID, 'League of Legends', 2008, 'Moba', 'PC', 'Riot Games', 'https://www.testcoverimageurl.com', defaultCollectionID, priceMonitorData);
    let response = await gameManager.createGame(testCreateGame);
    expect(response).toEqual(testCreateGame);
});

test("GetGame", async () => {
    let gameID = '123456';
    let userID = 'erikchaulk';
    let defaultCollectionID = `Col-${userID}-Default`;
    let priceMonitorData = [] as any;
    let testGetGame = new game.Game(gameID, userID, 'League of Legends', 2008, 'Moba', 'PC', 'Riot Games', 'https://www.testcoverimageurl.com', defaultCollectionID, priceMonitorData);
    let response = await gameManager.getGame(testGetGame);
    expect(response).toEqual(testGetGame);
});

test("ModifyGame", async () => {
    let gameID = '123456';
    let userID = 'erikchaulk';
    let defaultCollectionID = `Col-${userID}-Default`;
    let priceMonitorData = [] as any;
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
        'gameID':'123456',
        'gameName':'League of Legends',
        'yearReleased':2010,
        'genre':'Moba',
        'console':'PC',
        'developer':'Riot Games',
        'cover': 'https://www.testcoverimageurl.com'
    } 
    let userData = {
        userID: 'erikchaulk',
    }
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
    let priceMonitorData = [] as any;
    let testGame = new game.Game(gameID, userID, 'League of Legends', 2010, 'Moba', 'PC', 'Riot Games', 'https://www.testcoverimageurl.com', defaultCollectionID, priceMonitorData);
    let response = await httpResponse.createGameHttpResponse(testGame);
    expect(response).toEqual(httpResponse.httpResponse({statusCode: 200, body: JSON.stringify(testGame)}));
});

//Game already created
test("createGameHttpResponse", async () => {
    let gameID = '123456';
    let userID = 'erikchaulk';
    let defaultCollectionID = `Col-${userID}-Default`;
    let priceMonitorData = [] as any;
    let testGame = new game.Game(gameID, userID, 'League of Legends', 2010, 'Moba', 'PC', 'Riot Games', 'https://www.testcoverimageurl.com', defaultCollectionID, priceMonitorData);
    let response = await httpResponse.createGameHttpResponse(testGame);
    expect(response).toEqual(httpResponse.httpResponse({statusCode: 400, body: "Game Error"}));
});

test("getGameHttpResponse", async () => {
    let gameID = '123456';
    let userID = 'erikchaulk';
    let defaultCollectionID = `Col-${userID}-Default`;
    let priceMonitorData = [] as any;
    let testGame = new game.Game(gameID, userID, 'League of Legends', 2010, 'Moba', 'PC', 'Riot Games', 'https://www.testcoverimageurl.com', defaultCollectionID, priceMonitorData);
    let response = await httpResponse.getGameHttpResponse(testGame);
    expect(response).toEqual(httpResponse.httpResponse({statusCode: 200, body: JSON.stringify(testGame)}));
});

test("modifyGameHttpResponse", async () => {
    let gameID = '123456';
    let userID = 'erikchaulk';
    let defaultCollectionID = `Col-${userID}-Default`;
    let priceMonitorData = [] as any;
    let testGame = new game.Game(gameID, userID, 'League of Legends', 2012, 'Moba', 'PC', 'Riot Games', 'https://www.testcoverimageurl.com', defaultCollectionID, priceMonitorData);
    let response = await httpResponse.modifyGameHttpResponse(testGame);
    expect(response).toEqual(httpResponse.httpResponse({statusCode: 200, body: JSON.stringify(testGame)}));
});

//Modify a game that doesn't exist
test("modifyGameHttpResponse", async () => {
    let gameID = '234567';
    let userID = 'erikchaulk';
    let testGame = new game.Game(gameID, userID, 'The Witness', 2016, 'Strategy', 'PC', 'Valve', 'https://www.testcoverimageurl.com');
    let response = await httpResponse.modifyGameHttpResponse(testGame);
    expect(response).toEqual(httpResponse.httpResponse({statusCode: 400, body: "Game Error"}));
});

test("deleteGameHttpResponse", async () => {
    let gameID = '123456';
    let userID = 'erikchaulk';
    let defaultCollectionID = `Col-${userID}-Default`;
    let testGame = new game.Game(gameID, userID, 'League of Legends', 2012, 'Moba', 'PC', 'Riot Games', 'https://www.testcoverimageurl.com', defaultCollectionID);
    let response = await httpResponse.deleteGameHttpResponse(testGame);
    expect(response).toEqual(httpResponse.httpResponse({statusCode: 200, body: JSON.stringify(testGame)}));
});

//Delete a game that doesn't exist
test("deleteGameHttpResponse", async () => {
    let gameID = '123456';
    let userID = 'erikchaulk';
    let testGame = new game.Game(gameID, userID, 'League of Legends', 2012, 'Moba', 'PC', 'Riot Games', 'https://www.testcoverimageurl.com');
    let response = await httpResponse.deleteGameHttpResponse(testGame);
    expect(response).toEqual(httpResponse.httpResponse({statusCode: 400, body: "Game Error"}));
});