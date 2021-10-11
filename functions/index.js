const AWS = require('aws-sdk');
const docClient = new AWS.DynamoDB.DocumentClient();
const table = process.env.DYNAMO_DB_TABLE;

exports.handler = async (event, context) => {
  if (event.path == "/createGame") {
    try {
      let data = await createGame(event);
      return { body: data };
    } catch (err) {
      return { error: err };
    }  
  }
  
  if (event.path == "/modifyGame") {
    try {
      let data = await modifyGame(event);
      return { body: data };
    } catch (err) {
      return { error: err };
    }  
  }
  
  if (event.path == "/deleteGame") {
    try {
      let data = await deleteGame(event);
      return { body: data };
    } catch (err) {
      return { error: err };
    }  
  }
  
  if (event.path == "/getGame") {
    try {
      let data = await getGame(event);
      return { body: data };
    } catch (err) {
      return { error: err };
    }  
  }
  
  if (event.path == "/listGames") {
    try {
      let data = await listGames(event);
      console.log(data)
      return { body: data };
    } catch (err) {
      return { error: err };
    }
  }
};


async function createGame(event){
  let params = {
    TableName: table,
    Item: {
      gameName: event.queryStringParameters['gameName'],
      description: event.queryStringParameters['description'],
      genre: event.queryStringParameters['genre'],
      yearReleased: event.queryStringParameters['yearReleased'],
      developer: event.queryStringParameters['developer'],
      console: event.queryStringParameters['console']
    },
    ConditionExpression: 'attribute_not_exists(gameName)'
  };
  
  try {
    let data = await docClient.put(params).promise();
    return JSON.stringify(data);
  } catch (err) {
    return err;
  }
}

async function modifyGame(event){
  let updateExpression = [];
  const modifyParameters = [ 'description', 'genre', 'yearReleased', 'developer', 'console' ];
  let expressionAttributeNames={};
  let expressionAttributeValues = {};
  
  //Generate dynammic update expression based on allowed parameters
  for (let parameter in event.queryStringParameters) {
    if (modifyParameters.includes(parameter)) {
      updateExpression.push(`#${parameter} = :${parameter}`);
      expressionAttributeNames['#'+parameter] = parameter ;
      expressionAttributeValues[':'+parameter]=event.queryStringParameters[parameter];  
    }
  }
  
  let params = {
    TableName: table,
    Key: {
      gameName: event.queryStringParameters['gameName']
    },
    UpdateExpression: `SET ${updateExpression.join(",")}`,
    ExpressionAttributeNames: expressionAttributeNames,
    ExpressionAttributeValues: expressionAttributeValues,
    ConditionExpression: 'attribute_exists(gameName)',
    ReturnValues: 'ALL_NEW'
  };
  
  try {
    let data = await docClient.update(params).promise();
    return JSON.stringify(data);
  } catch (err) {
    return err;
  }
}

async function getGame(event){
  let params = {
    TableName: table,
    Key: {
      gameName: event.queryStringParameters['gameName']
    }
  };
  
  try {
    let data = await docClient.get(params).promise();
    return JSON.stringify(data);
  } catch (err) {
    return err;
  }
}

async function deleteGame(event){
  let params = {
    TableName: table,
    Key: {
        gameName: event.queryStringParameters['gameName']
    },
    ReturnValues: 'ALL_OLD'
  };
  
  try {
    let data = await docClient.delete(params).promise();
    return JSON.stringify(data);
  } catch (err) {
    return err;
  }
}

async function listGames(event){
  let params = {
    TableName: table,
    Select: "ALL_ATTRIBUTES"
  };
  
  try {
    let data = await docClient.scan(params).promise();
    return JSON.stringify(data);
  } catch (err) {
    return err;
  }
}