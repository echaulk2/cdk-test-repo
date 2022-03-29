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

test("Add Game to Wishlist", async () => {
    let inputData = {
        collectionID: '2',
        gameName: 'Super Mario',
        yearReleased: 1992,
        genre: 'Action-Adventure',
        console: 'Nintendo 64',
        developer: 'Nintendo'
    }
    let userData = {
        userID: 'erikchaulk',
        email: 'erikchaulk@gmail.com'
    };
    let gameID = '987654'
    let itemType = '[CollectionItem]#[Wishlist]#[GameItem]';
    let testGame = new gameObject.Game(gameID, userData.userID, userData.email, inputData.gameName, itemType, inputData.collectionID, inputData.yearReleased, inputData.genre, inputData.console, inputData.developer);
    let testWishlist = new wishlist.Wishlist(userData.userID, inputData.collectionID);
    let response = await collectionManager.addGameToCollection(testGame, testWishlist);
    expect(response).toEqual([testGame]);
});

test("Add Game to Wishlist that already exists", async () => {
    let inputData = {
        collectionID: '2',
        gameName: 'Super Mario',
        yearReleased: 1992,
        genre: 'Action-Adventure',
        console: 'Nintendo 64',
        developer: 'Nintendo'
    }
    let userData = {
        userID: 'erikchaulk',
        email: 'erikchaulk@gmail.com'
    };
    let gameID = '987654'
    let itemType = '[CollectionItem]#[Wishlist]#[GameItem]';
    let testGame = new gameObject.Game(gameID, userData.userID, userData.email, inputData.gameName, itemType, inputData.collectionID, inputData.yearReleased, inputData.genre, inputData.console, inputData.developer);
    let testWishlist = new wishlist.Wishlist(userData.userID, inputData.collectionID);
    await expect(collectionManager.addGameToCollection(testGame, testWishlist))
    .rejects
    .toThrow("Game error, datastore response: Unable to create game.  Conditional Check Failed.")
});

test("removeGameFromCollection", async () => {
    let inputData = {
        collectionID: '2',
        gameName: 'Super Mario',
        yearReleased: 1992,
        genre: 'Action-Adventure',
        console: 'Nintendo 64',
        developer: 'Nintendo'
    }
    let inputDataForSecondGame = {
        collectionID: '2',
        gameName: 'Overwatch',
        yearReleased: 2016,
        genre: 'First-Person Shooter',
        console: 'PC',
        developer: 'Blizzard'
    }
    let userData = {
        userID: 'erikchaulk',
        email: 'erikchaulk@gmail.com'
    };
    let gameID = '987654';
    let secondGameID = '667788';
    let itemType = '[CollectionItem]#[Wishlist]#[GameItem]';
    let testGame = new gameObject.Game(gameID, userData.userID, userData.email, inputData.gameName, itemType, inputData.collectionID, inputData.yearReleased, inputData.genre, inputData.console, inputData.developer);
    let secondTestGame = new gameObject.Game(secondGameID, userData.userID, userData.email, inputDataForSecondGame.gameName, itemType, inputDataForSecondGame.collectionID, inputDataForSecondGame.yearReleased, inputDataForSecondGame.genre, inputDataForSecondGame.console, inputDataForSecondGame.developer);
    let testWishlist = new wishlist.Wishlist(userData.userID, inputDataForSecondGame.collectionID);
    await collectionManager.addGameToCollection(secondTestGame, testWishlist);
    let response = await collectionManager.removeGameFromCollection(secondTestGame, testWishlist);
    expect(response).toEqual([testGame]);
});

test("Remove a game that does not exist in a collection (i.e. attempt to remove a game that was already removed)", async () => {
    let inputDataForSecondGame = {
        collectionID: '2',
        gameName: 'Overwatch',
        yearReleased: 2016,
        genre: 'First-Person Shooter',
        console: 'PC',
        developer: 'Blizzard'
    }
    let userData = {
        userID: 'erikchaulk',
        email: 'erikchaulk@gmail.com'
    };
    let secondGameID = '667788';
    let itemType = '[CollectionItem]#[Wishlist]#[GameItem]';
    let secondTestGame = new gameObject.Game(secondGameID, userData.userID, userData.email, inputDataForSecondGame.gameName, itemType, inputDataForSecondGame.collectionID, inputDataForSecondGame.yearReleased, inputDataForSecondGame.genre, inputDataForSecondGame.console, inputDataForSecondGame.developer);
    let testWishlist = new wishlist.Wishlist(userData.userID, inputDataForSecondGame.collectionID);
    await expect(collectionManager.removeGameFromCollection(secondTestGame, testWishlist))
    .rejects
    .toThrow("Game error, datastore response: Unable to delete game.  Conditional Check Failed.")
});

