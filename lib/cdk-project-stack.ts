import * as cdk from '@aws-cdk/core';
import * as apigateway from '@aws-cdk/aws-apigateway';
import * as lambda from '@aws-cdk/aws-lambda';
import * as dynamodb from '@aws-cdk/aws-dynamodb';
import * as cognito from '@aws-cdk/aws-cognito';
import * as secretsmanager from '@aws-cdk/aws-secretsmanager';
import * as events from '@aws-cdk/aws-events';
import * as targets from '@aws-cdk/aws-events-targets';
import * as ssm from '@aws-cdk/aws-ssm';
import iam = require("@aws-cdk/aws-iam");

export class CdkProjectStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    //DynamoDB Table Definition
    const gameTable = new dynamodb.Table(this, 'aws-cdk-dynamodb-gameTable', {
      partitionKey: { name: 'partitionKey', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'sortKey', type: dynamodb.AttributeType.STRING },
      timeToLiveAttribute: "expirationDate"
    });

    gameTable.addGlobalSecondaryIndex({
      indexName: 'itemTypeIndex',
      partitionKey: {name: 'itemType', type: dynamodb.AttributeType.STRING},
      sortKey: {name: 'sortKey', type: dynamodb.AttributeType.STRING},
      readCapacity: 1,
      writeCapacity: 1,
      projectionType: dynamodb.ProjectionType.ALL,
    });
    
    gameTable.addGlobalSecondaryIndex({
      indexName: 'GSI-1',
      partitionKey: {name: 'GS1', type: dynamodb.AttributeType.STRING},
      readCapacity: 1,
      writeCapacity: 1,
      projectionType: dynamodb.ProjectionType.ALL,
    });

    gameTable.addGlobalSecondaryIndex({
      indexName: 'GSI-2',
      partitionKey: {name: 'partitionKey', type: dynamodb.AttributeType.STRING},
      sortKey: {name: 'GS1', type: dynamodb.AttributeType.STRING},
      readCapacity: 1,
      writeCapacity: 1,
      projectionType: dynamodb.ProjectionType.ALL,
    });


    const priceDataURL = ssm.StringParameter.fromStringParameterAttributes(this, 'priceDataUrl', {
      parameterName: 'cdk-project-priceDataURL',
    }).stringValue;

    const sesSourceEmailAddress = ssm.StringParameter.fromStringParameterAttributes(this, 'sesSourceEmailAddress', {
      parameterName: 'cdk-project-sesSourceEmailAddress'
    }).stringValue;

        //Lambda Function
    const lambdaFunction = new lambda.Function(this, 'aws-cdk-gameAPI-function', {
      code: lambda.Code.fromAsset("functions"),
      handler: 'index.handler',
      runtime: lambda.Runtime.NODEJS_14_X,
      environment: {
        DYNAMO_DB_GAME_TABLE: gameTable.tableName,
        PRICE_DATA_URL: priceDataURL
      },
      timeout: cdk.Duration.seconds(30),
      description: 'Lambda responsible for handling the Game API public endpoints'
    });

    const notificationsLambda = new lambda.Function(this, 'aws-cdk-notifications-function', {
      code: lambda.Code.fromAsset("functions"),
      handler: 'notifications.handler',
      runtime: lambda.Runtime.NODEJS_14_X,
      environment: {
        DYNAMO_DB_GAME_TABLE: gameTable.tableName,
        PRICE_DATA_URL: priceDataURL,
        SES_SOURCE_EMAIL_ADDRESS: sesSourceEmailAddress
      },
      timeout: cdk.Duration.seconds(30),
      description: 'Lambda responsible for sending Collection notifications'
    });

    const sesLambdaPolicy = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ["ses:SendEmail"],
      resources: ["*"],
    });

    //Runs the Wishlist Notifications at midnight every weekday
    const eventRule = new events.Rule(this, 'scheduleRule', {
      schedule: events.Schedule.expression('cron(0 5 ? * MON-FRI *)')
    });
    eventRule.addTarget(new targets.LambdaFunction(notificationsLambda));

    lambdaFunction.addToRolePolicy(sesLambdaPolicy);
    notificationsLambda.addToRolePolicy(sesLambdaPolicy);
    gameTable.grantReadWriteData(lambdaFunction); 
    gameTable.grantReadWriteData(notificationsLambda);

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
    const addGameModel = restAPI.addModel('AddRequestModel', {
      contentType: 'application/json',
      modelName: 'AddRequestModel',
      schema: {
        title: 'postModel',
        type: apigateway.JsonSchemaType.OBJECT,      
        required: ['gameName'],
        properties: {
            gameName: { type: apigateway.JsonSchemaType.STRING },
            yearReleased: { type: apigateway.JsonSchemaType.INTEGER },
            genre: { type: apigateway.JsonSchemaType.STRING },
            developer: { type: apigateway.JsonSchemaType.STRING },
            console: { type: apigateway.JsonSchemaType.STRING },          
        }
      }
    });   
    
    const modifyGameModel = restAPI.addModel('ModifyRequestModel', {
      contentType: 'application/json',
      modelName: 'ModifyRequestModel',
      schema: {
      schema: apigateway.JsonSchemaVersion.DRAFT4,
      title: 'postModel',
      type: apigateway.JsonSchemaType.OBJECT,
      properties: {
          gameID: { type: apigateway.JsonSchemaType.STRING },
          gameName: { type: apigateway.JsonSchemaType.STRING },
          yearReleased: { type: apigateway.JsonSchemaType.INTEGER },
          genre: { type: apigateway.JsonSchemaType.STRING },
          developer: { type: apigateway.JsonSchemaType.STRING },
          console: { type: apigateway.JsonSchemaType.STRING },          
      },
      required: ['gameName', 'gameID'],
      },
    });
    
    const getCollectionModel = restAPI.addModel('WishlistRequestModel', {
      contentType: 'application/json',
      modelName: 'WishlistRequestModel',
      schema: {
      schema: apigateway.JsonSchemaVersion.DRAFT4,
      title: 'wishlistModel',
      type: apigateway.JsonSchemaType.OBJECT,
      properties: {
          collectionID: { type: apigateway.JsonSchemaType.STRING },                 
      },
      required: ['collectionID'],
      },
    })

    const addGameToWishlistModel = restAPI.addModel('WishlistAddRequestModel', {
      contentType: 'application/json',
      modelName: 'WishlistAddRequestModel',
      schema: {
      schema: apigateway.JsonSchemaVersion.DRAFT4,
      title: 'wishlistModel',
      type: apigateway.JsonSchemaType.OBJECT,
      properties: {
          collectionID: { type: apigateway.JsonSchemaType.STRING },
          gameName: { type: apigateway.JsonSchemaType.STRING },
          yearReleased: { type: apigateway.JsonSchemaType.INTEGER },
          genre: { type: apigateway.JsonSchemaType.STRING },
          developer: { type: apigateway.JsonSchemaType.STRING },
          console: { type: apigateway.JsonSchemaType.STRING },
          desiredPrice: { type: apigateway.JsonSchemaType.INTEGER },
          desiredCondition: { type: apigateway.JsonSchemaType.STRING },                   
      },
      required: ['gameName', 'collectionID'],
      },
    })

    const modifyGameInWishlistModel = restAPI.addModel('WishlistModifyRequestModel', {
      contentType: 'application/json',
      modelName: 'WishlistModifyRequestModel',
      schema: {
      schema: apigateway.JsonSchemaVersion.DRAFT4,
      title: 'wishlistModel',
      type: apigateway.JsonSchemaType.OBJECT,
      properties: {
          id: { type: apigateway.JsonSchemaType.STRING },
          collectionID: { type: apigateway.JsonSchemaType.STRING },
          gameName: { type: apigateway.JsonSchemaType.STRING },
          yearReleased: { type: apigateway.JsonSchemaType.INTEGER },
          genre: { type: apigateway.JsonSchemaType.STRING },
          developer: { type: apigateway.JsonSchemaType.STRING },
          console: { type: apigateway.JsonSchemaType.STRING },
          desiredPrice: { type: apigateway.JsonSchemaType.INTEGER },
          desiredCondition: { type: apigateway.JsonSchemaType.STRING },                   
      },
      required: ['gameName', 'id', 'collectionID'],
      },
    })

    const addPriceMonitorToWishlistGame = restAPI.addModel('PriceMonitorRequestMondel', {
      contentType: 'application/json',
      modelName: 'addPriceMonitor',
      schema: {
      schema: apigateway.JsonSchemaVersion.DRAFT4,
      title: 'wishlistModel',
      type: apigateway.JsonSchemaType.OBJECT,
      properties: {
          gameID: { type: apigateway.JsonSchemaType.STRING },
          collectionID: { type: apigateway.JsonSchemaType.STRING },
          desiredPrice: { type: apigateway.JsonSchemaType.INTEGER },
          desiredCondition: { type: apigateway.JsonSchemaType.STRING },                   
      },
      required: ['gameID', 'collectionID', 'desiredPrice', 'desiredCondition'],
      }
    });

    const updatePriceMonitorToWishlistGame = restAPI.addModel('UpdatePriceMonitorRequestMondel', {
      contentType: 'application/json',
      modelName: 'updatePriceMonitor',
      schema: {
      schema: apigateway.JsonSchemaVersion.DRAFT4,
      title: 'wishlistModel',
      type: apigateway.JsonSchemaType.OBJECT,
      properties: {
          priceMonitorID: { type: apigateway.JsonSchemaType.STRING },
          gameID: { type: apigateway.JsonSchemaType.STRING },
          collectionID: { type: apigateway.JsonSchemaType.STRING },
          desiredPrice: { type: apigateway.JsonSchemaType.INTEGER },
          desiredCondition: { type: apigateway.JsonSchemaType.STRING },                   
      },
      required: ['priceMonitorID', 'gameID', 'collectionID', 'desiredPrice', 'desiredCondition'],
      }
    });

    //Method definitions
    restAPI.root.addResource("createUser").addMethod("POST", apiIntegration, {
      authorizationType: apigateway.AuthorizationType.COGNITO,
      authorizer: {
        authorizerId: authorizer.ref
      },
      requestValidator: new apigateway.RequestValidator(restAPI, "create-user-request-validator", {
        restApi: restAPI,
        validateRequestBody: false,
        validateRequestParameters: false,
      })
    });

    restAPI.root.addResource("getGame").addMethod("GET", apiIntegration, {
      authorizationType: apigateway.AuthorizationType.COGNITO,
      authorizer: {
        authorizerId: authorizer.ref
      },
      requestParameters: {
        "method.request.querystring.gameID": true,        
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
      requestValidator: new apigateway.RequestValidator(this, "create-request-validator", {
        restApi: restAPI,
        validateRequestBody: true
      }),
      requestModels: { 'application/json': addGameModel },
    });

    restAPI.root.addResource("modifyGame").addMethod("PUT", apiIntegration, {
      authorizationType: apigateway.AuthorizationType.COGNITO,
      authorizer: {
        authorizerId: authorizer.ref
      },
      requestModels: { 'application/json': modifyGameModel },
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
      requestModels: { 'application/json': modifyGameModel },
      requestValidator: new apigateway.RequestValidator(restAPI, 'delete-request-validator', {
        restApi: restAPI,
        validateRequestBody: true,
        validateRequestParameters: false,
      })
    });

    let wishlistAPI = restAPI.root.addResource("collection").addResource("wishlist");

    wishlistAPI.addResource("createWishlist").addMethod("POST", apiIntegration, {
      authorizationType: apigateway.AuthorizationType.COGNITO,
      authorizer: {
        authorizerId: authorizer.ref
      },
      requestValidator: new apigateway.RequestValidator(restAPI, "create-wishlist-request-validator", {
        restApi: restAPI,
        validateRequestBody: false,
        validateRequestParameters: false,
      })
    });

    wishlistAPI.addMethod("GET", apiIntegration, {
      authorizationType: apigateway.AuthorizationType.COGNITO,
      authorizer: {
        authorizerId: authorizer.ref
      },
      requestParameters: {
        "method.request.querystring.collectionID": true,        
      },
      requestValidator: new apigateway.RequestValidator(restAPI, 'get-wishlist-request-validator', {
        restApi: restAPI,
        validateRequestBody: false,
        validateRequestParameters: true,
      })
    });
    
    wishlistAPI.addResource("addGame").addMethod("POST", apiIntegration, {
      authorizationType: apigateway.AuthorizationType.COGNITO,
      authorizer: {
        authorizerId: authorizer.ref
      },
      requestModels: { 'application/json': addGameToWishlistModel },
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
      requestModels: { 'application/json': modifyGameInWishlistModel },
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
      requestModels: { 'application/json': modifyGameInWishlistModel },
      requestValidator: new apigateway.RequestValidator(restAPI, "delete-game-wishlist-request-validator", {
        restApi: restAPI,
        validateRequestBody: true,
        validateRequestParameters: false,
      })
    });  
    
    wishlistAPI.addResource("addPriceMonitor").addMethod("POST", apiIntegration, {
      authorizationType: apigateway.AuthorizationType.COGNITO,
      authorizer: {
        authorizerId: authorizer.ref
      },
      requestModels: { 'application/json': addPriceMonitorToWishlistGame },
      requestValidator: new apigateway.RequestValidator(restAPI, "addPriceMonitor-wishlist-request-validator", {
        restApi: restAPI,
        validateRequestBody: true,
        validateRequestParameters: false,
      })
    });

    wishlistAPI.addResource("modifyPriceMonitor").addMethod("PUT", apiIntegration, {
      authorizationType: apigateway.AuthorizationType.COGNITO,
      authorizer: {
        authorizerId: authorizer.ref
      },
      requestModels: { 'application/json': updatePriceMonitorToWishlistGame },
      requestValidator: new apigateway.RequestValidator(restAPI, "modifyPriceMonitor-wishlist-request-validator", {
        restApi: restAPI,
        validateRequestBody: true,
        validateRequestParameters: false,
      })
    });

    wishlistAPI.addResource("deletePriceMonitor").addMethod("DELETE", apiIntegration, {
      authorizationType: apigateway.AuthorizationType.COGNITO,
      authorizer: {
        authorizerId: authorizer.ref
      },
      requestModels: { 'application/json': updatePriceMonitorToWishlistGame },
      requestValidator: new apigateway.RequestValidator(restAPI, "deletePriceMonitor-wishlist-request-validator", {
        restApi: restAPI,
        validateRequestBody: true,
        validateRequestParameters: false,
      })
    });
  } 
}
