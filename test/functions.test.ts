const game = require("../functions/models/game");
const gameManager = require("../functions/dataManager/gameManager");
const index = require("../functions/index");
const error = require("../functions/error/gameErrorHandler")
const common = require("../functions/shared/common/game");

test("CreateGame", async () => {
    let partitionKey = '[User]#[${erikchaulk}]'
    let sortKey = '[GameItem]#[League of Legends]'
    let testCreateGame = new game.Game(partitionKey, sortKey, 'League of Legends', 2008, 'Moba', 'PC', 'Riot Games');
    let response = await gameManager.createGame(testCreateGame);
    expect(response).toEqual(testCreateGame);
});

test("GetGame", async () => {
    let partitionKey = '[User]#[${erikchaulk}]'
    let sortKey = '[GameItem]#[League of Legends]'
    let testGetGame = new game.Game(partitionKey, sortKey, 'League of Legends', 2008, 'Moba', 'PC', 'Riot Games');
    let response = await gameManager.getGame(testGetGame);
    expect(response).toEqual(testGetGame);
});

test("ModifyGame", async () => {
    let partitionKey = '[User]#[${erikchaulk}]'
    let sortKey = '[GameItem]#[League of Legends]'
    let testModifyGame = new game.Game(partitionKey, sortKey, 'League of Legends', 2010, 'Moba', 'PC', 'Riot Games');
    let response = await gameManager.modifyGame(testModifyGame);
    expect(response).toEqual(testModifyGame);
});

test("DeleteGame", async () => {
    let partitionKey = '[User]#[${erikchaulk}]'
    let sortKey = '[GameItem]#[League of Legends]'
    let testDeleteGame = new game.Game(partitionKey, sortKey, 'League of Legends', 2010, 'Moba', 'PC', 'Riot Games');
    let response = await gameManager.deleteGame(testDeleteGame);
    expect(response).toEqual(testDeleteGame);
});

test("serializeDynamoResponse", async () => {
    let partitionKey = '[User]#[${erikchaulk}]'
    let sortKey = '[GameItem]#[League of Legends]'
    let dynamoResponse = {
        'partitionKey':partitionKey,
        'sortKey': sortKey,
        'gameName':'League of Legends',
        'yearReleased':2010,
        'genre':'Moba',
        'console':'PC',
        'developer':'Riot Games'
    }
    let response = common.serializeDynamoResponse(dynamoResponse);
    let testDynamoResponse = new game.Game(partitionKey, sortKey, 'League of Legends', 2010, 'Moba', 'PC', 'Riot Games');
    expect(response).toEqual(testDynamoResponse);
});

test("gameErrorHandler", async () => {
    let testError = new error.GameError('Game not found', 404);
    expect(testError.message).toEqual("Game error, datastore response: Game not found");
    expect(testError.statusCode).toEqual(404);    
});

test("createGameHttpResponse", async () => {
    let partitionKey = '[User]#[${erikchaulk}]'
    let sortKey = '[GameItem]#[League of Legends]'
    let testGame = new game.Game(partitionKey, sortKey, 'League of Legends', 2010, 'Moba', 'PC', 'Riot Games');
    let response = await index.createGameHttpResponse(testGame);
    expect(response).toEqual(index.httpResponse({statusCode: 200, body: JSON.stringify(testGame)}));
});

//Game already created
test("createGameHttpResponse", async () => {
    let partitionKey = '[User]#[${erikchaulk}]'
    let sortKey = '[GameItem]#[League of Legends]'
    let testGame = new game.Game(partitionKey, sortKey, 'League of Legends', 2010, 'Moba', 'PC', 'Riot Games');
    let response = await index.createGameHttpResponse(testGame);
    expect(response).toEqual(index.httpResponse({statusCode: 400, body: "Game error, datastore response: The conditional request failed"}));
});

test("getGameHttpResponse", async () => {
    let partitionKey = '[User]#[${erikchaulk}]'
    let sortKey = '[GameItem]#[League of Legends]'
    let testGame = new game.Game(partitionKey, sortKey, 'League of Legends', 2010, 'Moba', 'PC', 'Riot Games');
    let response = await index.getGameHttpResponse(testGame);
    expect(response).toEqual(index.httpResponse({statusCode: 200, body: JSON.stringify(testGame)}));
});

test("modifyGameHttpResponse", async () => {
    let partitionKey = '[User]#[${erikchaulk}]';
    let sortKey = '[GameItem]#[League of Legends]';
    let testGame = new game.Game(partitionKey, sortKey, 'League of Legends', 2012, 'Moba', 'PC', 'Riot Games');
    let response = await index.modifyGameHttpResponse(testGame);
    expect(response).toEqual(index.httpResponse({statusCode: 200, body: JSON.stringify(testGame)}));
});

//Modify a game that doesn't exist
test("modifyGameHttpResponse", async () => {
    let partitionKey = '[User]#[${erikchaulk}]';
    let sortKey = '[GameItem]#[The Witness]';
    let testGame = new game.Game(partitionKey, sortKey, 'The Witness', 2016, 'Strategy', 'PC', 'Valve');
    let response = await index.modifyGameHttpResponse(testGame);
    expect(response).toEqual(index.httpResponse({statusCode: 400, body: "Game error, datastore response: Unable to modify game."}));
});

test("deleteGameHttpResponse", async () => {
    let partitionKey = '[User]#[${erikchaulk}]';
    let sortKey = '[GameItem]#[League of Legends]';
    let testGame = new game.Game(partitionKey, sortKey, 'League of Legends', 2012, 'Moba', 'PC', 'Riot Games');
    let response = await index.deleteGameHttpResponse(testGame);
    expect(response).toEqual(index.httpResponse({statusCode: 200, body: JSON.stringify(testGame)}));
});

//Delete a game that doesn't exist
test("deleteGameHttpResponse", async () => {
    let partitionKey = '[User]#[${erikchaulk}]';
    let sortKey = '[GameItem]#[The Witness]';
    let testGame = new game.Game(partitionKey, sortKey, 'The Witness', 2016, 'Strategy', 'PC', 'Valve');
    let response = await index.deleteGameHttpResponse(testGame);
    expect(response).toEqual(index.httpResponse({statusCode: 400, body: "Game error, datastore response: Unable to delete game."}));
});

