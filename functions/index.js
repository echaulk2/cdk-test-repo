const AWS = require('aws-sdk');
const docClient = new AWS.DynamoDB.DocumentClient();
const table = process.env.DYNAMO_DB_TABLE;

exports.handler = async (event, context, callback) => {
  if (event.path == "/createGame") {
    await createGame(event)
    .then((data) => {
      if (Object.keys(data).length == 0) {
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
          body: `Unable to create ${JSON.parse(event.body).gameName}`,
          headers: {
            'Access-Control-Allow-Origin': '*'
          }
        })  
      }
    })
    .catch((err) => {
      callback( {
        statusCode: 400,
        body: JSON.stringify({
          message: `Error: ${err}`
        })
      })
    }) 
  }
  
  if (event.path == "/modifyGame") {
    await modifyGame(event)
    .then((data) => {
      if (data && Object.keys(data).length > 0) {
        callback(null, {
          statusCode: 200,
          body: JSON.stringify(data.Attributes),
          headers: {
            'Access-Control-Allow-Origin': '*'
          }
        })  
      } else {
        callback(null, {
          statusCode: 404,
          body: `${JSON.parse(event.body).gameName} not found`,
          headers: {
            'Access-Control-Allow-Origin': '*'
          }
        })  
      }
    })
    .catch((err) => {
      callback( {
        statusCode: 400,
        body: JSON.stringify({
          message: `Error: ${err}`
        })
      })
    }) 
  }
  
  if (event.path == "/deleteGame") {
    await deleteGame(event)
    .then((data) => {
      if (data && Object.keys(data).length > 0) {
        callback(null, {
          statusCode: 200,
          body: JSON.stringify(data),
          headers: {
            'Access-Control-Allow-Origin': '*'
          }
        })  
      } else {
        callback(null, {
          statusCode: 404,
          body: `${JSON.parse(event.body).gameName} not found`,
          headers: {
            'Access-Control-Allow-Origin': '*'
          }
        })  
      }
    })
    .catch((err) => {
      callback( {
        statusCode: 400,
        body: JSON.stringify({
          message: `Error: ${err}`
        })
      })
    }) 
  }
  
  if (event.path == "/getGame") {
    await getGame(event)
    .then((data) => {
      if (data && Object.keys(data).length > 0) {
        callback(null, {
          statusCode: 200,
          body: JSON.stringify(data),
          headers: {
            'Access-Control-Allow-Origin': '*'
          }
        })  
      } else {
        callback(null, {
          statusCode: 404,
          body: `${event.queryStringParameters["gameName"]} not found`,
          headers: {
            'Access-Control-Allow-Origin': '*'
          }
        })  
      }
    })
    .catch((err) => {
      callback( {
        statusCode: 400,
        body: JSON.stringify({
          message: `Error: ${err}`
        })
      })
    })
 }
  
  if (event.path == "/listGames") {
    await listGames(event)
    .then((data) => {
      callback(null, {
        statusCode: 200,
        body: JSON.stringify(data),
        headers: {
          'Access-Control-Allow-Origin': '*'
        }
      })  
    })
    .catch((err) => {
      callback( {
        statusCode: 400,
        body: JSON.stringify({
          message: `Error: ${err}`
        })
      })
    })
  }
};


async function createGame(event){
  let body = JSON.parse(event.body);
  let params = {
    TableName: table,
    Item: {
      gameName: body.gameName,
      description: body.description,
      genre: body.genre,
      yearReleased: body.yearReleased,
      developer: body.developer,
      console: body.console
    },
    ConditionExpression: 'attribute_not_exists(gameName)'
  };
  
  return await docClient.put(params).promise();
}

async function modifyGame(event){
  let updateExpression = [];
  const modifyParameters = [ 'description', 'genre', 'yearReleased', 'developer', 'console' ];
  let expressionAttributeNames={};
  let expressionAttributeValues = {};
  let body = JSON.parse(event.body);

  //Generate dynammic update expression based on allowed parameters
  for (let parameter in body) {
    if (modifyParameters.includes(parameter)) {
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
  
  return await docClient.update(params).promise();
}

async function getGame(event){
  let params = {
    TableName: table,
    Key: {
      gameName: event.queryStringParameters["gameName"]
    }
  };
  
  return await docClient.get(params).promise();
}

async function deleteGame(event){
  let body = JSON.parse(event.body);
  let params = {
    TableName: table,
    Key: {
        gameName: body.gameName
    },
    ReturnValues: 'ALL_OLD'
  };
  
  return await docClient.delete(params).promise();
}

async function listGames(event){
  let params = {
    TableName: table,
    Select: "ALL_ATTRIBUTES"
  };
  
  return await docClient.scan(params).promise();
}