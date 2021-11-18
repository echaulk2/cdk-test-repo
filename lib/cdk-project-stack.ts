import * as cdk from '@aws-cdk/core';
import * as apigateway from '@aws-cdk/aws-apigateway';
import * as lambda from '@aws-cdk/aws-lambda';
import * as dynamodb from '@aws-cdk/aws-dynamodb';
import * as cognito from '@aws-cdk/aws-cognito';

export class CdkProjectStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    //DynamoDB Table Definition
    const gameTable = new dynamodb.Table(this, 'aws-cdk-dynamodb-gameTable', {
      partitionKey: { name: 'userID', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'gameName', type: dynamodb.AttributeType.STRING }
    });

    const allowedRequestParameters = [ 'yearReleased', 'genre', 'developer', 'console' ];

    //Lambda Function
    const lambdaFunction = new lambda.Function(this, 'aws-cdk-lambda-function', {
      code: lambda.Code.fromAsset("functions"),
      handler: 'index.handler',
      runtime: lambda.Runtime.NODEJS_14_X,
      environment: {
        DYNAMO_DB_GAME_TABLE: gameTable.tableName,
        ALLOWED_REQUEST_PARAMETERS: JSON.stringify(allowedRequestParameters)
      }
    });
    gameTable.grantReadWriteData(lambdaFunction); 

    //API Gateway
    const restAPI = new apigateway.LambdaRestApi(this, "aws-cdk-rest-api", {
      handler: lambdaFunction,
      proxy: false,
      restApiName: "Game Management API"
    });
    const apiIntegration = new apigateway.LambdaIntegration(lambdaFunction);

    //Cognito
    const userPool = new cognito.UserPool(this, 'userPool', {
      selfSignUpEnabled: true,
      userVerification: {
        emailSubject: 'Verify your email!',
        emailBody: 'Hello, Thanks for signing up! {##Verify Email##}',
        emailStyle: cognito.VerificationEmailStyle.LINK
      },
      signInAliases: {
        username: true,
        email: true
      },
      standardAttributes: {
        email: {
          required: true
        }
      }
    });

    const userPoolIdentityProviderGoogle = new cognito.UserPoolIdentityProviderGoogle(this, 'userPoolGoogle', {
      userPool: userPool,
      //OAuth 2.0 Client ID/Secret generated in my GCP account
      clientId: '220086216015-vq3ai6fr1qutbsc40aafk4b31mg1s7gm.apps.googleusercontent.com',
      clientSecret: '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',
      attributeMapping: {
        email: {
          attributeName: cognito.ProviderAttribute.GOOGLE_EMAIL.attributeName,
        },
        custom: {
          email_verified: cognito.ProviderAttribute.other('email_verified'),
        }
      },
      scopes: ['profile','email','openid']
    });

    const userPoolClient = new cognito.UserPoolClient(this, 'userPoolClient', {
      userPool: userPool,
      oAuth: {
        callbackUrls: ['https://example.com/callback'],
        logoutUrls: ['https://example.com/signout'],
        flows: {
          authorizationCodeGrant: false,
          implicitCodeGrant: true,
          clientCredentials: false
        },
        scopes: [cognito.OAuthScope.OPENID]
      }
    });

    const userPoolDomain = new cognito.UserPoolDomain(this, 'userPoolDomain', {
      userPool: userPool,
      cognitoDomain: {
        domainPrefix: 'cdkgameapidemo'
      }
    });

    const authorizer = new apigateway.CfnAuthorizer(this, 'cfnAuth', {
      restApiId: restAPI.restApiId,
      name: 'gameAuthorizer',
      type: 'COGNITO_USER_POOLS',
      identitySource: 'method.request.header.Authorization',
      providerArns: [userPool.userPoolArn]
    })

    //Method schema
    const requestModel = restAPI.addModel('RequestModel', {
      contentType: 'application/json',
      modelName: 'PostModel',
      schema: {
      schema: apigateway.JsonSchemaVersion.DRAFT4,
      title: 'postModel',
      type: apigateway.JsonSchemaType.OBJECT,
      properties: {
          userID: { type: apigateway.JsonSchemaType.STRING },
          gameName: { type: apigateway.JsonSchemaType.STRING },
          yearReleased: { type: apigateway.JsonSchemaType.INTEGER },
          genre: { type: apigateway.JsonSchemaType.STRING },
          developer: { type: apigateway.JsonSchemaType.STRING },
          console: { type: apigateway.JsonSchemaType.STRING },          
      },
      required: ['userID', 'gameName'],
      },
    });

    //Method definitions
    const getGame = restAPI.root.addResource("getGame").addMethod("GET", apiIntegration, {
      authorizationType: apigateway.AuthorizationType.COGNITO,
      authorizer: {
        authorizerId: authorizer.ref
      },
      requestParameters: {
        "method.request.querystring.gameName": true
      },
      requestValidator: new apigateway.RequestValidator(restAPI, 'get-request-validator', {
        restApi: restAPI,
        validateRequestBody: false,
        validateRequestParameters: true,
      })
    });

    restAPI.root.addResource("listGames").addMethod("GET", apiIntegration, {
      authorizationType: apigateway.AuthorizationType.COGNITO,
      authorizer: {
        authorizerId: authorizer.ref
      }
    });
    
    restAPI.root.addResource("createGame").addMethod("POST", apiIntegration, {
      authorizationType: apigateway.AuthorizationType.COGNITO,
      authorizer: {
        authorizerId: authorizer.ref
      },
      requestModels: { 'application/json': requestModel },
      requestValidator: new apigateway.RequestValidator(restAPI, "create-request-validator", {
        restApi: restAPI,
        validateRequestBody: true,
        validateRequestParameters: false,
      })
    });

    restAPI.root.addResource("modifyGame").addMethod("PUT", apiIntegration, {
      authorizationType: apigateway.AuthorizationType.COGNITO,
      authorizer: {
        authorizerId: authorizer.ref
      },
      requestModels: { 'application/json': requestModel },
      requestValidator: new apigateway.RequestValidator(restAPI, 'modify-request-validator', {
        restApi: restAPI,
        validateRequestBody: true,
        validateRequestParameters: false,
      })
    });

    restAPI.root.addResource("deleteGame").addMethod("DELETE", apiIntegration, {
      authorizationType: apigateway.AuthorizationType.COGNITO,
      authorizer: {
        authorizerId: authorizer.ref
      },
      requestModels: { 'application/json': requestModel },
      requestValidator: new apigateway.RequestValidator(restAPI, 'delete-request-validator', {
        restApi: restAPI,
        validateRequestBody: true,
        validateRequestParameters: false,
      })
    });
  }
}
