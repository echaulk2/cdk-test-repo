import * as cdk from '@aws-cdk/core';
import * as apigateway from '@aws-cdk/aws-apigateway';
import * as lambda from '@aws-cdk/aws-lambda';
import * as dynamodb from '@aws-cdk/aws-dynamodb';
import * as cognito from '@aws-cdk/aws-cognito';
import * as secretsmanager from '@aws-cdk/aws-secretsmanager';
import * as sns from '@aws-cdk/aws-sns';
import * as subscriptions from '@aws-cdk/aws-sns-subscriptions';
import * as events from '@aws-cdk/aws-events';
import * as targets from '@aws-cdk/aws-events-targets';
import * as ssm from '@aws-cdk/aws-ssm';

export class CdkProjectStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    //DynamoDB Table Definition
    const gameTable = new dynamodb.Table(this, 'aws-cdk-dynamodb-gameTable', {
      partitionKey: { name: 'partitionKey', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'sortKey', type: dynamodb.AttributeType.STRING }
    });

    const allowedRequestParameters = [ 'yearReleased', 'genre', 'developer', 'console' ];

    const topic = new sns.Topic(this, 'sns-topic', {
      displayName: 'My SNS topic',
    });
    topic.addSubscription(new subscriptions.EmailSubscription("erikchaulk@gmail.com"));

    const priceDataURL = ssm.StringParameter.fromStringParameterAttributes(this, 'MyValue', {
      parameterName: 'cdk-project-priceDataURL',
      // 'version' can be specified but is optional.
    }).stringValue;

        //Lambda Function
    const lambdaFunction = new lambda.Function(this, 'aws-cdk-lambda-function', {
      code: lambda.Code.fromAsset("functions"),
      handler: 'index.handler',
      runtime: lambda.Runtime.NODEJS_14_X,
      environment: {
        DYNAMO_DB_GAME_TABLE: gameTable.tableName,
        ALLOWED_REQUEST_PARAMETERS: JSON.stringify(allowedRequestParameters),
        TOPIC_ARN: topic.topicArn,
        PRICE_DATA_URL: priceDataURL
      },
      timeout: cdk.Duration.seconds(30)
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

    const oAuthSecret = secretsmanager.Secret.fromSecretCompleteArn(
      this,
      'db-oauth-id',
      'arn:aws:secretsmanager:us-east-1:221176140365:secret:220086216015-i33stbqjbfh5rlm9qi3uaimb9eo6gnrs.apps.googleusercontent.com-6xhZHY'
    );

    const userPoolIdentityProviderGoogle = new cognito.UserPoolIdentityProviderGoogle(this, 'userPoolGoogle', {
      userPool: userPool,
      clientId: oAuthSecret.secretName,
      clientSecret: oAuthSecret.secretValue.toString(),
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
          gameName: { type: apigateway.JsonSchemaType.STRING },
          yearReleased: { type: apigateway.JsonSchemaType.INTEGER },
          genre: { type: apigateway.JsonSchemaType.STRING },
          developer: { type: apigateway.JsonSchemaType.STRING },
          console: { type: apigateway.JsonSchemaType.STRING },          
      },
      required: ['gameName'],
      },
    });

    const wishlistRequestModel = restAPI.addModel('WishlistRequestModel', {
      contentType: 'application/json',
      modelName: 'WishlistRequestModel',
      schema: {
      schema: apigateway.JsonSchemaVersion.DRAFT4,
      title: 'wishlistModel',
      type: apigateway.JsonSchemaType.OBJECT,
      properties: {
          gameName: { type: apigateway.JsonSchemaType.STRING },
          yearReleased: { type: apigateway.JsonSchemaType.INTEGER },
          genre: { type: apigateway.JsonSchemaType.STRING },
          developer: { type: apigateway.JsonSchemaType.STRING },
          console: { type: apigateway.JsonSchemaType.STRING },
          desiredPrice: { type: apigateway.JsonSchemaType.INTEGER },
          desiredCondition: { type: apigateway.JsonSchemaType.STRING },                   
      },
      required: ['gameName'],
      },
    })

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

    let wishlistAPI = restAPI.root.addResource("collection").addResource("wishlist");
    wishlistAPI.addMethod("GET", apiIntegration, {
      authorizationType: apigateway.AuthorizationType.COGNITO,
      authorizer: {
        authorizerId: authorizer.ref
      }
    });
    
    
    wishlistAPI.addResource("addGame").addMethod("POST", apiIntegration, {
      authorizationType: apigateway.AuthorizationType.COGNITO,
      authorizer: {
        authorizerId: authorizer.ref
      },
      requestModels: { 'application/json': wishlistRequestModel },
      requestValidator: new apigateway.RequestValidator(restAPI, "addgame-wishlist-request-validator", {
        restApi: restAPI,
        validateRequestBody: true,
        validateRequestParameters: false,
      })
    });

    wishlistAPI.addResource("modifyGame").addMethod("PUT", apiIntegration, {
      authorizationType: apigateway.AuthorizationType.COGNITO,
      authorizer: {
        authorizerId: authorizer.ref
      },
      requestModels: { 'application/json': wishlistRequestModel },
      requestValidator: new apigateway.RequestValidator(restAPI, "modifygame-wishlist-request-validator", {
        restApi: restAPI,
        validateRequestBody: true,
        validateRequestParameters: false,
      })
    });

    wishlistAPI.addResource("removeGame").addMethod("DELETE", apiIntegration, {
      authorizationType: apigateway.AuthorizationType.COGNITO,
      authorizer: {
        authorizerId: authorizer.ref
      },
      requestModels: { 'application/json': wishlistRequestModel },
      requestValidator: new apigateway.RequestValidator(restAPI, "delete-game-wishlist-request-validator", {
        restApi: restAPI,
        validateRequestBody: true,
        validateRequestParameters: false,
      })
    });    

    wishlistAPI.addResource("customerWishlistNotifications").addMethod("GET", apiIntegration, {
      authorizationType: apigateway.AuthorizationType.COGNITO,
      authorizer: {
        authorizerId: authorizer.ref
      },
      requestValidator: new apigateway.RequestValidator(restAPI, "notifications-wishlist-request-validator", {
        restApi: restAPI,
        validateRequestBody: true,
        validateRequestParameters: false,
      })
    });   
    
    //EventBus
    const eventRule = new events.Rule(this, 'scheduleRule', {
      schedule: events.Schedule.rate(cdk.Duration.hours(24)),
    });

    eventRule.addTarget(new targets.ApiGateway(restAPI, {
      path: '/collection/wishlist/customerWishlistNotifications',
      method: 'GET',
      stage: 'prod'
    }));
  } 
}
