import { Wishlist } from "../functions/models/wishlist";

const collection = require("../functions/models/collection");
const wishlist = require("../functions/models/wishlist");
const collectionManager = require("../functions/dataManager/collectionManager");
const collectionErrorHandler = require("../functions/error/collectionErrorHandler");
const gameObject = require("../functions/models/game");
const gameDAO = require("../functions/dataManager/gameManager");
const priceDataManager = require("../functions/dataManager/priceChartingDataManager");
const gamePriceData = require("../functions/models/gamePriceData");
const Interfaces = require("../functions/shared/interfaces/interfaces");
const gamePriceDAO = require("../functions/dataManager/gamePriceDataManager");
const gameCommon = require("../functions/shared/common/game");


test("createCollection", async () => {    
    let wishlist = new collection.Collection("erikchaulk", "Col-2");
    let response = await collectionManager.createCollection(wishlist);
    expect(response).toEqual(wishlist);
});

test("Add Game to Wishlist", async () => {
    let inputData = {
        collectionID: 'Col-2',
        gameName: 'Super Mario',
        yearReleased: 1992,
        genre: 'Action-Adventure',
        console: 'Nintendo 64',
        developer: 'Nintendo'
    }
    let userData = {
        userID: 'erikchaulk',
    };
    let gameID = '987654'
    let testGame = new gameObject.Game(gameID, userData.userID, inputData.gameName, inputData.yearReleased, inputData.genre, inputData.console, inputData.developer, inputData.collectionID);
    testGame.priceMonitorData = [];
    let response = await collectionManager.addGameToCollection(testGame);
    expect(response).toEqual([testGame]);
});

test("Add Game to Wishlist that already exists", async () => {
    let inputData = {
        collectionID: 'Col-2',
        gameName: 'Super Mario',
        yearReleased: 1992,
        genre: 'Action-Adventure',
        console: 'Nintendo 64',
        developer: 'Nintendo'
    }
    let userData = {
        userID: 'erikchaulk',
    };
    let gameID = '987654'
    let testGame = new gameObject.Game(gameID, userData.userID, inputData.gameName, inputData.yearReleased, inputData.genre, inputData.console, inputData.developer, inputData.collectionID);
    testGame.priceMonitorData = [];
    await expect(collectionManager.addGameToCollection(testGame))
    .rejects
    .toThrow("Game error, datastore response: Unable to create game.  Game already exists in collection.")
});

test("removeGameFromCollection", async () => {
    let inputData = {
        collectionID: 'Col-2',
        gameName: 'Super Mario',
        yearReleased: 1992,
        genre: 'Action-Adventure',
        console: 'Nintendo 64',
        developer: 'Nintendo'
    }
    let inputDataForSecondGame = {
        collectionID: 'Col-2',
        gameName: 'Overwatch',
        yearReleased: 2016,
        genre: 'First-Person Shooter',
        console: 'PC',
        developer: 'Blizzard'
    }
    let userData = {
        userID: 'erikchaulk',
    };
    let gameID = '987654';
    let secondGameID = '667788';
    let testGame = new gameObject.Game(gameID, userData.userID, inputData.gameName, inputData.yearReleased, inputData.genre, inputData.console, inputData.developer, inputData.collectionID);
    let secondTestGame = new gameObject.Game(secondGameID, userData.userID, inputDataForSecondGame.gameName, inputDataForSecondGame.yearReleased, inputDataForSecondGame.genre, inputDataForSecondGame.console, inputDataForSecondGame.developer, inputDataForSecondGame.collectionID);
    testGame.priceMonitorData = []
    secondTestGame.priceMonitorData = [];
    let addSecondGameToCollection = await collectionManager.addGameToCollection(secondTestGame);
    let response = await collectionManager.removeGameFromCollection(secondTestGame);
    expect(response).toEqual([testGame]);
});

test("Remove a game that does not exist in a collection (i.e. attempt to remove a game that was already removed)", async () => {
    let inputDataForSecondGame = {
        collectionID: 'Col-2',
        gameName: 'Overwatch',
        yearReleased: 2016,
        genre: 'First-Person Shooter',
        console: 'PC',
        developer: 'Blizzard'
    }
    let userData = {
        userID: 'erikchaulk',
    };
    let secondGameID = '667788';
    let secondTestGame = new gameObject.Game(secondGameID, userData.userID, inputDataForSecondGame.gameName, inputDataForSecondGame.yearReleased, inputDataForSecondGame.genre, inputDataForSecondGame.console, inputDataForSecondGame.developer, inputDataForSecondGame.collectionID);
    await expect(collectionManager.removeGameFromCollection(secondTestGame))
    .rejects
    .toThrow("Game error, datastore response: Unable to delete game.  Unable to find game in collection.")
});

