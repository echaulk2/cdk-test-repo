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
    
    //API Gateway
    const api = new apigateway.LambdaRestApi(this, "aws-cdk-rest-api", {
      handler: lambdaFunction,
      proxy: false,
      restApiName: "Game Management API"
    });
    const apiIntegration = new apigateway.LambdaIntegration(lambdaFunction);

    //Method schemas
    const getModel = api.addModel('GetModel', {
      contentType: 'application/json',
      modelName: 'GetModel',
      schema: {
      schema: apigateway.JsonSchemaVersion.DRAFT4,
      title: 'getModel',
      type: apigateway.JsonSchemaType.OBJECT,
      properties: {
          gameName: { type: apigateway.JsonSchemaType.STRING },
      },
      required: ['gameName'],
      },
    }); 
    const postModel = api.addModel('PostModel', {
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
          description: { type: apigateway.JsonSchemaType.STRING },
          developer: { type: apigateway.JsonSchemaType.STRING },
          console: { type: apigateway.JsonSchemaType.STRING },          
      },
      required: ['gameName'],
      },
    }); 

    //Method definitions
    api.root.addResource("getGame").addMethod("GET", apiIntegration, {
      requestModels: { 'application/json': getModel }
    });
    api.root.addResource("listGames").addMethod("GET", apiIntegration);
    
    api.root.addResource("createGame").addMethod("POST", apiIntegration, {
      requestModels: { 'application/json': postModel }
    });
    api.root.addResource("modifyGame").addMethod("PUT", apiIntegration, {
      requestModels: { 'application/json': postModel }
    });
    api.root.addResource("deleteGame").addMethod("DELETE", apiIntegration, {
      requestModels: { 'application/json': getModel }
    });
    
  }
}
