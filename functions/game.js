"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Game = void 0;
class Game {
    //Constructor 
    constructor(userID, sortKey, gameName, yearReleased, genre, console, developer) {
        this.partitionKey = `[User]#[${userID}]`,
            this.sortKey = sortKey,
            this.gameName = gameName,
            this.yearReleased = yearReleased,
            this.genre = genre,
            this.console = console,
            this.developer = developer;
    }
}
exports.Game = Game;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2FtZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImdhbWUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsTUFBYSxJQUFJO0lBVWIsY0FBYztJQUNkLFlBQVksTUFBYSxFQUFFLE9BQWMsRUFBRSxRQUFlLEVBQUUsWUFBb0IsRUFBRSxLQUFhLEVBQUUsT0FBZSxFQUFFLFNBQWlCO1FBQ2hJLElBQUksQ0FBQyxZQUFZLEdBQUcsV0FBVyxNQUFNLEdBQUc7WUFDeEMsSUFBSSxDQUFDLE9BQU8sR0FBRyxPQUFPO1lBQ3RCLElBQUksQ0FBQyxRQUFRLEdBQUcsUUFBUTtZQUN4QixJQUFJLENBQUMsWUFBWSxHQUFHLFlBQVk7WUFDaEMsSUFBSSxDQUFDLEtBQUssR0FBRyxLQUFLO1lBQ2xCLElBQUksQ0FBQyxPQUFPLEdBQUcsT0FBTztZQUN0QixJQUFJLENBQUMsU0FBUyxHQUFHLFNBQVMsQ0FBQTtJQUM3QixDQUFDO0NBQ0g7QUFwQkYsb0JBb0JFIiwic291cmNlc0NvbnRlbnQiOlsiZXhwb3J0IGNsYXNzIEdhbWUgeyBcclxuICAgIC8vRmllbGRzIFxyXG4gICAgcGFydGl0aW9uS2V5OiBzdHJpbmc7XHJcbiAgICBzb3J0S2V5OiBzdHJpbmc7XHJcbiAgICBnYW1lTmFtZTogc3RyaW5nOyAgICAgICAgIFxyXG4gICAgeWVhclJlbGVhc2VkPzogbnVtYmVyO1xyXG4gICAgZ2VucmU/OiBzdHJpbmc7XHJcbiAgICBjb25zb2xlPzogc3RyaW5nO1xyXG4gICAgZGV2ZWxvcGVyPzogc3RyaW5nO1xyXG4gIFxyXG4gICAgLy9Db25zdHJ1Y3RvciBcclxuICAgIGNvbnN0cnVjdG9yKHVzZXJJRDpzdHJpbmcsIHNvcnRLZXk6c3RyaW5nLCBnYW1lTmFtZTpzdHJpbmcsIHllYXJSZWxlYXNlZD86bnVtYmVyLCBnZW5yZT86c3RyaW5nLCBjb25zb2xlPzpzdHJpbmcsIGRldmVsb3Blcj86c3RyaW5nKSB7IFxyXG4gICAgICAgdGhpcy5wYXJ0aXRpb25LZXkgPSBgW1VzZXJdI1ske3VzZXJJRH1dYCxcclxuICAgICAgIHRoaXMuc29ydEtleSA9IHNvcnRLZXksXHJcbiAgICAgICB0aGlzLmdhbWVOYW1lID0gZ2FtZU5hbWUsXHJcbiAgICAgICB0aGlzLnllYXJSZWxlYXNlZCA9IHllYXJSZWxlYXNlZCxcclxuICAgICAgIHRoaXMuZ2VucmUgPSBnZW5yZSxcclxuICAgICAgIHRoaXMuY29uc29sZSA9IGNvbnNvbGUsXHJcbiAgICAgICB0aGlzLmRldmVsb3BlciA9IGRldmVsb3BlclxyXG4gICAgfVxyXG4gfSJdfQ==