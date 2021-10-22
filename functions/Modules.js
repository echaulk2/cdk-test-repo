"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListGames = exports.Game = void 0;
const AWS = require('aws-sdk');
const isTest = process.env.JEST_WORKER_ID;
const config = {
    convertEmptyValues: true,
    ...(isTest && {
        endpoint: 'localhost:8000',
        sslEnabled: false,
        region: 'local-env',
    }),
};
const docClient = new AWS.DynamoDB.DocumentClient(config);
const table = process.env.DYNAMO_DB_TABLE;
class Game {
    //Constructor 
    constructor(gameName, yearReleased, genre, console, developer) {
        this.gameName = gameName,
            this.yearReleased = yearReleased,
            this.genre = genre,
            this.console = console,
            this.developer = developer;
    }
    //Database CRUD Methods
    async GetGame() {
        let params = {
            TableName: table,
            Key: {
                gameName: this.gameName
            }
        };
        try {
            let response = await docClient.get(params).promise();
            return response;
        }
        catch (err) {
            return err;
        }
    }
    async CreateGame() {
        let params = {
            TableName: table,
            Item: {
                gameName: this.gameName,
                genre: this.genre,
                yearReleased: this.yearReleased,
                developer: this.developer,
                console: this.console
            },
            ConditionExpression: 'attribute_not_exists(gameName)'
        };
        try {
            await docClient.put(params).promise();
            let createdGame = this.GetGame();
            return createdGame;
        }
        catch (err) {
            return err;
        }
    }
    async ModifyGame() {
        let updateExpression = [];
        let expressionAttributeNames = {};
        let expressionAttributeValues = {};
        //Generate dynammic update expression based on allowed parameters
        for (let [key, value] of Object.entries(this)) {
            if (key != 'gameName' && value != undefined) {
                updateExpression.push(`#${key} = :${key}`);
                expressionAttributeNames['#' + key] = key;
                expressionAttributeValues[':' + key] = `${value}`;
            }
        }
        let params = {
            TableName: table,
            Key: {
                gameName: this.gameName
            },
            UpdateExpression: `SET ${updateExpression.join(",")}`,
            ExpressionAttributeNames: expressionAttributeNames,
            ExpressionAttributeValues: expressionAttributeValues,
            ConditionExpression: 'attribute_exists(gameName)',
            ReturnValues: 'ALL_NEW'
        };
        try {
            await docClient.update(params).promise();
            let modifiedGame = this.GetGame();
            return modifiedGame;
        }
        catch (err) {
            return err;
        }
    }
    async DeleteGame() {
        let params = {
            TableName: table,
            Key: {
                gameName: this.gameName
            },
            ReturnValues: 'ALL_OLD'
        };
        try {
            let response = await docClient.delete(params).promise();
            return response;
        }
        catch (err) {
            return err;
        }
    }
}
exports.Game = Game;
async function ListGames() {
    let params = {
        TableName: table,
        Select: "ALL_ATTRIBUTES"
    };
    try {
        let response = await docClient.scan(params).promise();
        return response;
    }
    catch (err) {
        return err;
    }
}
exports.ListGames = ListGames;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibW9kdWxlcy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIm1vZHVsZXMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsTUFBTSxHQUFHLEdBQUcsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDO0FBQy9CLE1BQU0sTUFBTSxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsY0FBYyxDQUFDO0FBQzFDLE1BQU0sTUFBTSxHQUFHO0lBQ2Isa0JBQWtCLEVBQUUsSUFBSTtJQUN4QixHQUFHLENBQUMsTUFBTSxJQUFJO1FBQ1osUUFBUSxFQUFFLGdCQUFnQjtRQUMxQixVQUFVLEVBQUUsS0FBSztRQUNqQixNQUFNLEVBQUUsV0FBVztLQUNwQixDQUFDO0NBQ0gsQ0FBQztBQUNGLE1BQU0sU0FBUyxHQUFHLElBQUksR0FBRyxDQUFDLFFBQVEsQ0FBQyxjQUFjLENBQUMsTUFBTSxDQUFDLENBQUM7QUFDMUQsTUFBTSxLQUFLLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxlQUFlLENBQUM7QUFFMUMsTUFBYSxJQUFJO0lBUWIsY0FBYztJQUNkLFlBQVksUUFBZSxFQUFFLFlBQW9CLEVBQUUsS0FBYSxFQUFFLE9BQWUsRUFBRSxTQUFpQjtRQUNqRyxJQUFJLENBQUMsUUFBUSxHQUFHLFFBQVE7WUFDeEIsSUFBSSxDQUFDLFlBQVksR0FBRyxZQUFZO1lBQ2hDLElBQUksQ0FBQyxLQUFLLEdBQUcsS0FBSztZQUNsQixJQUFJLENBQUMsT0FBTyxHQUFHLE9BQU87WUFDdEIsSUFBSSxDQUFDLFNBQVMsR0FBRyxTQUFTLENBQUE7SUFDN0IsQ0FBQztJQUVELHVCQUF1QjtJQUN2QixLQUFLLENBQUMsT0FBTztRQUNYLElBQUksTUFBTSxHQUFHO1lBQ1gsU0FBUyxFQUFFLEtBQUs7WUFDaEIsR0FBRyxFQUFFO2dCQUNILFFBQVEsRUFBRSxJQUFJLENBQUMsUUFBUTthQUN4QjtTQUNGLENBQUM7UUFDRixJQUFJO1lBQ0YsSUFBSSxRQUFRLEdBQUcsTUFBTSxTQUFT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LEdBQUcsQ0FBQztTQUNaO0lBQ0gsQ0FBQztDQUNIO0FBekdGLG9CQXlHRTtBQUVLLEtBQUssVUFBVSxTQUFTO0lBQzdCLElBQUksTUFBTSxHQUFHO1FBQ1gsU0FBUyxFQUFFLEtBQUs7UUFDaEIsTUFBTSxFQUFFLGdCQUFnQjtLQUN6QixDQUFDO0lBRUYsSUFBSTtRQUNELElBQUksUUFBUSxHQUFHLE1BQU0sU0FBUyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUN0RCxPQUFPLFFBQVEsQ0FBQztLQUNsQjtJQUFDLE9BQU8sR0FBRyxFQUFFO1FBQ1gsT0FBTyxHQUFHLENBQUM7S0FDYjtBQUNILENBQUM7QUFaRCw4QkFZQyIsInNvdXJjZXNDb250ZW50IjpbImNvbnN0IEFXUyA9IHJlcXVpcmUoJ2F3cy1zZGsnKTtcclxuY29uc3QgaXNUZXN0ID0gcHJvY2Vzcy5lbnYuSkVTVF9XT1JLRVJfSUQ7XHJcbmNvbnN0IGNvbmZpZyA9IHtcclxuICBjb252ZXJ0RW1wdHlWYWx1ZXM6IHRydWUsXHJcbiAgLi4uKGlzVGVzdCAmJiB7XHJcbiAgICBlbmRwb2ludDogJ2xvY2FsaG9zdDo4MDAwJyxcclxuICAgIHNzbEVuYWJsZWQ6IGZhbHNlLFxyXG4gICAgcmVnaW9uOiAnbG9jYWwtZW52JyxcclxuICB9KSxcclxufTtcclxuY29uc3QgZG9jQ2xpZW50ID0gbmV3IEFXUy5EeW5hbW9EQi5Eb2N1bWVudENsaWVudChjb25maWcpO1xyXG5jb25zdCB0YWJsZSA9IHByb2Nlc3MuZW52LkRZTkFNT19EQl9UQUJMRTtcclxuXHJcbmV4cG9ydCBjbGFzcyBHYW1lIHsgXHJcbiAgICAvL0ZpZWxkcyBcclxuICAgIGdhbWVOYW1lOiBzdHJpbmc7IFxyXG4gICAgeWVhclJlbGVhc2VkPzogbnVtYmVyO1xyXG4gICAgZ2VucmU/OiBzdHJpbmc7XHJcbiAgICBjb25zb2xlPzogc3RyaW5nO1xyXG4gICAgZGV2ZWxvcGVyPzogc3RyaW5nO1xyXG4gIFxyXG4gICAgLy9Db25zdHJ1Y3RvciBcclxuICAgIGNvbnN0cnVjdG9yKGdhbWVOYW1lOnN0cmluZywgeWVhclJlbGVhc2VkPzpudW1iZXIsIGdlbnJlPzpzdHJpbmcsIGNvbnNvbGU/OnN0cmluZywgZGV2ZWxvcGVyPzpzdHJpbmcpIHsgXHJcbiAgICAgICB0aGlzLmdhbWVOYW1lID0gZ2FtZU5hbWUsXHJcbiAgICAgICB0aGlzLnllYXJSZWxlYXNlZCA9IHllYXJSZWxlYXNlZCxcclxuICAgICAgIHRoaXMuZ2VucmUgPSBnZW5yZSxcclxuICAgICAgIHRoaXMuY29uc29sZSA9IGNvbnNvbGUsXHJcbiAgICAgICB0aGlzLmRldmVsb3BlciA9IGRldmVsb3BlclxyXG4gICAgfVxyXG4gICAgXHJcbiAgICAvL0RhdGFiYXNlIENSVUQgTWV0aG9kc1xyXG4gICAgYXN5bmMgR2V0R2FtZSgpIHtcclxuICAgICAgbGV0IHBhcmFtcyA9IHtcclxuICAgICAgICBUYWJsZU5hbWU6IHRhYmxlLFxyXG4gICAgICAgIEtleToge1xyXG4gICAgICAgICAgZ2FtZU5hbWU6IHRoaXMuZ2FtZU5hbWVcclxuICAgICAgICB9XHJcbiAgICAgIH07XHJcbiAgICAgIHRyeSB7XHJcbiAgICAgICAgbGV0IHJlc3BvbnNlID0gYXdhaXQgZG9jQ2xpZW50LmdldChwYXJhbXMpLnByb21pc2UoKTtcclxuICAgICAgICByZXR1cm4gcmVzcG9uc2U7XHJcbiAgICAgIH0gY2F0Y2ggKGVycikge1xyXG4gICAgICAgIHJldHVybiBlcnI7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBhc3luYyBDcmVhdGVHYW1lKCkge1xyXG4gICAgICBsZXQgcGFyYW1zID0ge1xyXG4gICAgICAgIFRhYmxlTmFtZTogdGFibGUsXHJcbiAgICAgICAgSXRlbToge1xyXG4gICAgICAgICAgZ2FtZU5hbWU6IHRoaXMuZ2FtZU5hbWUsXHJcbiAgICAgICAgICBnZW5yZTogdGhpcy5nZW5yZSxcclxuICAgICAgICAgIHllYXJSZWxlYXNlZDogdGhpcy55ZWFyUmVsZWFzZWQsXHJcbiAgICAgICAgICBkZXZlbG9wZXI6IHRoaXMuZGV2ZWxvcGVyLFxyXG4gICAgICAgICAgY29uc29sZTogdGhpcy5jb25zb2xlXHJcbiAgICAgICAgfSxcclxuICAgICAgICBDb25kaXRpb25FeHByZXNzaW9uOiAnYXR0cmlidXRlX25vdF9leGlzdHMoZ2FtZU5hbWUpJ1xyXG4gICAgICB9XHJcbiAgXHJcbiAgICAgIHRyeSB7XHJcbiAgICAgICAgYXdhaXQgZG9jQ2xpZW50LnB1dChwYXJhbXMpLnByb21pc2UoKTtcclxuICAgICAgICBsZXQgY3JlYXRlZEdhbWUgPSB0aGlzLkdldEdhbWUoKTtcclxuICAgICAgICByZXR1cm4gY3JlYXRlZEdhbWU7XHJcbiAgICAgIH0gY2F0Y2goZXJyKSB7XHJcbiAgICAgICAgcmV0dXJuIGVycjtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIFxyXG4gICAgYXN5bmMgTW9kaWZ5R2FtZSgpIHtcclxuICAgICAgbGV0IHVwZGF0ZUV4cHJlc3Npb246IFN0cmluZ1tdID0gW107XHJcbiAgICAgIGxldCBleHByZXNzaW9uQXR0cmlidXRlTmFtZXMgPSB7fSBhcyBhbnk7XHJcbiAgICAgIGxldCBleHByZXNzaW9uQXR0cmlidXRlVmFsdWVzID0ge30gYXMgYW55O1xyXG4gICAgICAvL0dlbmVyYXRlIGR5bmFtbWljIHVwZGF0ZSBleHByZXNzaW9uIGJhc2VkIG9uIGFsbG93ZWQgcGFyYW1ldGVyc1xyXG4gICAgICBmb3IgKGxldCBba2V5LCB2YWx1ZV0gb2YgT2JqZWN0LmVudHJpZXModGhpcykpIHtcclxuICAgICAgICBpZiAoa2V5ICE9ICdnYW1lTmFtZScgJiYgdmFsdWUgIT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICB1cGRhdGVFeHByZXNzaW9uLnB1c2goYCMke2tleX0gPSA6JHtrZXl9YCk7XHJcbiAgICAgICAgICBleHByZXNzaW9uQXR0cmlidXRlTmFtZXNbJyMnK2tleV0gPSBrZXkgO1xyXG4gICAgICAgICAgZXhwcmVzc2lvbkF0dHJpYnV0ZVZhbHVlc1snOicra2V5XT1gJHt2YWx1ZX1gOyAgXHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgXHJcbiAgICAgIGxldCBwYXJhbXMgPSB7XHJcbiAgICAgICAgVGFibGVOYW1lOiB0YWJsZSxcclxuICAgICAgICBLZXk6IHtcclxuICAgICAgICAgIGdhbWVOYW1lOiB0aGlzLmdhbWVOYW1lXHJcbiAgICAgICAgfSxcclxuICAgICAgICBVcGRhdGVFeHByZXNzaW9uOiBgU0VUICR7dXBkYXRlRXhwcmVzc2lvbi5qb2luKFwiLFwiKX1gLFxyXG4gICAgICAgIEV4cHJlc3Npb25BdHRyaWJ1dGVOYW1lczogZXhwcmVzc2lvbkF0dHJpYnV0ZU5hbWVzLFxyXG4gICAgICAgIEV4cHJlc3Npb25BdHRyaWJ1dGVWYWx1ZXM6IGV4cHJlc3Npb25BdHRyaWJ1dGVWYWx1ZXMsXHJcbiAgICAgICAgQ29uZGl0aW9uRXhwcmVzc2lvbjogJ2F0dHJpYnV0ZV9leGlzdHMoZ2FtZU5hbWUpJyxcclxuICAgICAgICBSZXR1cm5WYWx1ZXM6ICdBTExfTkVXJ1xyXG4gICAgICB9O1xyXG4gIFxyXG4gICAgICB0cnkge1xyXG4gICAgICAgIGF3YWl0IGRvY0NsaWVudC51cGRhdGUocGFyYW1zKS5wcm9taXNlKCk7XHJcbiAgICAgICAgbGV0IG1vZGlmaWVkR2FtZSA9IHRoaXMuR2V0R2FtZSgpO1xyXG4gICAgICAgIHJldHVybiBtb2RpZmllZEdhbWU7XHJcbiAgICAgIH0gY2F0Y2ggKGVycikge1xyXG4gICAgICAgIHJldHVybiBlcnI7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICBcclxuICAgIGFzeW5jIERlbGV0ZUdhbWUoKSB7XHJcbiAgICAgIGxldCBwYXJhbXMgPSB7XHJcbiAgICAgICAgVGFibGVOYW1lOiB0YWJsZSxcclxuICAgICAgICBLZXk6IHtcclxuICAgICAgICAgICAgZ2FtZU5hbWU6IHRoaXMuZ2FtZU5hbWVcclxuICAgICAgICB9LFxyXG4gICAgICAgIFJldHVyblZhbHVlczogJ0FMTF9PTEQnXHJcbiAgICAgIH07XHJcbiAgXHJcbiAgICAgIHRyeSB7XHJcbiAgICAgICAgbGV0IHJlc3BvbnNlID0gYXdhaXQgZG9jQ2xpZW50LmRlbGV0ZShwYXJhbXMpLnByb21pc2UoKTtcclxuICAgICAgICByZXR1cm4gcmVzcG9uc2U7XHJcbiAgICAgIH0gY2F0Y2ggKGVycikge1xyXG4gICAgICAgIHJldHVybiBlcnI7XHJcbiAgICAgIH1cclxuICAgIH1cclxuIH1cclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBMaXN0R2FtZXMoKSB7XHJcbiAgbGV0IHBhcmFtcyA9IHtcclxuICAgIFRhYmxlTmFtZTogdGFibGUsXHJcbiAgICBTZWxlY3Q6IFwiQUxMX0FUVFJJQlVURVNcIlxyXG4gIH07XHJcblxyXG4gIHRyeSB7XHJcbiAgICAgbGV0IHJlc3BvbnNlID0gYXdhaXQgZG9jQ2xpZW50LnNjYW4ocGFyYW1zKS5wcm9taXNlKCk7XHJcbiAgICAgcmV0dXJuIHJlc3BvbnNlO1xyXG4gIH0gY2F0Y2ggKGVycikge1xyXG4gICAgIHJldHVybiBlcnI7XHJcbiAgfVxyXG59XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIElEeW5hbW9PYmplY3Qge1xyXG4gICBnYW1lTmFtZTogc3RyaW5nLFxyXG4gICB5ZWFyUmVsZWFzZWQ/OiBudW1iZXIsXHJcbiAgIGdlbnJlPzogc3RyaW5nLFxyXG4gICBjb25zb2xlPzogc3RyaW5nLFxyXG4gICBkZXZlbG9wZXI/OiBzdHJpbmdcclxufVxyXG5cclxuZXhwb3J0IGludGVyZmFjZSBJSHR0cFJlc3BvbnNlIHtcclxuICAgc3RhdHVzQ29kZTogbnVtYmVyLFxyXG4gICBib2R5OiBzdHJpbmcsXHJcbn0iXX0=