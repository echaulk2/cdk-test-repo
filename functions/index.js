exports.handler = async function(event, context) {
    //do something...
    return {
        statusCode: 200,
        headers: {},
        body: JSON.stringify("Hello World...")
    }; 
}