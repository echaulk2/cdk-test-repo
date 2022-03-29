const gamePriceMonitorTest = require("../functions/models/gamePriceMonitor");
const gamePriceMonitorManagerTest = require("../functions/dataManager/gamePriceMonitor");
const gamePriceMonitorWishlistTest = require("../functions/models/wishlist");
const gamePriceMonitorGameTest = require("../functions/models/game");
const gamePriceMonitorCollectionTest = require("../functions/dataManager/collectionManager");
const gamePriceMonitorError = require("../functions/error/gamePriceMonitorErrorHandler");

test("createGamePriceMonitor", async () => {
    let collectionItemData = {
        id: "565656",
        collectionID: "1",
        userID: "testUser123",
        email: "testUser123@gmail.com",
        gameName: 'God of War',
        yearReleased: 2017,
        genre: 'Action-Adventure',
        console: 'Playstation',
        developer: 'Santa Monica Studio',
        itemType: '[CollectionItem]#[Wishlist]#[GameItem]#[testUser123]#[565656]'
    }
    let priceMonitorData = {
        id: "565656",
        collectionID: "1",
        userID: "testUser123",
        email: "testUser123@gmail.com",
        desiredCondition: "new",
        desiredPrice: 50
    };
    let testWishlist = new gamePriceMonitorWishlistTest.Wishlist(collectionItemData.userID, collectionItemData.collectionID);
    let testGame = new gamePriceMonitorGameTest.Game(collectionItemData.id, collectionItemData.userID, collectionItemData.email, collectionItemData.gameName, collectionItemData.itemType, collectionItemData.collectionID, collectionItemData.yearReleased, collectionItemData.genre, collectionItemData.console, collectionItemData.developer);
    let addGame = await gamePriceMonitorCollectionTest.addGameToCollection(testGame, testWishlist);
    let priceMonitor = new gamePriceMonitorTest.GamePriceMonitor(priceMonitorData.id, priceMonitorData.collectionID, priceMonitorData.userID, priceMonitorData.email, priceMonitorData.desiredCondition, priceMonitorData.desiredPrice);
    let response = await gamePriceMonitorManagerTest.createGamePriceMonitor(priceMonitor);
    expect(response).toEqual(priceMonitor);
});

//Attempt to create a price monitor that already exists
test("createGamePriceMonitor", async () => {
    let collectionItemData = {
        id: "565656",
        collectionID: "1",
        userID: "testUser123",
        email: "testUser123@gmail.com",
        gameName: 'God of War',
        yearReleased: 2017,
        genre: 'Action-Adventure',
        console: 'Playstation',
        developer: 'Santa Monica Studio',
        itemType: '[CollectionItem]#[Wishlist]#[GameItem]#[testUser123]#[565656]'
    }
    let priceMonitorData = {
        id: "565656",
        collectionID: "1",
        userID: "testUser123",
        email: "testUser123@gmail.com",
        desiredCondition: "new",
        desiredPrice: 50
    };
    let priceMonitor = new gamePriceMonitorTest.GamePriceMonitor(priceMonitorData.id, priceMonitorData.collectionID, priceMonitorData.userID, priceMonitorData.email, priceMonitorData.desiredCondition, priceMonitorData.desiredPrice);
    await expect(gamePriceMonitorManagerTest.createGamePriceMonitor(priceMonitor))
    .rejects
    .toThrow("Game price monitor error: Unable to create Game Price Monitor.  Conditional Check Failed.")
});

test("getGamePriceMonitor", async () => {
    let priceMonitorData = {
        id: "565656",
        collectionID: "1",
        userID: "testUser123",
        email: "testUser123@gmail.com",
        desiredCondition: "new",
        desiredPrice: 50
    };
    let priceMonitor = new gamePriceMonitorTest.GamePriceMonitor(priceMonitorData.id, priceMonitorData.collectionID, priceMonitorData.userID, priceMonitorData.email, priceMonitorData.desiredCondition, priceMonitorData.desiredPrice);
    let response = await gamePriceMonitorManagerTest.getGamePriceMonitor(priceMonitor);
    expect(response).toEqual(priceMonitor);
});

test("getGamePriceMonitor", async () => {
    let unknownPriceMonitor = {
        id: "565656",
        collectionID: "1",
        userID: "testUser123",
        email: "testUser123@gmail.com",
        desiredCondition: "loose",
        desiredPrice: 35
    };
    let priceMonitor = new gamePriceMonitorTest.GamePriceMonitor(unknownPriceMonitor.id, unknownPriceMonitor.collectionID, unknownPriceMonitor.userID, unknownPriceMonitor.email, unknownPriceMonitor.desiredCondition, unknownPriceMonitor.desiredPrice);
    await expect(gamePriceMonitorManagerTest.getGamePriceMonitor(priceMonitor))
    .rejects
    .toThrow("Game price monitor error: Unable to get game price monitor. Game price monitor not found.");
});


