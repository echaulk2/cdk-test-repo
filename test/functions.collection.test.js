"use strict";
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
}); /*

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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZnVuY3Rpb25zLmNvbGxlY3Rpb24udGVzdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImZ1bmN0aW9ucy5jb2xsZWN0aW9uLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLE1BQU0sVUFBVSxHQUFHLE9BQU8sQ0FBQyx5QkFBeUIsQ0FBQyxDQUFDO0FBQ3RELE1BQU0saUJBQWlCLEdBQUcsT0FBTyxDQUFDLGdDQUFnQyxDQUFDLENBQUM7QUFDcEUsTUFBTSxzQkFBc0IsR0FBRyxPQUFPLENBQUMscUNBQXFDLENBQUMsQ0FBQztBQUM5RSxNQUFNLFVBQVUsR0FBRyxPQUFPLENBQUMsbUJBQW1CLENBQUMsQ0FBQztBQUNoRCxNQUFNLE9BQU8sR0FBRyxPQUFPLENBQUMsMEJBQTBCLENBQUMsQ0FBQztBQUVwRCxJQUFJLENBQUMsa0JBQWtCLEVBQUUsS0FBSyxJQUFJLEVBQUU7SUFDaEMsSUFBSSxRQUFRLEdBQUcsSUFBSSxVQUFVLENBQUMsSUFBSSxDQUFDLHFCQUFxQixFQUFFLG9EQUFvRCxFQUFFLFdBQVcsRUFBRSxJQUFJLEVBQUUsc0JBQXNCLEVBQUUsSUFBSSxFQUFFLFVBQVUsRUFBRSxHQUFHLENBQUMsQ0FBQztJQUNsTCxJQUFJLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQ3ZCLElBQUksUUFBUSxHQUFHLE1BQU0sT0FBTyxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUM3QyxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0FBQ2xDLENBQUMsQ0FBQyxDQUFDLENBQUE7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O01Bd0RHIiwic291cmNlc0NvbnRlbnQiOlsiY29uc3QgY29sbGVjdGlvbiA9IHJlcXVpcmUoXCIuLi9mdW5jdGlvbnMvY29sbGVjdGlvblwiKTtcclxuY29uc3QgY29sbGVjdGlvbk1hbmFnZXIgPSByZXF1aXJlKFwiLi4vZnVuY3Rpb25zL2NvbGxlY3Rpb25NYW5hZ2VyXCIpO1xyXG5jb25zdCBjb2xsZWN0aW9uRXJyb3JIYW5kbGVyID0gcmVxdWlyZShcIi4uL2Z1bmN0aW9ucy9jb2xsZWN0aW9uRXJyb3JIYW5kbGVyXCIpO1xyXG5jb25zdCBnYW1lT2JqZWN0ID0gcmVxdWlyZShcIi4uL2Z1bmN0aW9ucy9nYW1lXCIpO1xyXG5jb25zdCBnYW1lREFPID0gcmVxdWlyZShcIi4uL2Z1bmN0aW9ucy9nYW1lTWFuYWdlclwiKTtcclxuXHJcbnRlc3QoXCJDcmVhdGVDb2xsZWN0aW9uXCIsIGFzeW5jICgpID0+IHtcclxuICAgIGxldCB0ZXN0R2FtZSA9IG5ldyBnYW1lT2JqZWN0LkdhbWUoYFtVU0VSXSNbZXJpa2NoYXVsa11gLCBgW0NPTExFQ1RJT05JVEVNXSNbV0lTSExJU1RdI1tHQU1FSVRFTV0jW092ZXJ3YXRjaF1gLCAnT3ZlcndhdGNoJywgMjAxNiwgJ0ZpcnN0LVBlcnNvbiBTaG9vdGVyJywgJ1BDJywgJ0JsaXp6YXJkJywgMTAwKTtcclxuICAgIGplc3Quc2V0VGltZW91dCgzMDAwMCk7XHJcbiAgICBsZXQgcmVzcG9uc2UgPSBhd2FpdCBnYW1lREFPLmdhbWVQcmljZSg2LjgxKTtcclxuICAgIGV4cGVjdChyZXNwb25zZSkudG9FcXVhbCgxMDApO1xyXG59KTsvKiBcclxuXHJcbnRlc3QoXCJhZGRHYW1lXCIsIGFzeW5jICgpID0+IHtcclxuICAgIGxldCB0ZXN0R2FtZSA9IG5ldyBnYW1lT2JqZWN0LkdhbWUoJ2VyaWtjaGF1bGsnLCAnTGVhZ3VlIG9mIExlZ2VuZHMnLCAyMDA4LCAnTW9iYScsICdQQycsICdSaW90IEdhbWVzJyk7XHJcbiAgICBsZXQgdGVzdENvbGxlY3Rpb24gPSBuZXcgY29sbGVjdGlvbi5Db2xsZWN0aW9uKCdlcmlrY2hhdWxrJywnd2lzaGxpc3QnKTtcclxuICAgIHRlc3RDb2xsZWN0aW9uLmFkZEdhbWUodGVzdEdhbWUpO1xyXG4gICAgZXhwZWN0KHRlc3RDb2xsZWN0aW9uLmdhbWVzKS50b0VxdWFsKFt0ZXN0R2FtZV0pO1xyXG59KTtcclxuXHJcbnRlc3QoXCJpc0dhbWVJbkNvbGxlY3Rpb25cIiwgYXN5bmMgKCkgPT4ge1xyXG4gICAgbGV0IHRlc3RHYW1lID0gbmV3IGdhbWVPYmplY3QuR2FtZSgnZXJpa2NoYXVsaycsICdMZWFndWUgb2YgTGVnZW5kcycsIDIwMDgsICdNb2JhJywgJ1BDJywgJ1Jpb3QgR2FtZXMnKTtcclxuICAgIGxldCB0ZXN0Q29sbGVjdGlvbiA9IG5ldyBjb2xsZWN0aW9uLkNvbGxlY3Rpb24oJ2VyaWtjaGF1bGsnLCd3aXNobGlzdCcpO1xyXG4gICAgdGVzdENvbGxlY3Rpb24uYWRkR2FtZSh0ZXN0R2FtZSk7XHJcbiAgICBsZXQgY29uZGl0aW9uID0gdGVzdENvbGxlY3Rpb24uaXNHYW1lSW5Db2xsZWN0aW9uKHRlc3RHYW1lKTtcclxuICAgIGV4cGVjdChjb25kaXRpb24pLnRvRXF1YWwodHJ1ZSk7XHJcbn0pO1xyXG5cclxudGVzdChcInJlbW92ZUdhbWVcIiwgYXN5bmMgKCkgPT4ge1xyXG4gICAgbGV0IG5ld0dhbWUgPSBuZXcgZ2FtZU9iamVjdC5HYW1lKCdGdW5reUJ1dExvdmluZycsICdMZWFndWUgb2YgTGVnZW5kcycsIDIwMDgsICdNb2JhJywgJ1BDJywgJ1Jpb3QgR2FtZXMnKTtcclxuICAgIGxldCBzb21lT3RoZXJHYW1lID0gbmV3IGdhbWVPYmplY3QuR2FtZSgnRnVua3lCdXRMb3ZpbmcnLCAnVGhlIFdpdG5lc3MnLCAyMDE2LCAnU3RyYXRlZ3knLCAnUEMnLCAnVmFsdmUnKTtcclxuICAgIGxldCB0ZXN0Q29sbGVjdGlvbiA9IG5ldyBjb2xsZWN0aW9uLkNvbGxlY3Rpb24oJ0Z1bmt5QnV0TG92aW5nJywnd2lzaGxpc3QnKTtcclxuICAgIHRlc3RDb2xsZWN0aW9uLmFkZEdhbWUobmV3R2FtZSk7XHJcbiAgICB0ZXN0Q29sbGVjdGlvbi5hZGRHYW1lKHNvbWVPdGhlckdhbWUpO1xyXG4gICAgdGVzdENvbGxlY3Rpb24ucmVtb3ZlR2FtZShzb21lT3RoZXJHYW1lKTsgICAgXHJcbiAgICBleHBlY3QodGVzdENvbGxlY3Rpb24uZ2FtZXMpLnRvRXF1YWwoW25ld0dhbWVdKTtcclxufSk7XHJcblxyXG50ZXN0KFwiZ2V0Q29sbGVjdGlvblwiLCBhc3luYyAoKSA9PiB7XHJcbiAgICBsZXQgbXlHYW1lID0gbmV3IGdhbWVPYmplY3QuR2FtZSgndGVzdFVzZXInLCAnTGVhZ3VlIG9mIExlZ2VuZHMnLCAyMDA4LCAnTW9iYScsICdQQycsICdSaW90IEdhbWVzJyk7XHJcbiAgICBsZXQgbXlPdGhlckdhbWUgPSBuZXcgZ2FtZU9iamVjdC5HYW1lKCd0ZXN0VXNlcicsICdNYWdpYzogVGhlIEdhdGhlcmluZycsIDIwMTYsICdTdHJhdGVneScsICdQQycsICdXaXphcmRzIG9mIHRoZSBDb2FzdCcpO1xyXG4gICAgbGV0IG15Q29sbGVjdGlvbiA9IG5ldyBjb2xsZWN0aW9uLkNvbGxlY3Rpb24oJ3Rlc3RVc2VyJywnd2lzaGxpc3QnLCBbbXlHYW1lLCBteU90aGVyR2FtZV0pO1xyXG4gICAgYXdhaXQgbXlDb2xsZWN0aW9uLmNyZWF0ZUNvbGxlY3Rpb24oKTtcclxuICAgIGxldCByZXNwb25zZSA9IGF3YWl0IGNvbGxlY3Rpb25NYW5hZ2VyLmdldENvbGxlY3Rpb24oJ3Rlc3RVc2VyJywgJ3dpc2hsaXN0Jyk7XHJcbiAgICBleHBlY3QocmVzcG9uc2UpLnRvRXF1YWwobXlDb2xsZWN0aW9uKTtcclxufSk7XHJcblxyXG50ZXN0KFwiYWRkR2FtZVRvQ29sbGVjdGlvblwiLCBhc3luYyAoKSA9PiB7XHJcbiAgICBsZXQgbXlOZXdHYW1lID0gbmV3IGdhbWVPYmplY3QuR2FtZSgnYU5ld1VzZXInLCAnSGFsZiBMaWZlIDInLCAyMDA0LCAnRmlyc3QtUGVyc29uIFNob290ZXInLCAnUEMnLCAnVmFsdmUnKTtcclxuICAgIGxldCBteU5ld0NvbGxlY3Rpb24gPSBuZXcgY29sbGVjdGlvbi5Db2xsZWN0aW9uKCdhTmV3VXNlcicsJ3dpc2hsaXN0Jyk7XHJcbiAgICBhd2FpdCBteU5ld0NvbGxlY3Rpb24uY3JlYXRlQ29sbGVjdGlvbigpO1xyXG4gICAgbGV0IHJlc3BvbnNlID0gYXdhaXQgY29sbGVjdGlvbk1hbmFnZXIuYWRkR2FtZVRvQ29sbGVjdGlvbihteU5ld0dhbWUsIG15TmV3Q29sbGVjdGlvbik7XHJcbiAgICBleHBlY3QocmVzcG9uc2UpLnRvRXF1YWwobXlOZXdDb2xsZWN0aW9uKTtcclxufSk7XHJcblxyXG50ZXN0KFwicmVtb3ZlR2FtZUZyb21Db2xsZWN0aW9uXCIsIGFzeW5jICgpID0+IHtcclxuICAgIGxldCB3YWxraW5nVGVzdGVyR2FtZSA9IG5ldyBnYW1lT2JqZWN0LkdhbWUoJ3dhbGtpbmdUZXN0ZXInLCAnSGFsZiBMaWZlIDInLCAyMDA0LCAnRmlyc3QtUGVyc29uIFNob290ZXInLCAnUEMnLCAnVmFsdmUnKTtcclxuICAgIGxldCB3YWxraW5nVGVzdGVyQ29sbGVjdGlvbiA9IG5ldyBjb2xsZWN0aW9uLkNvbGxlY3Rpb24oJ3dhbGtpbmdUZXN0ZXInLCd3aXNobGlzdCcsW3dhbGtpbmdUZXN0ZXJHYW1lXSk7XHJcbiAgICBhd2FpdCB3YWxraW5nVGVzdGVyQ29sbGVjdGlvbi5jcmVhdGVDb2xsZWN0aW9uKCk7XHJcbiAgICBsZXQgcmVzcG9uc2UgPSBhd2FpdCBjb2xsZWN0aW9uTWFuYWdlci5yZW1vdmVHYW1lRnJvbUNvbGxlY3Rpb24od2Fsa2luZ1Rlc3RlckdhbWUsIHdhbGtpbmdUZXN0ZXJDb2xsZWN0aW9uKTtcclxuICAgIGV4cGVjdChyZXNwb25zZSkudG9FcXVhbCh3YWxraW5nVGVzdGVyQ29sbGVjdGlvbik7XHJcbn0pO1xyXG5cclxudGVzdChcImNvbGxlY3Rpb25FcnJvclwiLCBhc3luYyAoKSA9PiB7XHJcbiAgICBsZXQgY29sbGVjdGlvbkVycm9yID0gbmV3IGNvbGxlY3Rpb25FcnJvckhhbmRsZXIuQ29sbGVjdGlvbkVycm9yKFwiR2FtZSBub3QgZm91bmQgaW4gdGhlIGNvbGxlY3Rpb24uXCIsIDQwNCk7XHJcbiAgICBleHBlY3QoY29sbGVjdGlvbkVycm9yLm1lc3NhZ2UpLnRvRXF1YWwoJ0NvbGxlY3Rpb24gZXJyb3IsIGRhdGFzdG9yZSByZXNwb25zZTogR2FtZSBub3QgZm91bmQgaW4gdGhlIGNvbGxlY3Rpb24uJyk7XHJcbiAgICBleHBlY3QoY29sbGVjdGlvbkVycm9yLnN0YXR1c0NvZGUpLnRvRXF1YWwoNDA0KTtcclxufSk7ICovIl19