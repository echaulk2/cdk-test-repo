const AWS = require('aws-sdk');
const docClient = new AWS.DynamoDB.DocumentClient();
const table = process.env.DYNAMO_DB_TABLE;
const allowedRequestParameters = JSON.parse(process.env.ALLOWED_REQUEST_PARAMETERS);

exports.handler = async (event, context, callback) => {
  if (event.path == "/getGame") {
    await getGame(event)
  }
  
  if (event.path == "/listGames") {
    await listGames(event);
  }

  if (event.path == "/createGame") {
    await createGame(event);
  }
  
  if (event.path == "/modifyGame") {
    await modifyGame(event)
  }
  
  if (event.path == "/deleteGame") {
    await deleteGame(event)
  }

  //Assign data to the callback function and apply the appropriate Status Code
  async function getGame(event) {
    await returnGetData(event)
    .then((data) => {
      if (data.hasOwnProperty('code') && data.hasOwnProperty('message') && data.hasOwnProperty('statusCode')) {
        switch (data.code) {
          default:
            callback(null, {
              statusCode: `${data.statusCode}`,
              body: `Message: ${data.message}\nError Code: ${data.code}\nStatus Code: ${data.statusCode}`,
              headers: {
                'Access-Control-Allow-Origin': '*'
              }
            });
            break;
        }
      } else if (data) {
        //Calling get on an Item not in the table returns an empty JSON Object
        switch (Object.keys(data).length) {
          case 0:
            callback(null, {
              statusCode: 404,
              body: `Message: ${event.queryStringParameters["gameName"]} not found`,
              headers: {
                'Access-Control-Allow-Origin': '*'
              }
            });
            break;
          default:
            callback(null, {
              statusCode: 200,
              body: JSON.stringify(data),
              headers: {
                'Access-Control-Allow-Origin': '*'
              }
            });
        }
      } else {
        callback(null, {
          statusCode: 400,
          body: "There was an error.",
          headers: {
            'Access-Control-Allow-Origin': '*'
          }
        })
      }
    })
    .catch((err) => {
      callback(null, {
        statusCode: 400,
        body: JSON.stringify({
          message: `Error: ${err}`
        })
      })
    })
  }

  async function listGames() {
    await returnListData(event)
    .then((data) => {
      if (data.hasOwnProperty('code') && data.hasOwnProperty('message') && data.hasOwnProperty('statusCode')) {
        switch (data.code) {
          default:
            callback(null, {
              statusCode: `${data.statusCode}`,
              body: `Message: ${data.message}\nError Code: ${data.code}\nStatus Code: ${data.statusCode}`,
              headers: {
                'Access-Control-Allow-Origin': '*'
              }
            });
            break;
        }
      } else if (data) {
        callback(null, {
          statusCode: 200,
          body: JSON.stringify(data),
          headers: {
            'Access-Control-Allow-Origin': '*'
          }
        });
      } else {
        callback(null, {
          statusCode: 400,
          body: "There was an error.",
          headers: {
            'Access-Control-Allow-Origin': '*'
          }
        });
      }
    })
    .catch((err) => {
      callback(null, {
        statusCode: 400,
        body: JSON.stringify({
          message: `Error: ${err}`
        })
      })
    })
  }

  async function createGame(event) {
    await returnCreateData(event)
    .then((data) => {
      if (data.hasOwnProperty('code') && data.hasOwnProperty('message') && data.hasOwnProperty('statusCode')) {
        switch (data.code) {
          default:
            callback(null, {
              statusCode: `${data.statusCode}`,
              body: `Message: ${data.message}\nError Code: ${data.code}\nStatus Code: ${data.statusCode}`,
              headers: {
                'Access-Control-Allow-Origin': '*'
              }
            });
            break;
        }
        //DynamoDB returns an empty JSON object upon a successful creation
      } else if (Object.keys(data).length == 0) {
        callback(null, {
          statusCode: 201,
          body: `${JSON.parse(event.body).gameName} has been created.`,
          headers: {
            'Access-Control-Allow-Origin': '*'
          }
        })  
      } else {
        callback(null, {
          statusCode: 400,
          body: "There was an error.",
          headers: {
            'Access-Control-Allow-Origin': '*'
          }
        })
      }
    })
    .catch((err) => {
      callback(null, {
        statusCode: 400,
        body: JSON.stringify({
          message: `Error: ${err}`
        })
      })
    }) 
  }

  async function modifyGame(event) {
    await returnModifyData(event)
    .then((data) => {
      if (data.hasOwnProperty('code') && data.hasOwnProperty('message') && data.hasOwnProperty('statusCode')) {
        switch (data.code) {
          case 'ConditionalCheckFailedException':
            callback(null, {
              statusCode: `404`,
              body: `${JSON.parse(event.body).gameName} not found.`,
              headers: {
                'Access-Control-Allow-Origin': '*'
              }
            });
            break;
          default:
            callback(null, {
              statusCode: `${data.statusCode}`,
              body: `Message: ${data.message}\nError Code: ${data.code}\nStatus Code: ${data.statusCode}`,
              headers: {
                'Access-Control-Allow-Origin': '*'
              }
            });
            break;
        }
      } else if (data && data.Attributes) {
          callback(null, {
            statusCode: 200,
            body: JSON.stringify(data.Attributes),
            headers: {
              'Access-Control-Allow-Origin': '*'
            }
          });
      } else {
        callback(null, {
          statusCode: 400,
          body: "There was an error.",
          headers: {
            'Access-Control-Allow-Origin': '*'
          }
        });
      }
    })
    .catch((err) => {
      callback(null, {
        statusCode: 400,
        body: JSON.stringify({
          message: `Error: ${err}`
        })
      })
    })
  }

  async function deleteGame(event) {
    await returnDeleteData(event)
    .then((data) => {
      if (data.hasOwnProperty('code') && data.hasOwnProperty('message') && data.hasOwnProperty('statusCode')) {
        switch (data.code) {
          default:
            callback(null, {
              statusCode: `${data.statusCode}`,
              body: `Message: ${data.message}\nError Code: ${data.code}\nStatus Code: ${data.statusCode}`,
              headers: {
                'Access-Control-Allow-Origin': '*'
              }
            });
            break;
        }
      } else if (data) {
        //DynamoDB returns an empty JSON object when attempting to delete an item that isn't in the table
        switch (Object.keys(data).length) {
          case 0:
            callback(null, {
              statusCode: 404,
              body: `Message: ${JSON.parse(event.body).gameName} not found`,
              headers: {
                'Access-Control-Allow-Origin': '*'
              }
            });
            break;
          default:
            callback(null, {
              statusCode: 200,
              body: JSON.stringify(data.Attributes),
              headers: {
                'Access-Control-Allow-Origin': '*'
              }
            });
        }
      } else {
        callback(null, {
          statusCode: 400,
          body: "There was an error.",
          headers: {
            'Access-Control-Allow-Origin': '*'
          }
        })
      }
    })
    .catch((err) => {
      callback(null, {
        statusCode: 400,
        body: JSON.stringify({
          message: `Error: ${err}`
        })
      })
    });
  }

  //DynamoDB Data Access Functions
  async function returnGetData(event){
    let params = {
      TableName: table,
      Key: {
        gameName: event.queryStringParameters["gameName"]
      }
    };
    
    try {
      let data = await docClient.get(params).promise();
      return data;
    } catch (err) {
      return err;
    }
  }

  async function returnListData(event){
    let params = {
      TableName: table,
      Select: "ALL_ATTRIBUTES"
    };
    
    try {
      return await docClient.scan(params).promise();
    } catch (err) {
      return err;
    }
  }

  async function returnCreateData(event){
    let body = JSON.parse(event.body);
    let params = {
      TableName: table,
      Item: {
        gameName: body.gameName,
        genre: body.genre,
        yearReleased: body.yearReleased,
        developer: body.developer,
        console: body.console
      },
      ConditionExpression: 'attribute_not_exists(gameName)'
    };
    
    try {
      return await docClient.put(params).promise();
    } catch (err) {
      return err;
    }
  }

  async function returnModifyData(event){
    let updateExpression = [];
    let expressionAttributeNames={};
    let expressionAttributeValues = {};
    let body = JSON.parse(event.body);

    //Generate dynammic update expression based on allowed parameters
    for (let parameter in body) {
      if (allowedRequestParameters.includes(parameter)) {
        updateExpression.push(`#${parameter} = :${parameter}`);
        expressionAttributeNames['#'+parameter] = parameter ;
        expressionAttributeValues[':'+parameter]=`${body[parameter]}`;  
      }
    }
    
    let params = {
      TableName: table,
      Key: {
        gameName: body.gameName
      },
      UpdateExpression: `SET ${updateExpression.join(",")}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ConditionExpression: 'attribute_exists(gameName)',
      ReturnValues: 'ALL_NEW'
    };
    
    try {
      return await docClient.update(params).promise();
    } catch (err) {
      return err;
    }
  }

  async function returnDeleteData(event){
    let body = JSON.parse(event.body);
    let params = {
      TableName: table,
      Key: {
          gameName: body.gameName
      },
      ReturnValues: 'ALL_OLD'
    };
    
    try {
      return await docClient.delete(params).promise();
    } catch (err) {
      return err;
    }
  }
};