const collection = require("../functions/models/collection");
const wishlist = require("../functions/models/wishlist");
const collectionManager = require("../functions/dataManager/collectionManager");
const collectionErrorHandler = require("../functions/error/collectionErrorHandler");
const gameObject = require("../functions/models/game");
const gameDAO = require("../functions/dataManager/gameManager");
const priceDataManager = require("../functions/dataManager/priceDataManager");
const gamePriceData = require("../functions/models/gamePriceData");

test("Add Game to Wishlist", async () => {
    let partitionKey = '[User]#[erikchaulk]'
    let sortKey = '[CollectionItem]#[Wishlist]#[GameItem]#[Super Mario]'
    let userID = 'erikchaulk';
    let testGame = new gameObject.Game(partitionKey, sortKey, 'Super Mario', 1992, 'Action-Adventure', 'Nintendo 64', 'Nintendo', 'loose');
    let testWishlist = new wishlist.Wishlist(userID);
    jest.setTimeout(30000);
    let response = await collectionManager.addGameToCollection(testGame, testWishlist);
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