test("getAllPriceMonitorsForGame", async () => {
    let id = "565656";
    let firstPriceMonitorData = {
        id: "565656",
        collectionID: "1",
        userID: "testUser123",
        email: "testUser123@gmail.com",
        desiredCondition: "new",
        desiredPrice: 50
    };
    let secondPriceMonitorData = {
        id: "565656",
        collectionID: "1",
        userID: "testUser123",
        email: "testUser123@gmail.com",
        desiredCondition: "loose",
        desiredPrice: 35
    };
    let firstMonitor = new gamePriceMonitorTest.GamePriceMonitor(firstPriceMonitorData.id, firstPriceMonitorData.collectionID, firstPriceMonitorData.userID, firstPriceMonitorData.email, firstPriceMonitorData.desiredCondition, firstPriceMonitorData.desiredPrice);
    let secondMonitor = new gamePriceMonitorTest.GamePriceMonitor(secondPriceMonitorData.id, secondPriceMonitorData.collectionID, secondPriceMonitorData.userID, secondPriceMonitorData.email, secondPriceMonitorData.desiredCondition, secondPriceMonitorData.desiredPrice);
    let addSecondMonitor = await gamePriceMonitorManagerTest.createGamePriceMonitor(secondMonitor);
    let priceMonitors = [secondMonitor, firstMonitor];
    let response = await gamePriceMonitorManagerTest.getAllPriceMonitorsForGame(id);
    expect(response).toEqual(priceMonitors);
});

test("modifyGamePriceMonitor", async () => {
    let priceMonitorData = {
        id: "565656",
        collectionID: "1",
        userID: "testUser123",
        email: "testUser123@gmail.com",
        desiredCondition: "new",
        desiredPrice: 55
    };
    let priceMonitor = new gamePriceMonitorTest.GamePriceMonitor(priceMonitorData.id, priceMonitorData.collectionID, priceMonitorData.userID, priceMonitorData.email, priceMonitorData.desiredCondition, priceMonitorData.desiredPrice);
    let response = await gamePriceMonitorManagerTest.modifyGamePriceMonitor(priceMonitor);
    expect(response).toEqual(priceMonitor);
});

//Attempt to modify a price monitor that doesn't exist
test("modifyGamePriceMonitor", async () => {
    let priceMonitorData = {
        id: "abc123",
        collectionID: "1",
        userID: "testUser123",
        email: "testUser123@gmail.com",
        desiredCondition: "new",
        desiredPrice: 55
    };
    let priceMonitor = new gamePriceMonitorTest.GamePriceMonitor(priceMonitorData.id, priceMonitorData.collectionID, priceMonitorData.userID, priceMonitorData.email, priceMonitorData.desiredCondition, priceMonitorData.desiredPrice);
    await expect(gamePriceMonitorManagerTest.modifyGamePriceMonitor(priceMonitor))
    .rejects
    .toThrow("Game price monitor error: Unable to modify Game Price Monitor.  Conditional Check Failed.")
});

test("deleteGamePriceMonitor", async () => {
    let secondPriceMonitorData = {
        id: "565656",
        collectionID: "1",
        userID: "testUser123",
        email: "testUser123@gmail.com",
        desiredCondition: "loose",
        desiredPrice: 35
    };
    let secondMonitor = new gamePriceMonitorTest.GamePriceMonitor(secondPriceMonitorData.id, secondPriceMonitorData.collectionID, secondPriceMonitorData.userID, secondPriceMonitorData.email, secondPriceMonitorData.desiredCondition, secondPriceMonitorData.desiredPrice);
    let response = await gamePriceMonitorManagerTest.deleteGamePriceMonitor(secondMonitor);
    expect(response).toEqual(secondMonitor);    
});

//Delete a price monitor that doesn't exist (i.e. trying to delete a game that was already deleted)
test("deleteGamePriceMonitor", async () => {
    let secondPriceMonitorData = {
        id: "565656",
        collectionID: "1",
        userID: "testUser123",
        email: "testUser123@gmail.com",
        desiredCondition: "loose",
        desiredPrice: 35
    };
    let secondMonitor = new gamePriceMonitorTest.GamePriceMonitor(secondPriceMonitorData.id, secondPriceMonitorData.collectionID, secondPriceMonitorData.userID, secondPriceMonitorData.email, secondPriceMonitorData.desiredCondition, secondPriceMonitorData.desiredPrice);
    await expect(gamePriceMonitorManagerTest.deleteGamePriceMonitor(secondMonitor))
    .rejects
    .toThrow("Game price monitor error: Unable to delete game price monitor.  Conditional Check Failed.")
});