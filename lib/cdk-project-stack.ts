import * as cdk from '@aws-cdk/core';
import * as apigateway from '@aws-cdk/aws-apigateway';
import * as lambda from '@aws-cdk/aws-lambda';
import * as dynamodb from '@aws-cdk/aws-dynamodb';
import { LambdaIntegration } from '@aws-cdk/aws-apigateway';
import { request } from 'http';

export class CdkProjectStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    //DynamoDB Table Definition
    const table = new dynamodb.Table(this, 'aws-cdk-dynamodb-table', {
      partitionKey: { name: 'gameName', type: dynamodb.AttributeType.STRING }
    });

    //Lambda Function
    const lambdaFunction = new lambda.Function(this, 'aws-cdk-lambda-function', {
      code: lambda.Code.fromAsset("functions"),
      handler: 'index.handler',
      runtime: lambda.Runtime.NODEJS_12_X,
      environment: {
        DYNAMO_DB_TABLE: table.tableName
      }
    });

    table.grantReadWriteData(lambdaFunction);   
    
    //API Gateway and methods
    const api = new apigateway.LambdaRestApi(this, "aws-cdk-rest-api", {
      handler: lambdaFunction,
      proxy: false,
      restApiName: "Game Management API"
    });
    const apiIntegration = new apigateway.LambdaIntegration(lambdaFunction);
    const requestValidator = api.addRequestValidator("request-validator", {
      requestValidatorName: "queryStringValidator",
      validateRequestBody: false,
      validateRequestParameters: true
    });

    api.root.addResource("getGame").addMethod("GET", apiIntegration, {
      requestParameters: {
        "method.request.querystring.gameName": true,
      },
      requestValidator: requestValidator,
    });
    api.root.addResource("listGames").addMethod("GET", apiIntegration);
    api.root.addResource("createGame").addMethod("POST", apiIntegration, {
      requestParameters: {
        "method.request.querystring.gameName": true,
        "method.request.querystring.genre": false,
        "method.request.querystring.description": false,
        "method.request.querystring.console": false,
        "method.request.querystring.yearReleased": false
      },
      requestValidator: requestValidator,
    });    
    api.root.addResource("modifyGame").addMethod("PUT", apiIntegration, {
      requestParameters: {
        "method.request.querystring.gameName": true,
        "method.request.querystring.genre": false,
        "method.request.querystring.description": false,
        "method.request.querystring.console": false,
        "method.request.querystring.yearReleased": false
      },
      requestValidator: requestValidator,
    });   
    api.root.addResource("deleteGame").addMethod("DELETE", apiIntegration, {
      requestParameters: {
        "method.request.querystring.gameName": true
      },
      requestValidator: requestValidator
    });

  }
}
