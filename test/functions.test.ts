const game = require("../functions/game");
const gameManager = require("../functions/gameManager");
const index = require("../functions/index");
const error = require("../functions/gameErrorHandler")

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
    expect(response).toEqual(index.httpResponse({statusCode: 400, body: "Game error, datastore response: The conditional request failed"}));
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
    expect(response).toEqual(index.httpResponse({statusCode: 400, body: "Game error, datastore response: The conditional request failed"}));
});