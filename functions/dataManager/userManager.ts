import * as Common from "../shared/common/user";
import * as CommonGame from "../shared/common/game";
import * as Config from "../shared/config/config";
import { User } from "../models/user";
import { UserError } from "../error/userErrorHandler";

export async function createUser(user: User): Promise<User> {
    try {
      let params = {
        TableName: Config.table,
        Item: {
          partitionKey: user.userID,
          sortKey: `[User]#[${user.userID}]`,
          GS1: user.userID,
          userID: user.userID,
          email: user.email,
          itemType: "[User]"
        },
        ConditionExpression: 'attribute_not_exists(partitionKey) AND attribute_not_exists(sortKey)'
      }
      let response = await Config.docClient.put(params).promise();
      let createdUser = await getUser(user.userID);
      return createdUser;
    } catch(err: any) {
      switch (err.code) {
        case ("ConditionalCheckFailedException"):
          throw new UserError("Unable to create user.  Conditional Check Failed.");
        default:
          throw err;
      }
    }
  }

 export async function getUser(userID: string) : Promise<User> {
    let partitionKey = userID;
    let sortKey = `[User]#[${userID}]`;
    let params = {
      TableName: Config.table,
      Key: {
        partitionKey: partitionKey,
        sortKey: sortKey
      },
      KeyConditionExpression: `partitionKey = ${partitionKey} and sortKey = ${sortKey}`
    }
    
    try {
      let response = await Config.docClient.get(params).promise();
      if (response.Item) {
        return Common.deserializeUserData(response.Item);
      } else {
        throw new Error("Unable to get user. User not found.");
      }      
    } catch (err: any) {
      switch (err.code) {
        case ("ConditionalCheckFailedException"):
          throw new UserError("Unable to get user.  Conditional Check Failed.");
        default:
          throw err;
      }
    }
  }

  export async function listUsers() : Promise<[User]> {
    let params = {
      TableName: Config.table,
      IndexName: "itemTypeIndex",
      KeyConditionExpression: "#itemType = :itemType",
      ExpressionAttributeNames: {
          "#itemType": "itemType"
      },
      ExpressionAttributeValues: {
          ":itemType": "[User]"
      }
    };
    
    let paginatedData = await CommonGame.getPaginatedData(params);
    let gameList = [] as any;
    if (paginatedData.length > 0) {
      for (let user of paginatedData) {
        let returnedGame = Common.deserializeUserData(user);
        gameList.push(returnedGame);
      }
    }
    return gameList;
  }
  
  export async function modifyUser(userID: string) { 
    let partitionKey = userID;
    let sortKey = `[User]#[${userID}]` 
    let template = await CommonGame.generateModifyExpression(game);

    let params = {
      TableName: Config.table,
      Key: {
        partitionKey: partitionKey,
        sortKey: sortKey,
      },
      KeyConditionExpression: `partitionKey = ${partitionKey} AND sortKey = ${sortKey}`,
      UpdateExpression: `SET ${template.updateExpression.join(",")}`,
      ExpressionAttributeNames: template.expressionAttributeNames,
      ExpressionAttributeValues: template.expressionAttributeValues,
      ConditionExpression: 'attribute_exists(partitionKey) and attribute_exists(sortKey)',
      ReturnValues: 'ALL_NEW'
    };
  
    try {
      let response = await Config.docClient.update(params).promise();
      let modifiedUser = await getUser(userID);
      return modifiedUser;
    } catch (err: any) {
      switch (err.code) {
        case ("ConditionalCheckFailedException"):
          throw new UserError("Unable to modify user.  Conditional Check Failed.");
        default:
          throw err;
      }
    }
  }
  
  export async function deleteUser(userID: string) {
    let partitionKey = userID;
    let sortKey = `[User]#[${userID}]`;
    let params = {
      TableName: Config.table,
      Key: {
        partitionKey: partitionKey,
        sortKey: sortKey
      },
      KeyConditionExpression: `partitionKey = ${partitionKey} and sortKey = ${sortKey}`,
      ConditionExpression: 'attribute_exists(partitionKey) and attribute_exists(sortKey)',
      ReturnValues: 'ALL_OLD'
    };
  
    try {
      let response = await Config.docClient.delete(params).promise();
      let deletedUser = Common.deserializeUserData(response.Attributes);
      return deletedUser;      
    } catch (err: any) {
      switch (err.code) {
        case ("ConditionalCheckFailedException"):
          throw new UserError("Unable to delete user.  Conditional Check Failed.");
        default:
          throw err;
      }
    }
  }