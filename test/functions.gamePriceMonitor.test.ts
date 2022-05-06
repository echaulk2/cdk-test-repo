const gamePriceMonitorTest = require("../functions/models/gamePriceMonitor");
const gamePriceMonitorManagerTest = require("../functions/dataManager/gamePriceMonitor");
const gamePriceMonitorWishlistTest = require("../functions/models/wishlist");
const gamePriceMonitorGameTest = require("../functions/models/game");
const gamePriceMonitorCollectionTest = require("../functions/dataManager/collectionManager");
const gamePriceMonitorError = require("../functions/error/gamePriceMonitorErrorHandler");

test("createGamePriceMonitor", async () => {
    let collectionItemData = {
        gameID: "565656",
        collectionID: "1",
        userID: "testUser123",
        gameName: 'God of War',
        yearReleased: 2017,
        genre: 'Action-Adventure',
        console: 'Playstation',
        developer: 'Santa Monica Studio',
    }
    let priceMonitorData = {
        id: "1234",
        gameID: "565656",
        collectionID: "1",
        userID: "testUser123",
        desiredCondition: "new",
        desiredPrice: 50
    };
    let testGame = new gamePriceMonitorGameTest.Game(collectionItemData.gameID, collectionItemData.userID, collectionItemData.gameName, collectionItemData.yearReleased, collectionItemData.genre, collectionItemData.console, collectionItemData.developer, collectionItemData.collectionID);
    await gamePriceMonitorCollectionTest.addGameToCollection(testGame);
    let priceMonitor = new gamePriceMonitorTest.GamePriceMonitor(priceMonitorData.id, priceMonitorData.userID, priceMonitorData.collectionID, priceMonitorData.gameID, priceMonitorData.desiredCondition, priceMonitorData.desiredPrice);
    let response = await gamePriceMonitorManagerTest.createGamePriceMonitor(priceMonitor);
    expect(response).toEqual(priceMonitor);
});

//Attempt to create a price monitor that already exists
test("createGamePriceMonitor", async () => {
    let collectionItemData = {
        gameID: "565656",
        collectionID: "1",
        userID: "testUser123",
        gameName: 'God of War',
        yearReleased: 2017,
        genre: 'Action-Adventure',
        console: 'Playstation',
        developer: 'Santa Monica Studio',
    }
    let priceMonitorData = {
        id: "1234",
        collectionID: "1",
        userID: "testUser123",
        desiredCondition: "new",
        desiredPrice: 50
    };
    let priceMonitor = new gamePriceMonitorTest.GamePriceMonitor(priceMonitorData.id, priceMonitorData.userID, priceMonitorData.collectionID, collectionItemData.gameID, priceMonitorData.desiredCondition, priceMonitorData.desiredPrice);
    await expect(gamePriceMonitorManagerTest.createGamePriceMonitor(priceMonitor))
    .rejects
    .toThrow("Game price monitor error: Unable to create Game Price Monitor.  Conditional Check Failed.")
});

test("getGamePriceMonitor", async () => {
    let priceMonitorData = {
        id: "1234",
        gameID: "565656",
        collectionID: "1",
        userID: "testUser123",
        desiredCondition: "new",
        desiredPrice: 50
    };
    let priceMonitor = new gamePriceMonitorTest.GamePriceMonitor(priceMonitorData.id, priceMonitorData.userID, priceMonitorData.collectionID, priceMonitorData.gameID, priceMonitorData.desiredCondition, priceMonitorData.desiredPrice);
    let response = await gamePriceMonitorManagerTest.getGamePriceMonitor(priceMonitor);
    expect(response).toEqual(priceMonitor);
});

test("getGamePriceMonitor", async () => {
    let unknownPriceMonitor = {
        id: "4321",
        gameID: "565656",
        collectionID: "1",
        userID: "testUser123",
        desiredCondition: "loose",
        desiredPrice: 35
    };
    let priceMonitor = new gamePriceMonitorTest.GamePriceMonitor(unknownPriceMonitor.id, unknownPriceMonitor.userID, unknownPriceMonitor.collectionID, unknownPriceMonitor.gameID, unknownPriceMonitor.desiredCondition, unknownPriceMonitor.desiredPrice);
    await expect(gamePriceMonitorManagerTest.getGamePriceMonitor(priceMonitor))
    .rejects
    .toThrow("Game price monitor error: Unable to get game price monitor. Game price monitor not found.");
});

