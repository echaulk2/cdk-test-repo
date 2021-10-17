import * as cdk from '@aws-cdk/core';
import * as apigateway from '@aws-cdk/aws-apigateway';
import * as lambda from '@aws-cdk/aws-lambda';
import * as dynamodb from '@aws-cdk/aws-dynamodb';
import { LambdaIntegration, Model } from '@aws-cdk/aws-apigateway';
import { request } from 'http';

export class CdkProjectStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    //DynamoDB Table Definition
    const table = new dynamodb.Table(this, 'aws-cdk-dynamodb-table', {
      partitionKey: { name: 'gameName', type: dynamodb.AttributeType.STRING }
    });
    const allowedRequestParameters = [ 'yearReleased', 'genre', 'developer', 'console' ];

    //Lambda Function
    const lambdaFunction = new lambda.Function(this, 'aws-cdk-lambda-function', {
      code: lambda.Code.fromAsset("functions"),
      handler: 'index.handler',
      runtime: lambda.Runtime.NODEJS_14_X,
      environment: {
        DYNAMO_DB_TABLE: table.tableName,
        ALLOWED_REQUEST_PARAMETERS: JSON.stringify(allowedRequestParameters)
      }
    });
    table.grantReadWriteData(lambdaFunction); 

    //API Gateway
    const restAPI = new apigateway.LambdaRestApi(this, "aws-cdk-rest-api", {
      handler: lambdaFunction,
      proxy: false,
      restApiName: "Game Management API"
    });
    const apiIntegration = new apigateway.LambdaIntegration(lambdaFunction);

    //Method schema
    const requestModel = restAPI.addModel('RequestModel', {
      contentType: 'application/json',
      modelName: 'PostModel',
      schema: {
      schema: apigateway.JsonSchemaVersion.DRAFT4,
      title: 'postModel',
      type: apigateway.JsonSchemaType.OBJECT,
      properties: {
          gameName: { type: apigateway.JsonSchemaType.STRING },
          yearReleased: { type: apigateway.JsonSchemaType.INTEGER },
          genre: { type: apigateway.JsonSchemaType.STRING },
          developer: { type: apigateway.JsonSchemaType.STRING },
          console: { type: apigateway.JsonSchemaType.STRING },          
      },
      required: ['gameName'],
      },
    });

    //Method definitions
    restAPI.root.addResource("getGame").addMethod("GET", apiIntegration, {
      requestParameters: {
        "method.request.querystring.gameName": true,
      },
      requestValidator: new apigateway.RequestValidator(restAPI, 'get-request-validator', {
        restApi: restAPI,
        validateRequestBody: false,
        validateRequestParameters: true,
      })
    });
    restAPI.root.addResource("listGames").addMethod("GET", apiIntegration);
    
    restAPI.root.addResource("createGame").addMethod("POST", apiIntegration, {
      requestModels: { 'application/json': requestModel },
      requestValidator: new apigateway.RequestValidator(restAPI, "create-request-validator", {
        restApi: restAPI,
        validateRequestBody: true,
        validateRequestParameters: false,
      })
    });
    restAPI.root.addResource("modifyGame").addMethod("PUT", apiIntegration, {
      requestModels: { 'application/json': requestModel },
      requestValidator: new apigateway.RequestValidator(restAPI, 'modify-request-validator', {
        restApi: restAPI,
        validateRequestBody: true,
        validateRequestParameters: false,
      })
    });
    restAPI.root.addResource("deleteGame").addMethod("DELETE", apiIntegration, {
      requestModels: { 'application/json': requestModel },
      requestValidator: new apigateway.RequestValidator(restAPI, 'delete-request-validator', {
        restApi: restAPI,
        validateRequestBody: true,
        validateRequestParameters: false,
      })
    });    
  }
}
