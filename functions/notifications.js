"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Collections = require("./dataManager/collectionManager");
const collectionErrorHandler_1 = require("./error/collectionErrorHandler");
const gamePriceErrorHandler_1 = require("./error/gamePriceErrorHandler");
const httpResponse_1 = require("./shared/common/httpResponse");
const Common = require("./shared/common/collection");
const gamePriceMonitor_1 = require("./dataManager/gamePriceMonitor");
const userManager_1 = require("./dataManager/userManager");
exports.handler = async (event, context, callback) => {
    try {
        let totalWishlistItems = await Collections.getAllGamesByCollectionType('Wishlist');
        for (let game of totalWishlistItems) {
            let gamePriceMonitors = await (0, gamePriceMonitor_1.getAllPriceMonitorsForGame)(game);
            let user = await (0, userManager_1.getUser)(game.userID);
            for (let gamePriceMonitor of gamePriceMonitors) {
                let gamePriceData = await Common.getLatestPriceData(gamePriceMonitor);
                if (gamePriceData.desiredPriceExists)
                    await Common.sendRunningPriceNotification(game, gamePriceData, user);
            }
        }
        ;
        return (0, httpResponse_1.httpResponse)({ statusCode: 200, body: JSON.stringify("Wishlist Notification Emails Sent Successfully!") });
    }
    catch (err) {
        if (err instanceof collectionErrorHandler_1.CollectionError) {
            return (0, httpResponse_1.httpResponse)({ statusCode: 400, body: 'Unable to send Wishlist notifications' });
        }
        else if (err instanceof gamePriceErrorHandler_1.GamePriceError) {
            return (0, httpResponse_1.httpResponse)({ statusCode: 400, body: 'Error retrieving game price data' });
        }
        else {
            return (0, httpResponse_1.httpResponse)({ statusCode: err.statusCode, body: err.message });
        }
    }
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm90aWZpY2F0aW9ucy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIm5vdGlmaWNhdGlvbnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSwrREFBOEQ7QUFDOUQsMkVBQWlFO0FBQ2pFLHlFQUErRDtBQUMvRCwrREFBNEQ7QUFDNUQscURBQXFEO0FBQ3JELHFFQUE0RTtBQUM1RSwyREFBb0Q7QUFFcEQsT0FBTyxDQUFDLE9BQU8sR0FBRyxLQUFLLEVBQUUsS0FBVSxFQUFFLE9BQVksRUFBRSxRQUFhLEVBQUUsRUFBRTtJQUNoRSxJQUFJO1FBQ0EsSUFBSSxrQkFBa0IsR0FBRyxNQUFNLFdBQVcsQ0FBQywyQkFBMkIsQ0FBQyxVQUFVLENBQUMsQ0FBQztRQUNuRixLQUFLLElBQUksSUFBSSxJQUFJLGtCQUFrQixFQUFFO1lBQ25DLElBQUksaUJBQWlCLEdBQUcsTUFBTSxJQUFBLDZDQUEwQixFQUFDLElBQUksQ0FBQyxDQUFDO1lBQy9ELElBQUksSUFBSSxHQUFHLE1BQU0sSUFBQSxxQkFBTyxFQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUN0QyxLQUFLLElBQUksZ0JBQWdCLElBQUksaUJBQWlCLEVBQUU7Z0JBQzlDLElBQUksYUFBYSxHQUFHLE1BQU0sTUFBTSxDQUFDLGtCQUFrQixDQUFDLGdCQUFnQixDQUFDLENBQUM7Z0JBQ3RFLElBQUksYUFBYSxDQUFDLGtCQUFrQjtvQkFDbEMsTUFBTSxNQUFNLENBQUMsNEJBQTRCLENBQUMsSUFBSSxFQUFFLGFBQWEsRUFBRSxJQUFJLENBQUMsQ0FBQzthQUN4RTtTQUNGO1FBQUEsQ0FBQztRQUNGLE9BQU8sSUFBQSwyQkFBWSxFQUFDLEVBQUMsVUFBVSxFQUFFLEdBQUcsRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxpREFBaUQsQ0FBQyxFQUFDLENBQUMsQ0FBQztLQUNuSDtJQUFDLE9BQU8sR0FBUSxFQUFFO1FBQ2YsSUFBSSxHQUFHLFlBQVksd0NBQWUsRUFBRTtZQUNsQyxPQUFPLElBQUEsMkJBQVksRUFBQyxFQUFDLFVBQVUsRUFBRSxHQUFHLEVBQUUsSUFBSSxFQUFFLHVDQUF1QyxFQUFDLENBQUMsQ0FBQztTQUN2RjthQUFNLElBQUksR0FBRyxZQUFZLHNDQUFjLEVBQUU7WUFDeEMsT0FBTyxJQUFBLDJCQUFZLEVBQUMsRUFBQyxVQUFVLEVBQUUsR0FBRyxFQUFFLElBQUksRUFBRSxrQ0FBa0MsRUFBQyxDQUFDLENBQUM7U0FDbEY7YUFBTTtZQUNMLE9BQU8sSUFBQSwyQkFBWSxFQUFDLEVBQUMsVUFBVSxFQUFFLEdBQUcsQ0FBQyxVQUFVLEVBQUUsSUFBSSxFQUFFLEdBQUcsQ0FBQyxPQUFPLEVBQUMsQ0FBQyxDQUFDO1NBQ3RFO0tBQ0o7QUFDTCxDQUFDLENBQUEiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBDb2xsZWN0aW9ucyBmcm9tIFwiLi9kYXRhTWFuYWdlci9jb2xsZWN0aW9uTWFuYWdlclwiXG5pbXBvcnQgeyBDb2xsZWN0aW9uRXJyb3IgfSBmcm9tIFwiLi9lcnJvci9jb2xsZWN0aW9uRXJyb3JIYW5kbGVyXCI7XG5pbXBvcnQgeyBHYW1lUHJpY2VFcnJvciB9IGZyb20gXCIuL2Vycm9yL2dhbWVQcmljZUVycm9ySGFuZGxlclwiO1xuaW1wb3J0IHsgaHR0cFJlc3BvbnNlIH0gZnJvbSBcIi4vc2hhcmVkL2NvbW1vbi9odHRwUmVzcG9uc2VcIjtcbmltcG9ydCAqIGFzIENvbW1vbiBmcm9tIFwiLi9zaGFyZWQvY29tbW9uL2NvbGxlY3Rpb25cIjtcbmltcG9ydCB7IGdldEFsbFByaWNlTW9uaXRvcnNGb3JHYW1lIH0gZnJvbSBcIi4vZGF0YU1hbmFnZXIvZ2FtZVByaWNlTW9uaXRvclwiO1xuaW1wb3J0IHsgZ2V0VXNlciB9IGZyb20gXCIuL2RhdGFNYW5hZ2VyL3VzZXJNYW5hZ2VyXCI7XG5cbmV4cG9ydHMuaGFuZGxlciA9IGFzeW5jIChldmVudDogYW55LCBjb250ZXh0OiBhbnksIGNhbGxiYWNrOiBhbnkpID0+IHtcbiAgICB0cnkge1xuICAgICAgICBsZXQgdG90YWxXaXNobGlzdEl0ZW1zID0gYXdhaXQgQ29sbGVjdGlvbnMuZ2V0QWxsR2FtZXNCeUNvbGxlY3Rpb25UeXBlKCdXaXNobGlzdCcpO1xuICAgICAgICBmb3IgKGxldCBnYW1lIG9mIHRvdGFsV2lzaGxpc3RJdGVtcykge1xuICAgICAgICAgIGxldCBnYW1lUHJpY2VNb25pdG9ycyA9IGF3YWl0IGdldEFsbFByaWNlTW9uaXRvcnNGb3JHYW1lKGdhbWUpO1xuICAgICAgICAgIGxldCB1c2VyID0gYXdhaXQgZ2V0VXNlcihnYW1lLnVzZXJJRCk7XG4gICAgICAgICAgZm9yIChsZXQgZ2FtZVByaWNlTW9uaXRvciBvZiBnYW1lUHJpY2VNb25pdG9ycykge1xuICAgICAgICAgICAgbGV0IGdhbWVQcmljZURhdGEgPSBhd2FpdCBDb21tb24uZ2V0TGF0ZXN0UHJpY2VEYXRhKGdhbWVQcmljZU1vbml0b3IpO1xuICAgICAgICAgICAgaWYgKGdhbWVQcmljZURhdGEuZGVzaXJlZFByaWNlRXhpc3RzKSAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgIGF3YWl0IENvbW1vbi5zZW5kUnVubmluZ1ByaWNlTm90aWZpY2F0aW9uKGdhbWUsIGdhbWVQcmljZURhdGEsIHVzZXIpO1xuICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIGh0dHBSZXNwb25zZSh7c3RhdHVzQ29kZTogMjAwLCBib2R5OiBKU09OLnN0cmluZ2lmeShcIldpc2hsaXN0IE5vdGlmaWNhdGlvbiBFbWFpbHMgU2VudCBTdWNjZXNzZnVsbHkhXCIpfSk7XG4gICAgfSBjYXRjaCAoZXJyOiBhbnkpIHtcbiAgICAgICAgaWYgKGVyciBpbnN0YW5jZW9mIENvbGxlY3Rpb25FcnJvcikge1xuICAgICAgICAgIHJldHVybiBodHRwUmVzcG9uc2Uoe3N0YXR1c0NvZGU6IDQwMCwgYm9keTogJ1VuYWJsZSB0byBzZW5kIFdpc2hsaXN0IG5vdGlmaWNhdGlvbnMnfSk7XG4gICAgICAgIH0gZWxzZSBpZiAoZXJyIGluc3RhbmNlb2YgR2FtZVByaWNlRXJyb3IpIHtcbiAgICAgICAgICByZXR1cm4gaHR0cFJlc3BvbnNlKHtzdGF0dXNDb2RlOiA0MDAsIGJvZHk6ICdFcnJvciByZXRyaWV2aW5nIGdhbWUgcHJpY2UgZGF0YSd9KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gaHR0cFJlc3BvbnNlKHtzdGF0dXNDb2RlOiBlcnIuc3RhdHVzQ29kZSwgYm9keTogZXJyLm1lc3NhZ2V9KTsgICAgXG4gICAgICAgIH1cbiAgICB9XG59Il19