test("modifyGameInCollection", async () => {
    let inputData = {
        collectionID: 'Col-2',
        gameName: 'Super Mario',
        yearReleased: 1993,
        genre: 'Action-Adventure',
        console: 'Nintendo 64',
        developer: 'Nintendo'
    }
    
    let userData = {
        userID: 'erikchaulk',
    };
    let gameID = '987654'
    let testGame = new gameObject.Game(gameID, userData.userID, inputData.gameName, inputData.yearReleased, inputData.genre, inputData.console, inputData.developer, inputData.collectionID);
    testGame.priceMonitorData = [];
    let response = await collectionManager.modifyGameInCollection(testGame);
    expect(response).toEqual([testGame]);
});

test("Modify a game that does not exist in the collection.", async () => {
    let inputData = {
        collectionID: 'Col-2',
        gameName: 'Super Smash Brothers',
        yearReleased: 1993,
        genre: 'Fighting',
        console: 'Nintendo 64',
        developer: 'Nintendo'
    }
    
    let userData = {
        userID: 'erikchaulk',
    };
    let gameID = '331122'
    let testGame = new gameObject.Game(gameID, userData.userID, inputData.gameName, inputData.yearReleased, inputData.genre, inputData.console, inputData.developer, inputData.collectionID);
    await expect(collectionManager.modifyGameInCollection(testGame))
    .rejects
    .toThrow("Game error, datastore response: Unable to modify game.  Unable to find game in collection.")
});

test("getGameInCollection", async () => {
    let inputData = {
        collectionID: 'Col-2',
        gameName: 'Super Mario',
        yearReleased: 1993,
        genre: 'Action-Adventure',
        console: 'Nintendo 64',
        developer: 'Nintendo'
    }
    
    let userData = {
        userID: 'erikchaulk',
    };
    let gameID = '987654'
    let testGame = new gameObject.Game(gameID, userData.userID, inputData.gameName, inputData.yearReleased, inputData.genre, inputData.console, inputData.developer, inputData.collectionID);
    let response = await collectionManager.getGameInCollection(testGame);
    expect(response).toEqual(testGame);
});

test("Attempt to get a game that doesn't exist in the collection", async () => {
    let inputData = {
        collectionID: '1',
        gameName: 'Super Mario',
        yearReleased: 1993,
        genre: 'Action-Adventure',
        console: 'Nintendo 64',
        developer: 'Nintendo'
    }
    
    let userData = {
        userID: 'erikchaulk',
    };
    //The game ID is the only different attribute, which causes it to not be found and throw an error.
    let gameID = '009988';
    let testGame = new gameObject.Game(gameID, userData.userID, inputData.gameName, inputData.yearReleased, inputData.genre, inputData.console, inputData.developer, inputData.collectionID);
    await expect(collectionManager.getGameInCollection(testGame))
    .rejects
    .toThrow("Game error, datastore response: Unable to get game. Game not found.");
});

test("collectionError", async () => {
    let collectionError = new collectionErrorHandler.CollectionError("Game not found in the collection.");
    expect(collectionError.message).toEqual('Collection error, datastore response: Game not found in the collection.');
});

test("getAllGamesInCollection", async () => {
    let inputData = {
        collectionID: 'Col-2',
        gameName: 'Super Mario',
        yearReleased: 1993,
        genre: 'Action-Adventure',
        console: 'Nintendo 64',
        developer: 'Nintendo'
    }
    
    let userData = {
        userID: 'erikchaulk',
    };
    let gameID = '987654'
    let testGame = new gameObject.Game(gameID, userData.userID, inputData.gameName, inputData.yearReleased, inputData.genre, inputData.console, inputData.developer, inputData.collectionID);
    testGame.priceMonitorData = [];
    let testWishlist = new wishlist.Wishlist(userData.userID, inputData.collectionID);
    let response = await collectionManager.getAllGamesInCollection(testWishlist);
    expect(response).toEqual([testGame]);
});

test("listCollections", async () => {    
    let collectionData = [
        {
            userID: "erikchaulk",
            collectionID: 'Col-2'
        }
    ]
    let userID = "erikchaulk"
    let response = await collectionManager.listCollections("erikchaulk");
    expect(response).toEqual(collectionData);
});