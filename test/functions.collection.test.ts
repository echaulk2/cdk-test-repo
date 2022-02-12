const collection = require("../functions/collection");
const collectionManager = require("../functions/collectionManager");
const collectionErrorHandler = require("../functions/collectionErrorHandler");
const gameObject = require("../functions/game");
const gameDAO = require("../functions/gameManager");

test("CreateCollection", async () => {
    let testGame = new gameObject.Game(`[USER]#[erikchaulk]`, `[COLLECTIONITEM]#[WISHLIST]#[GAMEITEM]#[Overwatch]`, 'Overwatch', 2016, 'First-Person Shooter', 'PC', 'Blizzard', 100);
    jest.setTimeout(30000);
    let response = await gameDAO.gamePrice(6.81);
    expect(response).toEqual(100);
});/* 

test("addGame", async () => {
    let testGame = new gameObject.Game('erikchaulk', 'League of Legends', 2008, 'Moba', 'PC', 'Riot Games');
    let testCollection = new collection.Collection('erikchaulk','wishlist');
    testCollection.addGame(testGame);
    expect(testCollection.games).toEqual([testGame]);
});

test("isGameInCollection", async () => {
    let testGame = new gameObject.Game('erikchaulk', 'League of Legends', 2008, 'Moba', 'PC', 'Riot Games');
    let testCollection = new collection.Collection('erikchaulk','wishlist');
    testCollection.addGame(testGame);
    let condition = testCollection.isGameInCollection(testGame);
    expect(condition).toEqual(true);
});

test("removeGame", async () => {
    let newGame = new gameObject.Game('FunkyButLoving', 'League of Legends', 2008, 'Moba', 'PC', 'Riot Games');
    let someOtherGame = new gameObject.Game('FunkyButLoving', 'The Witness', 2016, 'Strategy', 'PC', 'Valve');
    let testCollection = new collection.Collection('FunkyButLoving','wishlist');
    testCollection.addGame(newGame);
    testCollection.addGame(someOtherGame);
    testCollection.removeGame(someOtherGame);    
    expect(testCollection.games).toEqual([newGame]);
});

test("getCollection", async () => {
    let myGame = new gameObject.Game('testUser', 'League of Legends', 2008, 'Moba', 'PC', 'Riot Games');
    let myOtherGame = new gameObject.Game('testUser', 'Magic: The Gathering', 2016, 'Strategy', 'PC', 'Wizards of the Coast');
    let myCollection = new collection.Collection('testUser','wishlist', [myGame, myOtherGame]);
    await myCollection.createCollection();
    let response = await collectionManager.getCollection('testUser', 'wishlist');
    expect(response).toEqual(myCollection);
});

test("addGameToCollection", async () => {
    let myNewGame = new gameObject.Game('aNewUser', 'Half Life 2', 2004, 'First-Person Shooter', 'PC', 'Valve');
    let myNewCollection = new collection.Collection('aNewUser','wishlist');
    await myNewCollection.createCollection();
    let response = await collectionManager.addGameToCollection(myNewGame, myNewCollection);
    expect(response).toEqual(myNewCollection);
});

test("removeGameFromCollection", async () => {
    let walkingTesterGame = new gameObject.Game('walkingTester', 'Half Life 2', 2004, 'First-Person Shooter', 'PC', 'Valve');
    let walkingTesterCollection = new collection.Collection('walkingTester','wishlist',[walkingTesterGame]);
    await walkingTesterCollection.createCollection();
    let response = await collectionManager.removeGameFromCollection(walkingTesterGame, walkingTesterCollection);
    expect(response).toEqual(walkingTesterCollection);
});

test("collectionError", async () => {
    let collectionError = new collectionErrorHandler.CollectionError("Game not found in the collection.", 404);
    expect(collectionError.message).toEqual('Collection error, datastore response: Game not found in the collection.');
    expect(collectionError.statusCode).toEqual(404);
}); */