test("getAllPriceMonitorsForGame", async () => {
    let gameID = "565656"
    let firstPriceMonitorData = {
        id: "1234",
        gameID: "565656",
        collectionID: "1",
        userID: "testUser123",
        desiredCondition: "new",
        desiredPrice: 50
    };
    let secondPriceMonitorData = {
        id: "4321",
        gameID: "565656",
        collectionID: "1",
        userID: "testUser123",
        desiredCondition: "loose",
        desiredPrice: 35
    };
    let firstMonitor = new gamePriceMonitorTest.GamePriceMonitor(firstPriceMonitorData.id, firstPriceMonitorData.userID, firstPriceMonitorData.collectionID, firstPriceMonitorData.gameID, firstPriceMonitorData.desiredCondition, firstPriceMonitorData.desiredPrice);
    let secondMonitor = new gamePriceMonitorTest.GamePriceMonitor(secondPriceMonitorData.id, secondPriceMonitorData.userID, secondPriceMonitorData.collectionID, secondPriceMonitorData.gameID, secondPriceMonitorData.desiredCondition, secondPriceMonitorData.desiredPrice);
    let testGame = new gamePriceMonitorGameTest.Game(gameID, firstMonitor.userID);
    testGame.collectionID = firstMonitor.collectionID;
    await gamePriceMonitorManagerTest.createGamePriceMonitor(secondMonitor);
    let priceMonitors = [firstMonitor, secondMonitor];
    let response = await gamePriceMonitorManagerTest.getAllPriceMonitorsForGame(testGame);
    expect(response).toEqual(priceMonitors);
});

test("modifyGamePriceMonitor", async () => {
    let priceMonitorData = {
        id: "1234",
        gameID: "565656",
        collectionID: "1",
        userID: "testUser123",
        desiredCondition: "new",
        desiredPrice: 55
    };
    let priceMonitor = new gamePriceMonitorTest.GamePriceMonitor(priceMonitorData.id, priceMonitorData.userID, priceMonitorData.collectionID, priceMonitorData.gameID, priceMonitorData.desiredCondition, priceMonitorData.desiredPrice);
    let response = await gamePriceMonitorManagerTest.modifyGamePriceMonitor(priceMonitor);
    expect(response).toEqual(priceMonitor);
});

//Attempt to modify a price monitor that doesn't exist
test("modifyGamePriceMonitor", async () => {
    let priceMonitorData = {
        id: "abc123",
        gameID: "565656",
        collectionID: "1",
        userID: "testUser123",
        desiredCondition: "new",
        desiredPrice: 55
    };
    let priceMonitor = new gamePriceMonitorTest.GamePriceMonitor(priceMonitorData.id, priceMonitorData.userID, priceMonitorData.collectionID, priceMonitorData.gameID, priceMonitorData.desiredCondition, priceMonitorData.desiredPrice);
    await expect(gamePriceMonitorManagerTest.modifyGamePriceMonitor(priceMonitor))
    .rejects
    .toThrow("Game price monitor error: Unable to modify Game Price Monitor.  Conditional Check Failed.")
});

test("deleteGamePriceMonitor", async () => {
    let priceMonitorData = {
        id: "1234",
        gameID: "565656",
        collectionID: "1",
        userID: "testUser123",
        desiredCondition: "new",
        desiredPrice: 55
    };
    let priceMonitor = new gamePriceMonitorTest.GamePriceMonitor(priceMonitorData.id, priceMonitorData.userID, priceMonitorData.collectionID, priceMonitorData.gameID, priceMonitorData.desiredCondition, priceMonitorData.desiredPrice);
    let response = await gamePriceMonitorManagerTest.deleteGamePriceMonitor(priceMonitor);
    expect(response).toEqual(priceMonitor);    
});

//Delete a price monitor that doesn't exist (i.e. trying to delete a game that was already deleted)
test("deleteGamePriceMonitor", async () => {
    let priceMonitorData = {
        id: "1234",
        gameID: "565656",
        collectionID: "1",
        userID: "testUser123",
        desiredCondition: "new",
        desiredPrice: 55
    };
    let priceMonitor = new gamePriceMonitorTest.GamePriceMonitor(priceMonitorData.id, priceMonitorData.userID, priceMonitorData.collectionID, priceMonitorData.gameID, priceMonitorData.desiredCondition, priceMonitorData.desiredPrice);
    await expect(gamePriceMonitorManagerTest.deleteGamePriceMonitor(priceMonitor))
    .rejects
    .toThrow("Game price monitor error: Unable to delete game price monitor.  Conditional Check Failed.")
});