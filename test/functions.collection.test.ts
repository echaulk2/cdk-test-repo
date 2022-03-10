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

test("Add Game to Wishlist", async () => {
    let partitionKey = '[User]#[erikchaulk]'
    let collectionSortKey = '[CollectionItem]#[Wishlist]#[GameItem]#[Super Mario]'
    let collectionItemType = '[CollectionItem]#[Wishlist]#[GameItem]'
    let userData = {
        userID: 'erikchaulk',
        email: 'erikchaulk@gmail.com'
    };
    let gamePriceDataSortKey = '[GamePriceData]#[Super Mario]';
    let gamePriceDataItemType = '[GamePriceData]';
    let testGame = new gameObject.Game(partitionKey, collectionSortKey, collectionItemType, 'Super Mario', userData.email, 1992, 'Action-Adventure', 'Nintendo 64', 'Nintendo', 'loose', 50);
    let testGamePriceData = new gamePriceData.GamePriceData(partitionKey, gamePriceDataSortKey, gamePriceDataItemType);
    testGamePriceData.lowestPrice = "$18.74";
    testGamePriceData.averagePrice = "$44.51";
    testGamePriceData.listedItemTitle = "Super Mario 64";
    testGamePriceData.listedItemURL = "https://www.pricecharting.com/game/jp-nintendo-64/super-mario-64";
    testGamePriceData.listedItemConsole = "JP Nintendo 64";
    testGamePriceData.lastChecked = "3/10/2022, 11:15:38 AM";
    let testWishlist = new wishlist.Wishlist(userData.userID);
    jest.setTimeout(30000);
    let response = await collectionManager.addGameToCollection(testGame, testWishlist);
    testGame.gamePriceData = testGamePriceData;
    expect(response).toEqual([testGame]);
});

test("removeGameFromCollection", async () => {
    let partitionKey = '[User]#[erikchaulk]';
    let sortKey = '[CollectionItem]#[Wishlist]#[GameItem]#[Super Mario]';
    let secondSortKey = '[CollectionItem]#[Wishlist]#[GameItem]#[Overwatch]';
    let userID = 'erikchaulk';
    let testGame = new gameObject.Game(partitionKey, sortKey, 'Super Mario', 1992, 'Action-Adventure', 'Nintendo 64', 'Nintendo', 'loose');
    let secondTestGame = new gameObject.Game(partitionKey, secondSortKey, 'Overwatch', 2016, 'First-Person Shooter', 'PC', 'Blizzard', 'cib');
    let testWishlist = new wishlist.Wishlist(userID);
    await collectionManager.addGameToCollection(secondTestGame, testWishlist);
    let response = await collectionManager.removeGameFromCollection(secondTestGame, testWishlist);
    expect(response).toEqual([testGame]);
});

test("modifyGameInCollection", async () => {
    let partitionKey = '[User]#[erikchaulk]';
    let sortKey = '[CollectionItem]#[Wishlist]#[GameItem]#[Super Mario]';
    let userID = 'erikchaulk';
    let testGame = new gameObject.Game(partitionKey, sortKey, 'Super Mario', 1993, 'Action-Adventure', 'Nintendo 64', 'Nintendo', 'loose');
    let testWishlist = new wishlist.Wishlist(userID);
    let response = await collectionManager.modifyGameInCollection(testGame, testWishlist);
    expect(response).toEqual([testGame]);
});

test("getCollection", async () => {
    let partitionKey = '[User]#[erikchaulk]';
    let sortKey = '[CollectionItem]#[Wishlist]#[GameItem]#[Super Mario]';
    let testGame = new gameObject.Game(partitionKey, sortKey, 'Super Mario', 1993, 'Action-Adventure', 'Nintendo 64', 'Nintendo', 'loose');
    let userID = 'erikchaulk';
    let testWishlist = new wishlist.Wishlist(userID);
    let response = await collectionManager.getCollection(testWishlist);
    expect(response).toEqual([testGame]);
});

test("collectionError", async () => {
    let collectionError = new collectionErrorHandler.CollectionError("Game not found in the collection.", 404);
    expect(collectionError.message).toEqual('Collection error, datastore response: Game not found in the collection.');
    expect(collectionError.statusCode).toEqual(404);
});