test("modifyGameInCollection", async () => {
    let inputData = {
        collectionID: '2',
        gameName: 'Super Mario',
        yearReleased: 1993,
        genre: 'Action-Adventure',
        console: 'Nintendo 64',
        developer: 'Nintendo'
    }
    
    let userData = {
        userID: 'erikchaulk',
        email: 'erikchaulk@gmail.com'
    };
    let gameID = '987654'
    let itemType = '[CollectionItem]#[Wishlist]#[GameItem]';
    let testGame = new gameObject.Game(gameID, userData.userID, userData.email, inputData.gameName, itemType, inputData.collectionID, inputData.yearReleased, inputData.genre, inputData.console, inputData.developer);
    let testWishlist = new wishlist.Wishlist(userData.userID, inputData.collectionID);
    let response = await collectionManager.modifyGameInCollection(testGame, testWishlist);
    expect(response).toEqual([testGame]);
});

test("Modify a game that does not exist in the collection.", async () => {
    let inputData = {
        collectionID: '2',
        gameName: 'Super Smash Brothers',
        yearReleased: 1993,
        genre: 'Fighting',
        console: 'Nintendo 64',
        developer: 'Nintendo'
    }
    
    let userData = {
        userID: 'erikchaulk',
        email: 'erikchaulk@gmail.com'
    };
    let gameID = '331122'
    let itemType = '[CollectionItem]#[Wishlist]#[GameItem]';
    let testGame = new gameObject.Game(gameID, userData.userID, userData.email, inputData.gameName, itemType, inputData.collectionID, inputData.yearReleased, inputData.genre, inputData.console, inputData.developer);
    let testWishlist = new wishlist.Wishlist(userData.userID, inputData.collectionID);
    await expect(collectionManager.modifyGameInCollection(testGame, testWishlist))
    .rejects
    .toThrow("Game error, datastore response: Unable to modify game.  Conditional Check Failed.")
});

test("getGameInCollection", async () => {
    let inputData = {
        collectionID: '2',
        gameName: 'Super Mario',
        yearReleased: 1993,
        genre: 'Action-Adventure',
        console: 'Nintendo 64',
        developer: 'Nintendo'
    }
    
    let userData = {
        userID: 'erikchaulk',
        email: 'erikchaulk@gmail.com'
    };
    let gameID = '987654'
    let itemType = '[CollectionItem]#[Wishlist]#[GameItem]';
    let testGame = new gameObject.Game(gameID, userData.userID, userData.email, inputData.gameName, itemType, inputData.collectionID, inputData.yearReleased, inputData.genre, inputData.console, inputData.developer);
    let testWishlist = new wishlist.Wishlist(userData.userID, inputData.collectionID);
    let response = await collectionManager.getGameInCollection(testGame, testWishlist);
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
        email: 'erikchaulk@gmail.com'
    };
    //The game ID is the only different attribute, which causes it to not be found and throw an error.
    let gameID = '009988'
    let itemType = '[CollectionItem]#[Wishlist]#[GameItem]';
    let testGame = new gameObject.Game(gameID, userData.userID, userData.email, inputData.gameName, itemType, inputData.collectionID, inputData.yearReleased, inputData.genre, inputData.console, inputData.developer);
    let testWishlist = new wishlist.Wishlist(userData.userID, inputData.collectionID);
    await expect(collectionManager.getGameInCollection(testGame, testWishlist))
    .rejects
    .toThrow("Game error, datastore response: Unable to get game. Game not found.")
});

test("collectionError", async () => {
    let collectionError = new collectionErrorHandler.CollectionError("Game not found in the collection.");
    expect(collectionError.message).toEqual('Collection error, datastore response: Game not found in the collection.');
});

test("getAllGamesInCollection", async () => {
    let inputData = {
        collectionID: '2',
        gameName: 'Super Mario',
        yearReleased: 1993,
        genre: 'Action-Adventure',
        console: 'Nintendo 64',
        developer: 'Nintendo'
    }
    
    let userData = {
        userID: 'erikchaulk',
        email: 'erikchaulk@gmail.com'
    };
    let gameID = '987654'
    let itemType = '[CollectionItem]#[Wishlist]#[GameItem]';
    let testGame = new gameObject.Game(gameID, userData.userID, userData.email, inputData.gameName, itemType, inputData.collectionID, inputData.yearReleased, inputData.genre, inputData.console, inputData.developer);
    let testWishlist = new wishlist.Wishlist(userData.userID, inputData.collectionID);
    let response = await collectionManager.getAllGamesInCollection(testWishlist);
    expect(response).toEqual([testGame]);
});