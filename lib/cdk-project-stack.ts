import * as cdk from '@aws-cdk/core';
import * as apigateway from '@aws-cdk/aws-apigateway';
import * as lambda from '@aws-cdk/aws-lambda';
import * as dynamodb from '@aws-cdk/aws-dynamodb';

export class CdkProjectStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    //DynamoDB Table Definition
    const table = new dynamodb.Table(this, 'aws-cdk-dynamodb-table', {
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING }
    });

    //Lambda Function
    const lambdaFunction = new lambda.Function(this, 'aws-cdk-lambda-function', {
      code: lambda.Code.fromAsset("functions"),
      handler: 'index.handler',
      runtime: lambda.Runtime.NODEJS_12_X
    });

    table.grantReadWriteData(lambdaFunction);   

    //API Gateway and methods
    const api = new apigateway.LambdaRestApi(this, "aws-cdk-rest-api", {
      handler: lambdaFunction,
      proxy: false
    });

    api.root.addResource("getGame").addMethod("GET");
    api.root.addResource("listGames").addMethod("GET");
    api.root.addResource("createGame").addMethod("POST");    
    api.root.addResource("modifyGame").addMethod("PUT");    
    api.root.addResource("deleteGame").addMethod("DELETE"); 

  }
}
