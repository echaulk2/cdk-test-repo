"use strict";
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
    };
    let userData = {
        userID: 'erikchaulk',
    };
    let gameID = '987654';
    let testGame = new gameObject.Game(gameID, userData.userID, inputData.gameName, inputData.yearReleased, inputData.genre, inputData.console, inputData.developer, inputData.collectionID);
    testGame.priceMonitorData = [];
    let response = await collectionManager.addGameToCollection(testGame);
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
    };
    let userData = {
        userID: 'erikchaulk',
    };
    let gameID = '987654';
    let testGame = new gameObject.Game(gameID, userData.userID, inputData.gameName, inputData.yearReleased, inputData.genre, inputData.console, inputData.developer, inputData.collectionID);
    testGame.priceMonitorData = [];
    await expect(collectionManager.addGameToCollection(testGame))
        .rejects
        .toThrow("Game error, datastore response: Unable to create game.  Game already exists in collection.");
});
test("removeGameFromCollection", async () => {
    let inputData = {
        collectionID: '2',
        gameName: 'Super Mario',
        yearReleased: 1992,
        genre: 'Action-Adventure',
        console: 'Nintendo 64',
        developer: 'Nintendo'
    };
    let inputDataForSecondGame = {
        collectionID: '2',
        gameName: 'Overwatch',
        yearReleased: 2016,
        genre: 'First-Person Shooter',
        console: 'PC',
        developer: 'Blizzard'
    };
    let userData = {
        userID: 'erikchaulk',
    };
    let gameID = '987654';
    let secondGameID = '667788';
    let testGame = new gameObject.Game(gameID, userData.userID, inputData.gameName, inputData.yearReleased, inputData.genre, inputData.console, inputData.developer, inputData.collectionID);
    let secondTestGame = new gameObject.Game(secondGameID, userData.userID, inputDataForSecondGame.gameName, inputDataForSecondGame.yearReleased, inputDataForSecondGame.genre, inputDataForSecondGame.console, inputDataForSecondGame.developer, inputDataForSecondGame.collectionID);
    testGame.priceMonitorData = [];
    secondTestGame.priceMonitorData = [];
    let addSecondGameToCollection = await collectionManager.addGameToCollection(secondTestGame);
    let response = await collectionManager.removeGameFromCollection(secondTestGame);
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
    };
    let userData = {
        userID: 'erikchaulk',
    };
    let secondGameID = '667788';
    let secondTestGame = new gameObject.Game(secondGameID, userData.userID, inputDataForSecondGame.gameName, inputDataForSecondGame.yearReleased, inputDataForSecondGame.genre, inputDataForSecondGame.console, inputDataForSecondGame.developer, inputDataForSecondGame.collectionID);
    await expect(collectionManager.removeGameFromCollection(secondTestGame))
        .rejects
        .toThrow("Game error, datastore response: Unable to delete game.  Unable to find game in collection.");
});
test("modifyGameInCollection", async () => {
    let inputData = {
        collectionID: '2',
        gameName: 'Super Mario',
        yearReleased: 1993,
        genre: 'Action-Adventure',
        console: 'Nintendo 64',
        developer: 'Nintendo'
    };
    let userData = {
        userID: 'erikchaulk',
    };
    let gameID = '987654';
    let testGame = new gameObject.Game(gameID, userData.userID, inputData.gameName, inputData.yearReleased, inputData.genre, inputData.console, inputData.developer, inputData.collectionID);
    testGame.priceMonitorData = [];
    let response = await collectionManager.modifyGameInCollection(testGame);
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
    };
    let userData = {
        userID: 'erikchaulk',
    };
    let gameID = '331122';
    let testGame = new gameObject.Game(gameID, userData.userID, inputData.gameName, inputData.yearReleased, inputData.genre, inputData.console, inputData.developer, inputData.collectionID);
    await expect(collectionManager.modifyGameInCollection(testGame))
        .rejects
        .toThrow("Game error, datastore response: Unable to modify game.  Unable to find game in collection.");
});
test("getGameInCollection", async () => {
    let inputData = {
        collectionID: '2',
        gameName: 'Super Mario',
        yearReleased: 1993,
        genre: 'Action-Adventure',
        console: 'Nintendo 64',
        developer: 'Nintendo'
    };
    let userData = {
        userID: 'erikchaulk',
    };
    let gameID = '987654';
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
    };
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
        collectionID: '2',
        gameName: 'Super Mario',
        yearReleased: 1993,
        genre: 'Action-Adventure',
        console: 'Nintendo 64',
        developer: 'Nintendo'
    };
    let userData = {
        userID: 'erikchaulk',
    };
    let gameID = '987654';
    let testGame = new gameObject.Game(gameID, userData.userID, inputData.gameName, inputData.yearReleased, inputData.genre, inputData.console, inputData.developer, inputData.collectionID);
    testGame.priceMonitorData = [];
    let testWishlist = new wishlist.Wishlist(userData.userID, inputData.collectionID);
    let response = await collectionManager.getAllGamesInCollection(testWishlist);
    expect(response).toEqual([testGame]);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZnVuY3Rpb25zLmNvbGxlY3Rpb24udGVzdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImZ1bmN0aW9ucy5jb2xsZWN0aW9uLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLE1BQU0sVUFBVSxHQUFHLE9BQU8sQ0FBQyxnQ0FBZ0MsQ0FBQyxDQUFDO0FBQzdELE1BQU0sUUFBUSxHQUFHLE9BQU8sQ0FBQyw4QkFBOEIsQ0FBQyxDQUFDO0FBQ3pELE1BQU0saUJBQWlCLEdBQUcsT0FBTyxDQUFDLDRDQUE0QyxDQUFDLENBQUM7QUFDaEYsTUFBTSxzQkFBc0IsR0FBRyxPQUFPLENBQUMsMkNBQTJDLENBQUMsQ0FBQztBQUNwRixNQUFNLFVBQVUsR0FBRyxPQUFPLENBQUMsMEJBQTBCLENBQUMsQ0FBQztBQUN2RCxNQUFNLE9BQU8sR0FBRyxPQUFPLENBQUMsc0NBQXNDLENBQUMsQ0FBQztBQUNoRSxNQUFNLGdCQUFnQixHQUFHLE9BQU8sQ0FBQyxtREFBbUQsQ0FBQyxDQUFDO0FBQ3RGLE1BQU0sYUFBYSxHQUFHLE9BQU8sQ0FBQyxtQ0FBbUMsQ0FBQyxDQUFDO0FBQ25FLE1BQU0sVUFBVSxHQUFHLE9BQU8sQ0FBQywyQ0FBMkMsQ0FBQyxDQUFDO0FBQ3hFLE1BQU0sWUFBWSxHQUFHLE9BQU8sQ0FBQywrQ0FBK0MsQ0FBQyxDQUFDO0FBQzlFLE1BQU0sVUFBVSxHQUFHLE9BQU8sQ0FBQyxpQ0FBaUMsQ0FBQyxDQUFDO0FBRTlELElBQUksQ0FBQyxzQkFBc0IsRUFBRSxLQUFLLElBQUksRUFBRTtJQUNwQyxJQUFJLFNBQVMsR0FBRztRQUNaLFlBQVksRUFBRSxHQUFHO1FBQ2pCLFFBQVEsRUFBRSxhQUFhO1FBQ3ZCLFlBQVksRUFBRSxJQUFJO1FBQ2xCLEtBQUssRUFBRSxrQkFBa0I7UUFDekIsT0FBTyxFQUFFLGFBQWE7UUFDdEIsU0FBUyxFQUFFLFVBQVU7S0FDeEIsQ0FBQTtJQUNELElBQUksUUFBUSxHQUFHO1FBQ1gsTUFBTSxF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QUMsUUFBUSxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQztBQUN6QyxDQUFDLENBQUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImNvbnN0IGNvbGxlY3Rpb24gPSByZXF1aXJlKFwiLi4vZnVuY3Rpb25zL21vZGVscy9jb2xsZWN0aW9uXCIpO1xuY29uc3Qgd2lzaGxpc3QgPSByZXF1aXJlKFwiLi4vZnVuY3Rpb25zL21vZGVscy93aXNobGlzdFwiKTtcbmNvbnN0IGNvbGxlY3Rpb25NYW5hZ2VyID0gcmVxdWlyZShcIi4uL2Z1bmN0aW9ucy9kYXRhTWFuYWdlci9jb2xsZWN0aW9uTWFuYWdlclwiKTtcbmNvbnN0IGNvbGxlY3Rpb25FcnJvckhhbmRsZXIgPSByZXF1aXJlKFwiLi4vZnVuY3Rpb25zL2Vycm9yL2NvbGxlY3Rpb25FcnJvckhhbmRsZXJcIik7XG5jb25zdCBnYW1lT2JqZWN0ID0gcmVxdWlyZShcIi4uL2Z1bmN0aW9ucy9tb2RlbHMvZ2FtZVwiKTtcbmNvbnN0IGdhbWVEQU8gPSByZXF1aXJlKFwiLi4vZnVuY3Rpb25zL2RhdGFNYW5hZ2VyL2dhbWVNYW5hZ2VyXCIpO1xuY29uc3QgcHJpY2VEYXRhTWFuYWdlciA9IHJlcXVpcmUoXCIuLi9mdW5jdGlvbnMvZGF0YU1hbmFnZXIvcHJpY2VDaGFydGluZ0RhdGFNYW5hZ2VyXCIpO1xuY29uc3QgZ2FtZVByaWNlRGF0YSA9IHJlcXVpcmUoXCIuLi9mdW5jdGlvbnMvbW9kZWxzL2dhbWVQcmljZURhdGFcIik7XG5jb25zdCBJbnRlcmZhY2VzID0gcmVxdWlyZShcIi4uL2Z1bmN0aW9ucy9zaGFyZWQvaW50ZXJmYWNlcy9pbnRlcmZhY2VzXCIpO1xuY29uc3QgZ2FtZVByaWNlREFPID0gcmVxdWlyZShcIi4uL2Z1bmN0aW9ucy9kYXRhTWFuYWdlci9nYW1lUHJpY2VEYXRhTWFuYWdlclwiKTtcbmNvbnN0IGdhbWVDb21tb24gPSByZXF1aXJlKFwiLi4vZnVuY3Rpb25zL3NoYXJlZC9jb21tb24vZ2FtZVwiKTtcblxudGVzdChcIkFkZCBHYW1lIHRvIFdpc2hsaXN0XCIsIGFzeW5jICgpID0+IHtcbiAgICBsZXQgaW5wdXREYXRhID0ge1xuICAgICAgICBjb2xsZWN0aW9uSUQ6ICcyJyxcbiAgICAgICAgZ2FtZU5hbWU6ICdTdXBlciBNYXJpbycsXG4gICAgICAgIHllYXJSZWxlYXNlZDogMTk5MixcbiAgICAgICAgZ2VucmU6ICdBY3Rpb24tQWR2ZW50dXJlJyxcbiAgICAgICAgY29uc29sZTogJ05pbnRlbmRvIDY0JyxcbiAgICAgICAgZGV2ZWxvcGVyOiAnTmludGVuZG8nXG4gICAgfVxuICAgIGxldCB1c2VyRGF0YSA9IHtcbiAgICAgICAgdXNlcklEOiAnZXJpa2NoYXVsaycsXG4gICAgfTtcbiAgICBsZXQgZ2FtZUlEID0gJzk4NzY1NCdcbiAgICBsZXQgdGVzdEdhbWUgPSBuZXcgZ2FtZU9iamVjdC5HYW1lKGdhbWVJRCwgdXNlckRhdGEudXNlcklELCBpbnB1dERhdGEuZ2FtZU5hbWUsIGlucHV0RGF0YS55ZWFyUmVsZWFzZWQsIGlucHV0RGF0YS5nZW5yZSwgaW5wdXREYXRhLmNvbnNvbGUsIGlucHV0RGF0YS5kZXZlbG9wZXIsIGlucHV0RGF0YS5jb2xsZWN0aW9uSUQpO1xuICAgIHRlc3RHYW1lLnByaWNlTW9uaXRvckRhdGEgPSBbXTtcbiAgICBsZXQgcmVzcG9uc2UgPSBhd2FpdCBjb2xsZWN0aW9uTWFuYWdlci5hZGRHYW1lVG9Db2xsZWN0aW9uKHRlc3RHYW1lKTtcbiAgICBleHBlY3QocmVzcG9uc2UpLnRvRXF1YWwoW3Rlc3RHYW1lXSk7XG59KTtcblxudGVzdChcIkFkZCBHYW1lIHRvIFdpc2hsaXN0IHRoYXQgYWxyZWFkeSBleGlzdHNcIiwgYXN5bmMgKCkgPT4ge1xuICAgIGxldCBpbnB1dERhdGEgPSB7XG4gICAgICAgIGNvbGxlY3Rpb25JRDogJzInLFxuICAgICAgICBnYW1lTmFtZTogJ1N1cGVyIE1hcmlvJyxcbiAgICAgICAgeWVhclJlbGVhc2VkOiAxOTkyLFxuICAgICAgICBnZW5yZTogJ0FjdGlvbi1BZHZlbnR1cmUnLFxuICAgICAgICBjb25zb2xlOiAnTmludGVuZG8gNjQnLFxuICAgICAgICBkZXZlbG9wZXI6ICdOaW50ZW5kbydcbiAgICB9XG4gICAgbGV0IHVzZXJEYXRhID0ge1xuICAgICAgICB1c2VySUQ6ICdlcmlrY2hhdWxrJyxcbiAgICB9O1xuICAgIGxldCBnYW1lSUQgPSAnOTg3NjU0J1xuICAgIGxldCB0ZXN0R2FtZSA9IG5ldyBnYW1lT2JqZWN0LkdhbWUoZ2FtZUlELCB1c2VyRGF0YS51c2VySUQsIGlucHV0RGF0YS5nYW1lTmFtZSwgaW5wdXREYXRhLnllYXJSZWxlYXNlZCwgaW5wdXREYXRhLmdlbnJlLCBpbnB1dERhdGEuY29uc29sZSwgaW5wdXREYXRhLmRldmVsb3BlciwgaW5wdXREYXRhLmNvbGxlY3Rpb25JRCk7XG4gICAgdGVzdEdhbWUucHJpY2VNb25pdG9yRGF0YSA9IFtdO1xuICAgIGF3YWl0IGV4cGVjdChjb2xsZWN0aW9uTWFuYWdlci5hZGRHYW1lVG9Db2xsZWN0aW9uKHRlc3RHYW1lKSlcbiAgICAucmVqZWN0c1xuICAgIC50b1Rocm93KFwiR2FtZSBlcnJvciwgZGF0YXN0b3JlIHJlc3BvbnNlOiBVbmFibGUgdG8gY3JlYXRlIGdhbWUuICBHYW1lIGFscmVhZHkgZXhpc3RzIGluIGNvbGxlY3Rpb24uXCIpXG59KTtcblxudGVzdChcInJlbW92ZUdhbWVGcm9tQ29sbGVjdGlvblwiLCBhc3luYyAoKSA9PiB7XG4gICAgbGV0IGlucHV0RGF0YSA9IHtcbiAgICAgICAgY29sbGVjdGlvbklEOiAnMicsXG4gICAgICAgIGdhbWVOYW1lOiAnU3VwZXIgTWFyaW8nLFxuICAgICAgICB5ZWFyUmVsZWFzZWQ6IDE5OTIsXG4gICAgICAgIGdlbnJlOiAnQWN0aW9uLUFkdmVudHVyZScsXG4gICAgICAgIGNvbnNvbGU6ICdOaW50ZW5kbyA2NCcsXG4gICAgICAgIGRldmVsb3BlcjogJ05pbnRlbmRvJ1xuICAgIH1cbiAgICBsZXQgaW5wdXREYXRhRm9yU2Vjb25kR2FtZSA9IHtcbiAgICAgICAgY29sbGVjdGlvbklEOiAnMicsXG4gICAgICAgIGdhbWVOYW1lOiAnT3ZlcndhdGNoJyxcbiAgICAgICAgeWVhclJlbGVhc2VkOiAyMDE2LFxuICAgICAgICBnZW5yZTogJ0ZpcnN0LVBlcnNvbiBTaG9vdGVyJyxcbiAgICAgICAgY29uc29sZTogJ1BDJyxcbiAgICAgICAgZGV2ZWxvcGVyOiAnQmxpenphcmQnXG4gICAgfVxuICAgIGxldCB1c2VyRGF0YSA9IHtcbiAgICAgICAgdXNlcklEOiAnZXJpa2NoYXVsaycsXG4gICAgfTtcbiAgICBsZXQgZ2FtZUlEID0gJzk4NzY1NCc7XG4gICAgbGV0IHNlY29uZEdhbWVJRCA9ICc2Njc3ODgnO1xuICAgIGxldCB0ZXN0R2FtZSA9IG5ldyBnYW1lT2JqZWN0LkdhbWUoZ2FtZUlELCB1c2VyRGF0YS51c2VySUQsIGlucHV0RGF0YS5nYW1lTmFtZSwgaW5wdXREYXRhLnllYXJSZWxlYXNlZCwgaW5wdXREYXRhLmdlbnJlLCBpbnB1dERhdGEuY29uc29sZSwgaW5wdXREYXRhLmRldmVsb3BlciwgaW5wdXREYXRhLmNvbGxlY3Rpb25JRCk7XG4gICAgbGV0IHNlY29uZFRlc3RHYW1lID0gbmV3IGdhbWVPYmplY3QuR2FtZShzZWNvbmRHYW1lSUQsIHVzZXJEYXRhLnVzZXJJRCwgaW5wdXREYXRhRm9yU2Vjb25kR2FtZS5nYW1lTmFtZSwgaW5wdXREYXRhRm9yU2Vjb25kR2FtZS55ZWFyUmVsZWFzZWQsIGlucHV0RGF0YUZvclNlY29uZEdhbWUuZ2VucmUsIGlucHV0RGF0YUZvclNlY29uZEdhbWUuY29uc29sZSwgaW5wdXREYXRhRm9yU2Vjb25kR2FtZS5kZXZlbG9wZXIsIGlucHV0RGF0YUZvclNlY29uZEdhbWUuY29sbGVjdGlvbklEKTtcbiAgICB0ZXN0R2FtZS5wcmljZU1vbml0b3JEYXRhID0gW11cbiAgICBzZWNvbmRUZXN0R2FtZS5wcmljZU1vbml0b3JEYXRhID0gW107XG4gICAgbGV0IGFkZFNlY29uZEdhbWVUb0NvbGxlY3Rpb24gPSBhd2FpdCBjb2xsZWN0aW9uTWFuYWdlci5hZGRHYW1lVG9Db2xsZWN0aW9uKHNlY29uZFRlc3RHYW1lKTtcbiAgICBsZXQgcmVzcG9uc2UgPSBhd2FpdCBjb2xsZWN0aW9uTWFuYWdlci5yZW1vdmVHYW1lRnJvbUNvbGxlY3Rpb24oc2Vjb25kVGVzdEdhbWUpO1xuICAgIGV4cGVjdChyZXNwb25zZSkudG9FcXVhbChbdGVzdEdhbWVdKTtcbn0pO1xuXG50ZXN0KFwiUmVtb3ZlIGEgZ2FtZSB0aGF0IGRvZXMgbm90IGV4aXN0IGluIGEgY29sbGVjdGlvbiAoaS5lLiBhdHRlbXB0IHRvIHJlbW92ZSBhIGdhbWUgdGhhdCB3YXMgYWxyZWFkeSByZW1vdmVkKVwiLCBhc3luYyAoKSA9PiB7XG4gICAgbGV0IGlucHV0RGF0YUZvclNlY29uZEdhbWUgPSB7XG4gICAgICAgIGNvbGxlY3Rpb25JRDogJzInLFxuICAgICAgICBnYW1lTmFtZTogJ092ZXJ3YXRjaCcsXG4gICAgICAgIHllYXJSZWxlYXNlZDogMjAxNixcbiAgICAgICAgZ2VucmU6ICdGaXJzdC1QZXJzb24gU2hvb3RlcicsXG4gICAgICAgIGNvbnNvbGU6ICdQQycsXG4gICAgICAgIGRldmVsb3BlcjogJ0JsaXp6YXJkJ1xuICAgIH1cbiAgICBsZXQgdXNlckRhdGEgPSB7XG4gICAgICAgIHVzZXJJRDogJ2VyaWtjaGF1bGsnLFxuICAgIH07XG4gICAgbGV0IHNlY29uZEdhbWVJRCA9ICc2Njc3ODgnO1xuICAgIGxldCBzZWNvbmRUZXN0R2FtZSA9IG5ldyBnYW1lT2JqZWN0LkdhbWUoc2Vjb25kR2FtZUlELCB1c2VyRGF0YS51c2VySUQsIGlucHV0RGF0YUZvclNlY29uZEdhbWUuZ2FtZU5hbWUsIGlucHV0RGF0YUZvclNlY29uZEdhbWUueWVhclJlbGVhc2VkLCBpbnB1dERhdGFGb3JTZWNvbmRHYW1lLmdlbnJlLCBpbnB1dERhdGFGb3JTZWNvbmRHYW1lLmNvbnNvbGUsIGlucHV0RGF0YUZvclNlY29uZEdhbWUuZGV2ZWxvcGVyLCBpbnB1dERhdGFGb3JTZWNvbmRHYW1lLmNvbGxlY3Rpb25JRCk7XG4gICAgYXdhaXQgZXhwZWN0KGNvbGxlY3Rpb25NYW5hZ2VyLnJlbW92ZUdhbWVGcm9tQ29sbGVjdGlvbihzZWNvbmRUZXN0R2FtZSkpXG4gICAgLnJlamVjdHNcbiAgICAudG9UaHJvdyhcIkdhbWUgZXJyb3IsIGRhdGFzdG9yZSByZXNwb25zZTogVW5hYmxlIHRvIGRlbGV0ZSBnYW1lLiAgVW5hYmxlIHRvIGZpbmQgZ2FtZSBpbiBjb2xsZWN0aW9uLlwiKVxufSk7XG5cbnRlc3QoXCJtb2RpZnlHYW1lSW5Db2xsZWN0aW9uXCIsIGFzeW5jICgpID0+IHtcbiAgICBsZXQgaW5wdXREYXRhID0ge1xuICAgICAgICBjb2xsZWN0aW9uSUQ6ICcyJyxcbiAgICAgICAgZ2FtZU5hbWU6ICdTdXBlciBNYXJpbycsXG4gICAgICAgIHllYXJSZWxlYXNlZDogMTk5MyxcbiAgICAgICAgZ2VucmU6ICdBY3Rpb24tQWR2ZW50dXJlJyxcbiAgICAgICAgY29uc29sZTogJ05pbnRlbmRvIDY0JyxcbiAgICAgICAgZGV2ZWxvcGVyOiAnTmludGVuZG8nXG4gICAgfVxuICAgIFxuICAgIGxldCB1c2VyRGF0YSA9IHtcbiAgICAgICAgdXNlcklEOiAnZXJpa2NoYXVsaycsXG4gICAgfTtcbiAgICBsZXQgZ2FtZUlEID0gJzk4NzY1NCdcbiAgICBsZXQgdGVzdEdhbWUgPSBuZXcgZ2FtZU9iamVjdC5HYW1lKGdhbWVJRCwgdXNlckRhdGEudXNlcklELCBpbnB1dERhdGEuZ2FtZU5hbWUsIGlucHV0RGF0YS55ZWFyUmVsZWFzZWQsIGlucHV0RGF0YS5nZW5yZSwgaW5wdXREYXRhLmNvbnNvbGUsIGlucHV0RGF0YS5kZXZlbG9wZXIsIGlucHV0RGF0YS5jb2xsZWN0aW9uSUQpO1xuICAgIHRlc3RHYW1lLnByaWNlTW9uaXRvckRhdGEgPSBbXTtcbiAgICBsZXQgcmVzcG9uc2UgPSBhd2FpdCBjb2xsZWN0aW9uTWFuYWdlci5tb2RpZnlHYW1lSW5Db2xsZWN0aW9uKHRlc3RHYW1lKTtcbiAgICBleHBlY3QocmVzcG9uc2UpLnRvRXF1YWwoW3Rlc3RHYW1lXSk7XG59KTtcblxudGVzdChcIk1vZGlmeSBhIGdhbWUgdGhhdCBkb2VzIG5vdCBleGlzdCBpbiB0aGUgY29sbGVjdGlvbi5cIiwgYXN5bmMgKCkgPT4ge1xuICAgIGxldCBpbnB1dERhdGEgPSB7XG4gICAgICAgIGNvbGxlY3Rpb25JRDogJzInLFxuICAgICAgICBnYW1lTmFtZTogJ1N1cGVyIFNtYXNoIEJyb3RoZXJzJyxcbiAgICAgICAgeWVhclJlbGVhc2VkOiAxOTkzLFxuICAgICAgICBnZW5yZTogJ0ZpZ2h0aW5nJyxcbiAgICAgICAgY29uc29sZTogJ05pbnRlbmRvIDY0JyxcbiAgICAgICAgZGV2ZWxvcGVyOiAnTmludGVuZG8nXG4gICAgfVxuICAgIFxuICAgIGxldCB1c2VyRGF0YSA9IHtcbiAgICAgICAgdXNlcklEOiAnZXJpa2NoYXVsaycsXG4gICAgfTtcbiAgICBsZXQgZ2FtZUlEID0gJzMzMTEyMidcbiAgICBsZXQgdGVzdEdhbWUgPSBuZXcgZ2FtZU9iamVjdC5HYW1lKGdhbWVJRCwgdXNlckRhdGEudXNlcklELCBpbnB1dERhdGEuZ2FtZU5hbWUsIGlucHV0RGF0YS55ZWFyUmVsZWFzZWQsIGlucHV0RGF0YS5nZW5yZSwgaW5wdXREYXRhLmNvbnNvbGUsIGlucHV0RGF0YS5kZXZlbG9wZXIsIGlucHV0RGF0YS5jb2xsZWN0aW9uSUQpO1xuICAgIGF3YWl0IGV4cGVjdChjb2xsZWN0aW9uTWFuYWdlci5tb2RpZnlHYW1lSW5Db2xsZWN0aW9uKHRlc3RHYW1lKSlcbiAgICAucmVqZWN0c1xuICAgIC50b1Rocm93KFwiR2FtZSBlcnJvciwgZGF0YXN0b3JlIHJlc3BvbnNlOiBVbmFibGUgdG8gbW9kaWZ5IGdhbWUuICBVbmFibGUgdG8gZmluZCBnYW1lIGluIGNvbGxlY3Rpb24uXCIpXG59KTtcblxudGVzdChcImdldEdhbWVJbkNvbGxlY3Rpb25cIiwgYXN5bmMgKCkgPT4ge1xuICAgIGxldCBpbnB1dERhdGEgPSB7XG4gICAgICAgIGNvbGxlY3Rpb25JRDogJzInLFxuICAgICAgICBnYW1lTmFtZTogJ1N1cGVyIE1hcmlvJyxcbiAgICAgICAgeWVhclJlbGVhc2VkOiAxOTkzLFxuICAgICAgICBnZW5yZTogJ0FjdGlvbi1BZHZlbnR1cmUnLFxuICAgICAgICBjb25zb2xlOiAnTmludGVuZG8gNjQnLFxuICAgICAgICBkZXZlbG9wZXI6ICdOaW50ZW5kbydcbiAgICB9XG4gICAgXG4gICAgbGV0IHVzZXJEYXRhID0ge1xuICAgICAgICB1c2VySUQ6ICdlcmlrY2hhdWxrJyxcbiAgICB9O1xuICAgIGxldCBnYW1lSUQgPSAnOTg3NjU0J1xuICAgIGxldCB0ZXN0R2FtZSA9IG5ldyBnYW1lT2JqZWN0LkdhbWUoZ2FtZUlELCB1c2VyRGF0YS51c2VySUQsIGlucHV0RGF0YS5nYW1lTmFtZSwgaW5wdXREYXRhLnllYXJSZWxlYXNlZCwgaW5wdXREYXRhLmdlbnJlLCBpbnB1dERhdGEuY29uc29sZSwgaW5wdXREYXRhLmRldmVsb3BlciwgaW5wdXREYXRhLmNvbGxlY3Rpb25JRCk7XG4gICAgbGV0IHJlc3BvbnNlID0gYXdhaXQgY29sbGVjdGlvbk1hbmFnZXIuZ2V0R2FtZUluQ29sbGVjdGlvbih0ZXN0R2FtZSk7XG4gICAgZXhwZWN0KHJlc3BvbnNlKS50b0VxdWFsKHRlc3RHYW1lKTtcbn0pO1xuXG50ZXN0KFwiQXR0ZW1wdCB0byBnZXQgYSBnYW1lIHRoYXQgZG9lc24ndCBleGlzdCBpbiB0aGUgY29sbGVjdGlvblwiLCBhc3luYyAoKSA9PiB7XG4gICAgbGV0IGlucHV0RGF0YSA9IHtcbiAgICAgICAgY29sbGVjdGlvbklEOiAnMScsXG4gICAgICAgIGdhbWVOYW1lOiAnU3VwZXIgTWFyaW8nLFxuICAgICAgICB5ZWFyUmVsZWFzZWQ6IDE5OTMsXG4gICAgICAgIGdlbnJlOiAnQWN0aW9uLUFkdmVudHVyZScsXG4gICAgICAgIGNvbnNvbGU6ICdOaW50ZW5kbyA2NCcsXG4gICAgICAgIGRldmVsb3BlcjogJ05pbnRlbmRvJ1xuICAgIH1cbiAgICBcbiAgICBsZXQgdXNlckRhdGEgPSB7XG4gICAgICAgIHVzZXJJRDogJ2VyaWtjaGF1bGsnLFxuICAgIH07XG4gICAgLy9UaGUgZ2FtZSBJRCBpcyB0aGUgb25seSBkaWZmZXJlbnQgYXR0cmlidXRlLCB3aGljaCBjYXVzZXMgaXQgdG8gbm90IGJlIGZvdW5kIGFuZCB0aHJvdyBhbiBlcnJvci5cbiAgICBsZXQgZ2FtZUlEID0gJzAwOTk4OCc7XG4gICAgbGV0IHRlc3RHYW1lID0gbmV3IGdhbWVPYmplY3QuR2FtZShnYW1lSUQsIHVzZXJEYXRhLnVzZXJJRCwgaW5wdXREYXRhLmdhbWVOYW1lLCBpbnB1dERhdGEueWVhclJlbGVhc2VkLCBpbnB1dERhdGEuZ2VucmUsIGlucHV0RGF0YS5jb25zb2xlLCBpbnB1dERhdGEuZGV2ZWxvcGVyLCBpbnB1dERhdGEuY29sbGVjdGlvbklEKTtcbiAgICBhd2FpdCBleHBlY3QoY29sbGVjdGlvbk1hbmFnZXIuZ2V0R2FtZUluQ29sbGVjdGlvbih0ZXN0R2FtZSkpXG4gICAgLnJlamVjdHNcbiAgICAudG9UaHJvdyhcIkdhbWUgZXJyb3IsIGRhdGFzdG9yZSByZXNwb25zZTogVW5hYmxlIHRvIGdldCBnYW1lLiBHYW1lIG5vdCBmb3VuZC5cIik7XG59KTtcblxudGVzdChcImNvbGxlY3Rpb25FcnJvclwiLCBhc3luYyAoKSA9PiB7XG4gICAgbGV0IGNvbGxlY3Rpb25FcnJvciA9IG5ldyBjb2xsZWN0aW9uRXJyb3JIYW5kbGVyLkNvbGxlY3Rpb25FcnJvcihcIkdhbWUgbm90IGZvdW5kIGluIHRoZSBjb2xsZWN0aW9uLlwiKTtcbiAgICBleHBlY3QoY29sbGVjdGlvbkVycm9yLm1lc3NhZ2UpLnRvRXF1YWwoJ0NvbGxlY3Rpb24gZXJyb3IsIGRhdGFzdG9yZSByZXNwb25zZTogR2FtZSBub3QgZm91bmQgaW4gdGhlIGNvbGxlY3Rpb24uJyk7XG59KTtcblxudGVzdChcImdldEFsbEdhbWVzSW5Db2xsZWN0aW9uXCIsIGFzeW5jICgpID0+IHtcbiAgICBsZXQgaW5wdXREYXRhID0ge1xuICAgICAgICBjb2xsZWN0aW9uSUQ6ICcyJyxcbiAgICAgICAgZ2FtZU5hbWU6ICdTdXBlciBNYXJpbycsXG4gICAgICAgIHllYXJSZWxlYXNlZDogMTk5MyxcbiAgICAgICAgZ2VucmU6ICdBY3Rpb24tQWR2ZW50dXJlJyxcbiAgICAgICAgY29uc29sZTogJ05pbnRlbmRvIDY0JyxcbiAgICAgICAgZGV2ZWxvcGVyOiAnTmludGVuZG8nXG4gICAgfVxuICAgIFxuICAgIGxldCB1c2VyRGF0YSA9IHtcbiAgICAgICAgdXNlcklEOiAnZXJpa2NoYXVsaycsXG4gICAgfTtcbiAgICBsZXQgZ2FtZUlEID0gJzk4NzY1NCdcbiAgICBsZXQgdGVzdEdhbWUgPSBuZXcgZ2FtZU9iamVjdC5HYW1lKGdhbWVJRCwgdXNlckRhdGEudXNlcklELCBpbnB1dERhdGEuZ2FtZU5hbWUsIGlucHV0RGF0YS55ZWFyUmVsZWFzZWQsIGlucHV0RGF0YS5nZW5yZSwgaW5wdXREYXRhLmNvbnNvbGUsIGlucHV0RGF0YS5kZXZlbG9wZXIsIGlucHV0RGF0YS5jb2xsZWN0aW9uSUQpO1xuICAgIHRlc3RHYW1lLnByaWNlTW9uaXRvckRhdGEgPSBbXTtcbiAgICBsZXQgdGVzdFdpc2hsaXN0ID0gbmV3IHdpc2hsaXN0Lldpc2hsaXN0KHVzZXJEYXRhLnVzZXJJRCwgaW5wdXREYXRhLmNvbGxlY3Rpb25JRCk7XG4gICAgbGV0IHJlc3BvbnNlID0gYXdhaXQgY29sbGVjdGlvbk1hbmFnZXIuZ2V0QWxsR2FtZXNJbkNvbGxlY3Rpb24odGVzdFdpc2hsaXN0KTtcbiAgICBleHBlY3QocmVzcG9uc2UpLnRvRXF1YWwoW3Rlc3RHYW1lXSk7XG59KTsiXX0=