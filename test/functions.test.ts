const game = require("../functions/game");
const index = require("../functions/index");

test("CreateGame - Success", async () => {
    let data = new game.Game('League of Legends', '2008', 'Moba', 'PC', 'Riot Games');
    let response = await data.CreateGame();
    expect(response).toEqual({
        Item: {
            gameName: 'League of Legends',
            yearReleased: '2008', 
            genre: 'Moba', 
            console: 'PC', 
            developer: 'Riot Games'
        }
    })
});

test("GetGame", async () => {
    let data = new game.Game("League of Legends");
    let response = await game.GetGame(data);
    expect(response).toEqual({
        Item: {
            gameName: "League of Legends",
            yearReleased: '2008', 
            genre: 'Moba', 
            console: 'PC', 
            developer: 'Riot Games'
        }
    })
});

test("ListGames", async () => {
    let response = await game.ListGames();
    expect(response).toEqual({
        Items: [{
            genre: 'Moba', 
            console: 'PC', 
            developer: 'Riot Games',
            gameName: 'League of Legends',
            yearReleased: '2008', 
        }],
        Count: 1,
        ScannedCount: 1
    })
});

test("ModifyGame", async () => {
    let data = new game.Game('League of Legends', '2008', 'Moba', 'PC', 'Riot Games');
    let response = await data.CreateGame();
    
    data = index.DeserializeGameData({ gameName: 'League of Legends', yearReleased: '2021', genre: 'Strategy' })
    response = await game.ModifyGame(data);
    
    expect(response).toEqual({
        Attributes: {
            gameName: 'League of Legends',
            yearReleased: '2021', 
            genre: 'Strategy', 
            console: 'PC', 
            developer: 'Riot Games'
        }
    })
});

test("DeleteGame", async () => {
    let data = new game.Game("League of Legends");
    let response = await game.DeleteGame(data);
    expect(response).toEqual({
        Attributes: {
            gameName: "League of Legends",
            yearReleased: '2021', 
            genre: 'Strategy', 
            console: 'PC', 
            developer: 'Riot Games'
        }
    })
});

test("GetGameHttpResponse - 200", async () => {
    let data = new game.Game('League of Legends', '2008', 'Moba', 'PC', 'Riot Games');
    let response = await data.CreateGame();

    data = index.DeserializeGameData({ gameName: 'League of Legends' })
    response = await index.GetGameHttpResponse(data);
    
    expect(response).toEqual({
        statusCode: 200,
        body: JSON.stringify({
            Item: {
                genre: 'Moba', 
                console: 'PC', 
                developer: 'Riot Games',
                gameName: 'League of Legends',
                yearReleased: '2008', 
            }
        }),
        headers: {
          'Access-Control-Allow-Origin': '*'
        }
    })
});

test("GetGameHttpResponse - 404 - Game doesn't exist", async () => {
    let data = index.DeserializeGameData({ gameName: 'The Witness' })
    let response = await index.GetGameHttpResponse(data);
    
    expect(response).toEqual({
        statusCode: 404,
        body: "Unable to get game.",
        headers: {
          'Access-Control-Allow-Origin': '*'
        }
    })
});

test("CreateGameHttpResponse - 201 - Success", async () => {
    let data = new game.Game('Portal 2', '2010', 'Puzzle', 'PC', 'Valve');
    let response = await index.CreateGameHttpResponse(data);
    expect(response).toEqual({
        statusCode: 201,
        body: JSON.stringify({
            Item: {
                genre: 'Puzzle', 
                console: 'PC', 
                developer: 'Valve',
                gameName: 'Portal 2',
                yearReleased: '2010', 
            }
        }),
        headers: {
          'Access-Control-Allow-Origin': '*'
        }
    })
});

test("CreateGameHttpResponse - 400 - Game already exists", async () => {
    let data = new game.Game('Portal 2', '2010', 'Puzzle', 'PC', 'Valve');
    let response = await index.CreateGameHttpResponse(data);
    expect(response).toEqual({
        statusCode: 400,
        body: "Error with the provided condition.",
        headers: {
          'Access-Control-Allow-Origin': '*'
        }
    })
});

test("ListGamesHttpResponse - 200 - Success", async () => {
    let response = await index.ListGamesHttpResponse();
    expect(response).toEqual({
        statusCode: 200,
        body: JSON.stringify({
            Items: [{
                genre: 'Puzzle', 
                console: 'PC', 
                developer: 'Valve',
                gameName: 'Portal 2',
                yearReleased: '2010', 
            },
            {
                genre: 'Moba', 
                console: 'PC', 
                developer: 'Riot Games',
                gameName: 'League of Legends',
                yearReleased: '2008', 
            }],
            Count: 2,
            ScannedCount: 2
        }),
        headers: {
          'Access-Control-Allow-Origin': '*'
        }
    })
});

test("ModifyGameHttpResponse - 200 - Success", async () => {
    let data = new game.Game('Portal 2', '2015', 'First Person Shooter', 'PC', 'Valve');
    let response = await index.ModifyGameHttpResponse(data);
    expect(response).toEqual({
        statusCode: 200,
        body: JSON.stringify(
            {
                genre: 'First Person Shooter', 
                console: 'PC', 
                developer: 'Valve',
                gameName: 'Portal 2',
                yearReleased: '2015', 
            }
        ),
        headers: {
          'Access-Control-Allow-Origin': '*'
        }
    })
});

test("ModifyGameHttpResponse - 400 - Game doesn't exist", async () => {
    let data = new game.Game('Portal 3', '2015', 'First Person Shooter', 'PC', 'Valve');
    let response = await index.ModifyGameHttpResponse(data);
    expect(response).toEqual({
        statusCode: 400,
        body: "Error with the provided condition.",
        headers: {
          'Access-Control-Allow-Origin': '*'
        }
    })
});

test("DeleteGameHttpResponse - 200 - Success", async () => {
    let data = new game.Game('Portal 2');
    let response = await index.DeleteGameHttpResponse(data);
    expect(response).toEqual({
        statusCode: 200,
        body: JSON.stringify({
            Attributes: {
                genre: 'First Person Shooter', 
                console: 'PC', 
                developer: 'Valve',
                gameName: 'Portal 2',
                yearReleased: "2015", 
            }
        }),
        headers: {
          'Access-Control-Allow-Origin': '*'
        }
    })
});

test("DeleteGameHttpResponse - 400 - Game not found", async () => {
    let data = new game.Game('Portal 2');
    let response = await index.DeleteGameHttpResponse(data);
    expect(response).toEqual({
        statusCode: 404,
        body: "Unable to delete game.",
        headers: {
          'Access-Control-Allow-Origin': '*'
        }
    })
});

test("ParseDynamoError - ConditionalCheckFailedException", () => {
    let error = "ConditionalCheckFailedException"
    expect(index.ParseDynamoError(error)).toEqual(
        index.HttpResponse({statusCode: 400, body: "Error with the provided condition."})
    );
});

test("ParseDynamoError - Unhandled dynamoDB error", () => {
    let error = "AccessDeniedException"
    expect(index.ParseDynamoError(error)).toEqual(
        index.HttpResponse({statusCode: 400, body: "Invalid operation."})
    );
});