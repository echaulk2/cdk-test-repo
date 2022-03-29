"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CdkProjectStack = void 0;
const cdk = require("@aws-cdk/core");
const apigateway = require("@aws-cdk/aws-apigateway");
const lambda = require("@aws-cdk/aws-lambda");
const dynamodb = require("@aws-cdk/aws-dynamodb");
const cognito = require("@aws-cdk/aws-cognito");
const secretsmanager = require("@aws-cdk/aws-secretsmanager");
const events = require("@aws-cdk/aws-events");
const targets = require("@aws-cdk/aws-events-targets");
const ssm = require("@aws-cdk/aws-ssm");
const iam = require("../node_modules/@aws-cdk/aws-cloudwatch/node_modules/@aws-cdk/aws-iam"); //There's some bug with importing the iam module... see https://github.com/aws/aws-cdk/issues/8410
class CdkProjectStack extends cdk.Stack {
    constructor(scope, id, props) {
        super(scope, id, props);
        //DynamoDB Table Definition
        const gameTable = new dynamodb.Table(this, 'aws-cdk-dynamodb-gameTable', {
            partitionKey: { name: 'partitionKey', type: dynamodb.AttributeType.STRING },
            sortKey: { name: 'sortKey', type: dynamodb.AttributeType.STRING },
            timeToLiveAttribute: "expirationDate"
        });
        gameTable.addGlobalSecondaryIndex({
            indexName: 'itemTypeIndex',
            partitionKey: { name: 'itemType', type: dynamodb.AttributeType.STRING },
            sortKey: { name: 'sortKey', type: dynamodb.AttributeType.STRING },
            readCapacity: 1,
            writeCapacity: 1,
            projectionType: dynamodb.ProjectionType.ALL,
        });
        gameTable.addGlobalSecondaryIndex({
            indexName: 'collectionIDIndex',
            partitionKey: { name: 'collectionID', type: dynamodb.AttributeType.STRING },
            sortKey: { name: 'sortKey', type: dynamodb.AttributeType.STRING },
            readCapacity: 1,
            writeCapacity: 1,
            projectionType: dynamodb.ProjectionType.ALL,
        });
        gameTable.addGlobalSecondaryIndex({
            indexName: 'userIDIndex',
            partitionKey: { name: 'userID', type: dynamodb.AttributeType.STRING },
            sortKey: { name: 'itemType', type: dynamodb.AttributeType.STRING },
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
        const oAuthSecret = secretsmanager.Secret.fromSecretCompleteArn(this, 'db-oauth-id', 'arn:aws:secretsmanager:us-east-1:221176140365:secret:220086216015-i33stbqjbfh5rlm9qi3uaimb9eo6gnrs.apps.googleusercontent.com-6xhZHY');
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
            scopes: ['profile', 'email', 'openid']
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
        });
        //Method schema
        const addGameModel = restAPI.addModel('AddRequestModel', {
            contentType: 'application/json',
            modelName: 'AddRequestModel',
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
        const modifyGameModel = restAPI.addModel('ModifyRequestModel', {
            contentType: 'application/json',
            modelName: 'ModifyRequestModel',
            schema: {
                schema: apigateway.JsonSchemaVersion.DRAFT4,
                title: 'postModel',
                type: apigateway.JsonSchemaType.OBJECT,
                properties: {
                    id: { type: apigateway.JsonSchemaType.STRING },
                    gameName: { type: apigateway.JsonSchemaType.STRING },
                    yearReleased: { type: apigateway.JsonSchemaType.INTEGER },
                    genre: { type: apigateway.JsonSchemaType.STRING },
                    developer: { type: apigateway.JsonSchemaType.STRING },
                    console: { type: apigateway.JsonSchemaType.STRING },
                },
                required: ['gameName', 'id'],
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
        });
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
        });
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
        });
        const addPriceMonitorToWishlistGame = restAPI.addModel('PriceMonitorRequestMondel', {
            contentType: 'application/json',
            modelName: 'addPriceMonitor',
            schema: {
                schema: apigateway.JsonSchemaVersion.DRAFT4,
                title: 'wishlistModel',
                type: apigateway.JsonSchemaType.OBJECT,
                properties: {
                    id: { type: apigateway.JsonSchemaType.STRING },
                    collectionID: { type: apigateway.JsonSchemaType.STRING },
                    desiredPrice: { type: apigateway.JsonSchemaType.INTEGER },
                    desiredCondition: { type: apigateway.JsonSchemaType.STRING },
                },
                required: ['id', 'collectionID', 'desiredPrice', 'desiredCondition'],
            }
        });
        //Method definitions
        const getGame = restAPI.root.addResource("getGame").addMethod("GET", apiIntegration, {
            authorizationType: apigateway.AuthorizationType.COGNITO,
            authorizer: {
                authorizerId: authorizer.ref
            },
            requestParameters: {
                "method.request.querystring.gameName": true,
                "method.request.querystring.id": true,
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
            requestModels: { 'application/json': addGameModel },
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
            requestModels: { 'application/json': addPriceMonitorToWishlistGame },
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
            requestModels: { 'application/json': addPriceMonitorToWishlistGame },
            requestValidator: new apigateway.RequestValidator(restAPI, "deletePriceMonitor-wishlist-request-validator", {
                restApi: restAPI,
                validateRequestBody: true,
                validateRequestParameters: false,
            })
        });
    }
}
exports.CdkProjectStack = CdkProjectStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2RrLXByb2plY3Qtc3RhY2suanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJjZGstcHJvamVjdC1zdGFjay50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSxxQ0FBcUM7QUFDckMsc0RBQXNEO0FBQ3RELDhDQUE4QztBQUM5QyxrREFBa0Q7QUFDbEQsZ0RBQWdEO0FBQ2hELDhEQUE4RDtBQUM5RCw4Q0FBOEM7QUFDOUMsdURBQXVEO0FBQ3ZELHdDQUF3QztBQUN4Qyw2RkFBOEYsQ0FBQyxrR0FBa0c7QUFFak0sTUFBYSxlQUFnQixTQUFRLEdBQUcsQ0FBQyxLQUFLO0lBQzVDLFlBQVksS0FBb0IsRUFBRSxFQUFVLEVBQUUsS0FBc0I7UUFDbEUsS0FBSyxDQUFDLEtBQUssRUFBRSxFQUFFLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFFeEIsMkJBQTJCO1FBQzNCLE1BQU0sU0FBUyxHQUFHLElBQUksUUFBUSxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsNEJBQTRCLEVBQUU7WUFDdkUsWUFBWSxFQUFFLEVBQUUsSUFBSSxFQUFFLGNBQWMsRUFBRSxJQUFJLEVBQUUsUUFBUSxDQUFDLGFBQWEsQ0FBQyxNQUFNLEVBQUU7WUFDM0UsT0FBTyxFQUFFLEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBRSxJQUFJLEVBQUUsUUFBUSxDQUFDLGFBQWEsQ0FBQyxNQUFNLEVBQUU7WUFDakUsbUJBQW1CLEVBQUUsZ0JBQWdCO1NBQ3RDLENBQUMsQ0FBQztRQUVILFNBQVMsQ0FBQyx1QkFBdUIsQ0FBQztZQUNoQyxTQUFTLEVBQUUsZUFBZTtZQUMxQixZQUFZLEVBQUUsRUFBQyxJQUFJLEVBQUUsVUFBVSxFQUFFLElBQUksRUFBRSxRQUFRLENBQUMsYUFBYSxDQUFDLE1BQU0sRUFBQztZQUNyRSxPQUFPLEVBQUUsRUFBQyxJQUFJLEVBQUUsU0FBUyxFQUFFLElBQUksRUFBRSxRQUFRLENBQUMsYUFBYSxDQUFDLE1BQU0sRUFBQztZQUMvRCxZQUFZLEVBQUUsQ0FB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SCxXQUFXLENBQUMsV0FBVyxDQUFDLG9CQUFvQixDQUFDLENBQUMsU0FBUyxDQUFDLEtBQUssRUFBRSxjQUFjLEVBQUU7WUFDN0UsaUJBQWlCLEVBQUUsVUFBVSxDQUFDLGlCQUFpQixDQUFDLE9BQU87WUFDdkQsVUFBVSxFQUFFO2dCQUNWLFlBQVksRUFBRSxVQUFVLENBQUMsR0FBRzthQUM3QjtZQUNELGFBQWEsRUFBRSxFQUFFLGtCQUFrQixFQUFFLDZCQUE2QixFQUFFO1lBQ3BFLGdCQUFnQixFQUFFLElBQUksVUFBVSxDQUFDLGdCQUFnQixDQUFDLE9BQU8sRUFBRSwrQ0FBK0MsRUFBRTtnQkFDMUcsT0FBTyxFQUFFLE9BQU87Z0JBQ2hCLG1CQUFtQixFQUFFLElBQUk7Z0JBQ3pCLHlCQUF5QixFQUFFLEtBQUs7YUFDakMsQ0FBQztTQUNILENBQUMsQ0FBQztRQUVILFdBQVcsQ0FBQyxXQUFXLENBQUMsb0JBQW9CLENBQUMsQ0FBQyxTQUFTLENBQUMsUUFBUSxFQUFFLGNBQWMsRUFBRTtZQUNoRixpQkFBaUIsRUFBRSxVQUFVLENBQUMsaUJBQWlCLENBQUMsT0FBTztZQUN2RCxVQUFVLEVBQUU7Z0JBQ1YsWUFBWSxFQUFFLFVBQVUsQ0FBQyxHQUFHO2FBQzdCO1lBQ0QsYUFBYSxFQUFFLEVBQUUsa0JBQWtCLEVBQUUsNkJBQTZCLEVBQUU7WUFDcEUsZ0JBQWdCLEVBQUUsSUFBSSxVQUFVLENBQUMsZ0JBQWdCLENBQUMsT0FBTyxFQUFFLCtDQUErQyxFQUFFO2dCQUMxRyxPQUFPLEVBQUUsT0FBTztnQkFDaEIsbUJBQW1CLEVBQUUsSUFBSTtnQkFDekIseUJBQXlCLEVBQUUsS0FBSzthQUNqQyxDQUFDO1NBQ0gsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztDQUNGO0FBbGJELDBDQWtiQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGNkayBmcm9tICdAYXdzLWNkay9jb3JlJztcclxuaW1wb3J0ICogYXMgYXBpZ2F0ZXdheSBmcm9tICdAYXdzLWNkay9hd3MtYXBpZ2F0ZXdheSc7XHJcbmltcG9ydCAqIGFzIGxhbWJkYSBmcm9tICdAYXdzLWNkay9hd3MtbGFtYmRhJztcclxuaW1wb3J0ICogYXMgZHluYW1vZGIgZnJvbSAnQGF3cy1jZGsvYXdzLWR5bmFtb2RiJztcclxuaW1wb3J0ICogYXMgY29nbml0byBmcm9tICdAYXdzLWNkay9hd3MtY29nbml0byc7XHJcbmltcG9ydCAqIGFzIHNlY3JldHNtYW5hZ2VyIGZyb20gJ0Bhd3MtY2RrL2F3cy1zZWNyZXRzbWFuYWdlcic7XHJcbmltcG9ydCAqIGFzIGV2ZW50cyBmcm9tICdAYXdzLWNkay9hd3MtZXZlbnRzJztcclxuaW1wb3J0ICogYXMgdGFyZ2V0cyBmcm9tICdAYXdzLWNkay9hd3MtZXZlbnRzLXRhcmdldHMnO1xyXG5pbXBvcnQgKiBhcyBzc20gZnJvbSAnQGF3cy1jZGsvYXdzLXNzbSc7XHJcbmltcG9ydCBpYW0gPSByZXF1aXJlKFwiLi4vbm9kZV9tb2R1bGVzL0Bhd3MtY2RrL2F3cy1jbG91ZHdhdGNoL25vZGVfbW9kdWxlcy9AYXdzLWNkay9hd3MtaWFtXCIpOyAvL1RoZXJlJ3Mgc29tZSBidWcgd2l0aCBpbXBvcnRpbmcgdGhlIGlhbSBtb2R1bGUuLi4gc2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9hd3MvYXdzLWNkay9pc3N1ZXMvODQxMFxyXG5cclxuZXhwb3J0IGNsYXNzIENka1Byb2plY3RTdGFjayBleHRlbmRzIGNkay5TdGFjayB7XHJcbiAgY29uc3RydWN0b3Ioc2NvcGU6IGNkay5Db25zdHJ1Y3QsIGlkOiBzdHJpbmcsIHByb3BzPzogY2RrLlN0YWNrUHJvcHMpIHtcclxuICAgIHN1cGVyKHNjb3BlLCBpZCwgcHJvcHMpO1xyXG5cclxuICAgIC8vRHluYW1vREIgVGFibGUgRGVmaW5pdGlvblxyXG4gICAgY29uc3QgZ2FtZVRhYmxlID0gbmV3IGR5bmFtb2RiLlRhYmxlKHRoaXMsICdhd3MtY2RrLWR5bmFtb2RiLWdhbWVUYWJsZScsIHtcclxuICAgICAgcGFydGl0aW9uS2V5OiB7IG5hbWU6ICdwYXJ0aXRpb25LZXknLCB0eXBlOiBkeW5hbW9kYi5BdHRyaWJ1dGVUeXBlLlNUUklORyB9LFxyXG4gICAgICBzb3J0S2V5OiB7IG5hbWU6ICdzb3J0S2V5JywgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5TVFJJTkcgfSxcclxuICAgICAgdGltZVRvTGl2ZUF0dHJpYnV0ZTogXCJleHBpcmF0aW9uRGF0ZVwiXHJcbiAgICB9KTtcclxuXHJcbiAgICBnYW1lVGFibGUuYWRkR2xvYmFsU2Vjb25kYXJ5SW5kZXgoe1xyXG4gICAgICBpbmRleE5hbWU6ICdpdGVtVHlwZUluZGV4JyxcclxuICAgICAgcGFydGl0aW9uS2V5OiB7bmFtZTogJ2l0ZW1UeXBlJywgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5TVFJJTkd9LFxyXG4gICAgICBzb3J0S2V5OiB7bmFtZTogJ3NvcnRLZXknLCB0eXBlOiBkeW5hbW9kYi5BdHRyaWJ1dGVUeXBlLlNUUklOR30sXHJcbiAgICAgIHJlYWRDYXBhY2l0eTogMSxcclxuICAgICAgd3JpdGVDYXBhY2l0eTogMSxcclxuICAgICAgcHJvamVjdGlvblR5cGU6IGR5bmFtb2RiLlByb2plY3Rpb25UeXBlLkFMTCxcclxuICAgIH0pO1xyXG5cclxuICAgIGdhbWVUYWJsZS5hZGRHbG9iYWxTZWNvbmRhcnlJbmRleCh7XHJcbiAgICAgIGluZGV4TmFtZTogJ2NvbGxlY3Rpb25JREluZGV4JyxcclxuICAgICAgcGFydGl0aW9uS2V5OiB7bmFtZTogJ2NvbGxlY3Rpb25JRCcsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuU1RSSU5HfSxcclxuICAgICAgc29ydEtleToge25hbWU6ICdzb3J0S2V5JywgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5TVFJJTkd9LFxyXG4gICAgICByZWFkQ2FwYWNpdHk6IDEsXHJcbiAgICAgIHdyaXRlQ2FwYWNpdHk6IDEsXHJcbiAgICAgIHByb2plY3Rpb25UeXBlOiBkeW5hbW9kYi5Qcm9qZWN0aW9uVHlwZS5BTEwsXHJcbiAgICB9KTtcclxuICAgIFxyXG4gICAgZ2FtZVRhYmxlLmFkZEdsb2JhbFNlY29uZGFyeUluZGV4KHtcclxuICAgICAgaW5kZXhOYW1lOiAndXNlcklESW5kZXgnLFxyXG4gICAgICBwYXJ0aXRpb25LZXk6IHtuYW1lOiAndXNlcklEJywgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5TVFJJTkd9LFxyXG4gICAgICBzb3J0S2V5OiB7bmFtZTogJ2l0ZW1UeXBlJywgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5TVFJJTkd9LFxyXG4gICAgICByZWFkQ2FwYWNpdHk6IDEsXHJcbiAgICAgIHdyaXRlQ2FwYWNpdHk6IDEsXHJcbiAgICAgIHByb2plY3Rpb25UeXBlOiBkeW5hbW9kYi5Qcm9qZWN0aW9uVHlwZS5BTEwsXHJcbiAgICB9KTtcclxuICAgIFxyXG4gICAgY29uc3QgcHJpY2VEYXRhVVJMID0gc3NtLlN0cmluZ1BhcmFtZXRlci5mcm9tU3RyaW5nUGFyYW1ldGVyQXR0cmlidXRlcyh0aGlzLCAncHJpY2VEYXRhVXJsJywge1xyXG4gICAgICBwYXJhbWV0ZXJOYW1lOiAnY2RrLXByb2plY3QtcHJpY2VEYXRhVVJMJyxcclxuICAgIH0pLnN0cmluZ1ZhbHVlO1xyXG5cclxuICAgIGNvbnN0IHNlc1NvdXJjZUVtYWlsQWRkcmVzcyA9IHNzbS5TdHJpbmdQYXJhbWV0ZXIuZnJvbVN0cmluZ1BhcmFtZXRlckF0dHJpYnV0ZXModGhpcywgJ3Nlc1NvdXJjZUVtYWlsQWRkcmVzcycsIHtcclxuICAgICAgcGFyYW1ldGVyTmFtZTogJ2Nkay1wcm9qZWN0LXNlc1NvdXJjZUVtYWlsQWRkcmVzcydcclxuICAgIH0pLnN0cmluZ1ZhbHVlO1xyXG5cclxuICAgICAgICAvL0xhbWJkYSBGdW5jdGlvblxyXG4gICAgY29uc3QgbGFtYmRhRnVuY3Rpb24gPSBuZXcgbGFtYmRhLkZ1bmN0aW9uKHRoaXMsICdhd3MtY2RrLWdhbWVBUEktZnVuY3Rpb24nLCB7XHJcbiAgICAgIGNvZGU6IGxhbWJkYS5Db2RlLmZyb21Bc3NldChcImZ1bmN0aW9uc1wiKSxcclxuICAgICAgaGFuZGxlcjogJ2luZGV4LmhhbmRsZXInLFxyXG4gICAgICBydW50aW1lOiBsYW1iZGEuUnVudGltZS5OT0RFSlNfMTRfWCxcclxuICAgICAgZW52aXJvbm1lbnQ6IHtcclxuICAgICAgICBEWU5BTU9fREJfR0FNRV9UQUJMRTogZ2FtZVRhYmxlLnRhYmxlTmFtZSxcclxuICAgICAgICBQUklDRV9EQVRBX1VSTDogcHJpY2VEYXRhVVJMXHJcbiAgICAgIH0sXHJcbiAgICAgIHRpbWVvdXQ6IGNkay5EdXJhdGlvbi5zZWNvbmRzKDMwKSxcclxuICAgICAgZGVzY3JpcHRpb246ICdMYW1iZGEgcmVzcG9uc2libGUgZm9yIGhhbmRsaW5nIHRoZSBHYW1lIEFQSSBwdWJsaWMgZW5kcG9pbnRzJ1xyXG4gICAgfSk7XHJcblxyXG4gICAgY29uc3Qgbm90aWZpY2F0aW9uc0xhbWJkYSA9IG5ldyBsYW1iZGEuRnVuY3Rpb24odGhpcywgJ2F3cy1jZGstbm90aWZpY2F0aW9ucy1mdW5jdGlvbicsIHtcclxuICAgICAgY29kZTogbGFtYmRhLkNvZGUuZnJvbUFzc2V0KFwiZnVuY3Rpb25zXCIpLFxyXG4gICAgICBoYW5kbGVyOiAnbm90aWZpY2F0aW9ucy5oYW5kbGVyJyxcclxuICAgICAgcnVudGltZTogbGFtYmRhLlJ1bnRpbWUuTk9ERUpTXzE0X1gsXHJcbiAgICAgIGVudmlyb25tZW50OiB7XHJcbiAgICAgICAgRFlOQU1PX0RCX0dBTUVfVEFCTEU6IGdhbWVUYWJsZS50YWJsZU5hbWUsXHJcbiAgICAgICAgUFJJQ0VfREFUQV9VUkw6IHByaWNlRGF0YVVSTCxcclxuICAgICAgICBTRVNfU09VUkNFX0VNQUlMX0FERFJFU1M6IHNlc1NvdXJjZUVtYWlsQWRkcmVzc1xyXG4gICAgICB9LFxyXG4gICAgICB0aW1lb3V0OiBjZGsuRHVyYXRpb24uc2Vjb25kcygzMCksXHJcbiAgICAgIGRlc2NyaXB0aW9uOiAnTGFtYmRhIHJlc3BvbnNpYmxlIGZvciBzZW5kaW5nIENvbGxlY3Rpb24gbm90aWZpY2F0aW9ucydcclxuICAgIH0pO1xyXG5cclxuICAgIGNvbnN0IHNlc0xhbWJkYVBvbGljeSA9IG5ldyBpYW0uUG9saWN5U3RhdGVtZW50KHtcclxuICAgICAgZWZmZWN0OiBpYW0uRWZmZWN0LkFMTE9XLFxyXG4gICAgICBhY3Rpb25zOiBbXCJzZXM6U2VuZEVtYWlsXCJdLFxyXG4gICAgICByZXNvdXJjZXM6IFtcIipcIl0sXHJcbiAgICB9KTtcclxuXHJcbiAgICAvL1J1bnMgdGhlIFdpc2hsaXN0IE5vdGlmaWNhdGlvbnMgYXQgbWlkbmlnaHQgZXZlcnkgd2Vla2RheVxyXG4gICAgY29uc3QgZXZlbnRSdWxlID0gbmV3IGV2ZW50cy5SdWxlKHRoaXMsICdzY2hlZHVsZVJ1bGUnLCB7XHJcbiAgICAgIHNjaGVkdWxlOiBldmVudHMuU2NoZWR1bGUuZXhwcmVzc2lvbignY3JvbigwIDUgPyAqIE1PTi1GUkkgKiknKVxyXG4gICAgfSk7XHJcbiAgICBldmVudFJ1bGUuYWRkVGFyZ2V0KG5ldyB0YXJnZXRzLkxhbWJkYUZ1bmN0aW9uKG5vdGlmaWNhdGlvbnNMYW1iZGEpKTtcclxuXHJcbiAgICBsYW1iZGFGdW5jdGlvbi5hZGRUb1JvbGVQb2xpY3koc2VzTGFtYmRhUG9saWN5KTtcclxuICAgIG5vdGlmaWNhdGlvbnNMYW1iZGEuYWRkVG9Sb2xlUG9saWN5KHNlc0xhbWJkYVBvbGljeSk7XHJcbiAgICBnYW1lVGFibGUuZ3JhbnRSZWFkV3JpdGVEYXRhKGxhbWJkYUZ1bmN0aW9uKTsgXHJcbiAgICBnYW1lVGFibGUuZ3JhbnRSZWFkV3JpdGVEYXRhKG5vdGlmaWNhdGlvbnNMYW1iZGEpO1xyXG5cclxuICAgIC8vQVBJIEdhdGV3YXlcclxuICAgIGNvbnN0IHJlc3RBUEkgPSBuZXcgYXBpZ2F0ZXdheS5MYW1iZGFSZXN0QXBpKHRoaXMsIFwiYXdzLWNkay1yZXN0LWFwaVwiLCB7XHJcbiAgICAgIGhhbmRsZXI6IGxhbWJkYUZ1bmN0aW9uLFxyXG4gICAgICBwcm94eTogZmFsc2UsXHJcbiAgICAgIHJlc3RBcGlOYW1lOiBcIkdhbWUgTWFuYWdlbWVudCBBUElcIlxyXG4gICAgfSk7XHJcbiAgICBjb25zdCBhcGlJbnRlZ3JhdGlvbiA9IG5ldyBhcGlnYXRld2F5LkxhbWJkYUludGVncmF0aW9uKGxhbWJkYUZ1bmN0aW9uKTtcclxuICAgIFxyXG4gICAgLy9Db2duaXRvXHJcbiAgICBjb25zdCB1c2VyUG9vbCA9IG5ldyBjb2duaXRvLlVzZXJQb29sKHRoaXMsICd1c2VyUG9vbCcsIHtcclxuICAgICAgc2VsZlNpZ25VcEVuYWJsZWQ6IHRydWUsXHJcbiAgICAgIHVzZXJWZXJpZmljYXRpb246IHtcclxuICAgICAgICBlbWFpbFN1YmplY3Q6ICdWZXJpZnkgeW91ciBlbWFpbCEnLFxyXG4gICAgICAgIGVtYWlsQm9keTogJ0hlbGxvLCBUaGFua3MgZm9yIHNpZ25pbmcgdXAhIHsjI1ZlcmlmeSBFbWFpbCMjfScsXHJcbiAgICAgICAgZW1haWxTdHlsZTogY29nbml0by5WZXJpZmljYXRpb25FbWFpbFN0eWxlLkxJTktcclxuICAgICAgfSxcclxuICAgICAgc2lnbkluQWxpYXNlczoge1xyXG4gICAgICAgIHVzZXJuYW1lOiB0cnVlLFxyXG4gICAgICAgIGVtYWlsOiB0cnVlXHJcbiAgICAgIH0sXHJcbiAgICAgIHN0YW5kYXJkQXR0cmlidXRlczoge1xyXG4gICAgICAgIGVtYWlsOiB7XHJcbiAgICAgICAgICByZXF1aXJlZDogdHJ1ZVxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfSk7XHJcblxyXG4gICAgY29uc3Qgb0F1dGhTZWNyZXQgPSBzZWNyZXRzbWFuYWdlci5TZWNyZXQuZnJvbVNlY3JldENvbXBsZXRlQXJuKFxyXG4gICAgICB0aGlzLFxyXG4gICAgICAnZGItb2F1dGgtaWQnLFxyXG4gICAgICAnYXJuOmF3czpzZWNyZXRzbWFuYWdlcjp1cy1lYXN0LTE6MjIxMTc2MTQwMzY1OnNlY3JldDoyMjAwODYyMTYwMTUtaTMzc3RicWpiZmg1cmxtOXFpM3VhaW1iOWVvNmducnMuYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20tNnhoWkhZJ1xyXG4gICAgKTtcclxuXHJcbiAgICBjb25zdCB1c2VyUG9vbElkZW50aXR5UHJvdmlkZXJHb29nbGUgPSBuZXcgY29nbml0by5Vc2VyUG9vbElkZW50aXR5UHJvdmlkZXJHb29nbGUodGhpcywgJ3VzZXJQb29sR29vZ2xlJywge1xyXG4gICAgICB1c2VyUG9vbDogdXNlclBvb2wsXHJcbiAgICAgIGNsaWVudElkOiBvQXV0aFNlY3JldC5zZWNyZXROYW1lLFxyXG4gICAgICBjbGllbnRTZWNyZXQ6IG9BdXRoU2VjcmV0LnNlY3JldFZhbHVlLnRvU3RyaW5nKCksXHJcbiAgICAgIGF0dHJpYnV0ZU1hcHBpbmc6IHtcclxuICAgICAgICBlbWFpbDoge1xyXG4gICAgICAgICAgYXR0cmlidXRlTmFtZTogY29nbml0by5Qcm92aWRlckF0dHJpYnV0ZS5HT09HTEVfRU1BSUwuYXR0cmlidXRlTmFtZSxcclxuICAgICAgICB9LFxyXG4gICAgICAgIGN1c3RvbToge1xyXG4gICAgICAgICAgZW1haWxfdmVyaWZpZWQ6IGNvZ25pdG8uUHJvdmlkZXJBdHRyaWJ1dGUub3RoZXIoJ2VtYWlsX3ZlcmlmaWVkJyksXHJcbiAgICAgICAgfVxyXG4gICAgICB9LFxyXG4gICAgICBzY29wZXM6IFsncHJvZmlsZScsJ2VtYWlsJywnb3BlbmlkJ11cclxuICAgIH0pO1xyXG5cclxuICAgIGNvbnN0IHVzZXJQb29sQ2xpZW50ID0gbmV3IGNvZ25pdG8uVXNlclBvb2xDbGllbnQodGhpcywgJ3VzZXJQb29sQ2xpZW50Jywge1xyXG4gICAgICB1c2VyUG9vbDogdXNlclBvb2wsXHJcbiAgICAgIG9BdXRoOiB7XHJcbiAgICAgICAgY2FsbGJhY2tVcmxzOiBbJ2h0dHBzOi8vZXhhbXBsZS5jb20vY2FsbGJhY2snXSxcclxuICAgICAgICBsb2dvdXRVcmxzOiBbJ2h0dHBzOi8vZXhhbXBsZS5jb20vc2lnbm91dCddLFxyXG4gICAgICAgIGZsb3dzOiB7XHJcbiAgICAgICAgICBhdXRob3JpemF0aW9uQ29kZUdyYW50OiBmYWxzZSxcclxuICAgICAgICAgIGltcGxpY2l0Q29kZUdyYW50OiB0cnVlLFxyXG4gICAgICAgICAgY2xpZW50Q3JlZGVudGlhbHM6IGZhbHNlXHJcbiAgICAgICAgfSxcclxuICAgICAgICBzY29wZXM6IFtjb2duaXRvLk9BdXRoU2NvcGUuT1BFTklEXVxyXG4gICAgICB9XHJcbiAgICB9KTtcclxuXHJcbiAgICBjb25zdCB1c2VyUG9vbERvbWFpbiA9IG5ldyBjb2duaXRvLlVzZXJQb29sRG9tYWluKHRoaXMsICd1c2VyUG9vbERvbWFpbicsIHtcclxuICAgICAgdXNlclBvb2w6IHVzZXJQb29sLFxyXG4gICAgICBjb2duaXRvRG9tYWluOiB7XHJcbiAgICAgICAgZG9tYWluUHJlZml4OiAnY2RrZ2FtZWFwaWRlbW8nXHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG5cclxuICAgIGNvbnN0IGF1dGhvcml6ZXIgPSBuZXcgYXBpZ2F0ZXdheS5DZm5BdXRob3JpemVyKHRoaXMsICdjZm5BdXRoJywge1xyXG4gICAgICByZXN0QXBpSWQ6IHJlc3RBUEkucmVzdEFwaUlkLFxyXG4gICAgICBuYW1lOiAnZ2FtZUF1dGhvcml6ZXInLFxyXG4gICAgICB0eXBlOiAnQ09HTklUT19VU0VSX1BPT0xTJyxcclxuICAgICAgaWRlbnRpdHlTb3VyY2U6ICdtZXRob2QucmVxdWVzdC5oZWFkZXIuQXV0aG9yaXphdGlvbicsXHJcbiAgICAgIHByb3ZpZGVyQXJuczogW3VzZXJQb29sLnVzZXJQb29sQXJuXVxyXG4gICAgfSlcclxuXHJcbiAgICAvL01ldGhvZCBzY2hlbWFcclxuICAgIGNvbnN0IGFkZEdhbWVNb2RlbCA9IHJlc3RBUEkuYWRkTW9kZWwoJ0FkZFJlcXVlc3RNb2RlbCcsIHtcclxuICAgICAgY29udGVudFR5cGU6ICdhcHBsaWNhdGlvbi9qc29uJyxcclxuICAgICAgbW9kZWxOYW1lOiAnQWRkUmVxdWVzdE1vZGVsJyxcclxuICAgICAgc2NoZW1hOiB7XHJcbiAgICAgIHNjaGVtYTogYXBpZ2F0ZXdheS5Kc29uU2NoZW1hVmVyc2lvbi5EUkFGVDQsXHJcbiAgICAgIHRpdGxlOiAncG9zdE1vZGVsJyxcclxuICAgICAgdHlwZTogYXBpZ2F0ZXdheS5Kc29uU2NoZW1hVHlwZS5PQkpFQ1QsXHJcbiAgICAgIHByb3BlcnRpZXM6IHtcclxuICAgICAgICAgIGdhbWVOYW1lOiB7IHR5cGU6IGFwaWdhdGV3YXkuSnNvblNjaGVtYVR5cGUuU1RSSU5HIH0sXHJcbiAgICAgICAgICB5ZWFyUmVsZWFzZWQ6IHsgdHlwZTogYXBpZ2F0ZXdheS5Kc29uU2NoZW1hVHlwZS5JTlRFR0VSIH0sXHJcbiAgICAgICAgICBnZW5yZTogeyB0eXBlOiBhcGlnYXRld2F5Lkpzb25TY2hlbWFUeXBlLlNUUklORyB9LFxyXG4gICAgICAgICAgZGV2ZWxvcGVyOiB7IHR5cGU6IGFwaWdhdGV3YXkuSnNvblNjaGVtYVR5cGUuU1RSSU5HIH0sXHJcbiAgICAgICAgICBjb25zb2xlOiB7IHR5cGU6IGFwaWdhdGV3YXkuSnNvblNjaGVtYVR5cGUuU1RSSU5HIH0sICAgICAgICAgIFxyXG4gICAgICB9LFxyXG4gICAgICByZXF1aXJlZDogWydnYW1lTmFtZSddLFxyXG4gICAgICB9LFxyXG4gICAgfSk7XHJcbiAgICBcclxuICAgIGNvbnN0IG1vZGlmeUdhbWVNb2RlbCA9IHJlc3RBUEkuYWRkTW9kZWwoJ01vZGlmeVJlcXVlc3RNb2RlbCcsIHtcclxuICAgICAgY29udGVudFR5cGU6ICdhcHBsaWNhdGlvbi9qc29uJyxcclxuICAgICAgbW9kZWxOYW1lOiAnTW9kaWZ5UmVxdWVzdE1vZGVsJyxcclxuICAgICAgc2NoZW1hOiB7XHJcbiAgICAgIHNjaGVtYTogYXBpZ2F0ZXdheS5Kc29uU2NoZW1hVmVyc2lvbi5EUkFGVDQsXHJcbiAgICAgIHRpdGxlOiAncG9zdE1vZGVsJyxcclxuICAgICAgdHlwZTogYXBpZ2F0ZXdheS5Kc29uU2NoZW1hVHlwZS5PQkpFQ1QsXHJcbiAgICAgIHByb3BlcnRpZXM6IHtcclxuICAgICAgICAgIGlkOiB7IHR5cGU6IGFwaWdhdGV3YXkuSnNvblNjaGVtYVR5cGUuU1RSSU5HIH0sXHJcbiAgICAgICAgICBnYW1lTmFtZTogeyB0eXBlOiBhcGlnYXRld2F5Lkpzb25TY2hlbWFUeXBlLlNUUklORyB9LFxyXG4gICAgICAgICAgeWVhclJlbGVhc2VkOiB7IHR5cGU6IGFwaWdhdGV3YXkuSnNvblNjaGVtYVR5cGUuSU5URUdFUiB9LFxyXG4gICAgICAgICAgZ2VucmU6IHsgdHlwZTogYXBpZ2F0ZXdheS5Kc29uU2NoZW1hVHlwZS5TVFJJTkcgfSxcclxuICAgICAgICAgIGRldmVsb3BlcjogeyB0eXBlOiBhcGlnYXRld2F5Lkpzb25TY2hlbWFUeXBlLlNUUklORyB9LFxyXG4gICAgICAgICAgY29uc29sZTogeyB0eXBlOiBhcGlnYXRld2F5Lkpzb25TY2hlbWFUeXBlLlNUUklORyB9LCAgICAgICAgICBcclxuICAgICAgfSxcclxuICAgICAgcmVxdWlyZWQ6IFsnZ2FtZU5hbWUnLCAnaWQnXSxcclxuICAgICAgfSxcclxuICAgIH0pO1xyXG4gICAgXHJcbiAgICBjb25zdCBnZXRDb2xsZWN0aW9uTW9kZWwgPSByZXN0QVBJLmFkZE1vZGVsKCdXaXNobGlzdFJlcXVlc3RNb2RlbCcsIHtcclxuICAgICAgY29udGVudFR5cGU6ICdhcHBsaWNhdGlvbi9qc29uJyxcclxuICAgICAgbW9kZWxOYW1lOiAnV2lzaGxpc3RSZXF1ZXN0TW9kZWwnLFxyXG4gICAgICBzY2hlbWE6IHtcclxuICAgICAgc2NoZW1hOiBhcGlnYXRld2F5Lkpzb25TY2hlbWFWZXJzaW9uLkRSQUZUNCxcclxuICAgICAgdGl0bGU6ICd3aXNobGlzdE1vZGVsJyxcclxuICAgICAgdHlwZTogYXBpZ2F0ZXdheS5Kc29uU2NoZW1hVHlwZS5PQkpFQ1QsXHJcbiAgICAgIHByb3BlcnRpZXM6IHtcclxuICAgICAgICAgIGNvbGxlY3Rpb25JRDogeyB0eXBlOiBhcGlnYXRld2F5Lkpzb25TY2hlbWFUeXBlLlNUUklORyB9LCAgICAgICAgICAgICAgICAgXHJcbiAgICAgIH0sXHJcbiAgICAgIHJlcXVpcmVkOiBbJ2NvbGxlY3Rpb25JRCddLFxyXG4gICAgICB9LFxyXG4gICAgfSlcclxuXHJcbiAgICBjb25zdCBhZGRHYW1lVG9XaXNobGlzdE1vZGVsID0gcmVzdEFQSS5hZGRNb2RlbCgnV2lzaGxpc3RBZGRSZXF1ZXN0TW9kZWwnLCB7XHJcbiAgICAgIGNvbnRlbnRUeXBlOiAnYXBwbGljYXRpb24vanNvbicsXHJcbiAgICAgIG1vZGVsTmFtZTogJ1dpc2hsaXN0QWRkUmVxdWVzdE1vZGVsJyxcclxuICAgICAgc2NoZW1hOiB7XHJcbiAgICAgIHNjaGVtYTogYXBpZ2F0ZXdheS5Kc29uU2NoZW1hVmVyc2lvbi5EUkFGVDQsXHJcbiAgICAgIHRpdGxlOiAnd2lzaGxpc3RNb2RlbCcsXHJcbiAgICAgIHR5cGU6IGFwaWdhdGV3YXkuSnNvblNjaGVtYVR5cGUuT0JKRUNULFxyXG4gICAgICBwcm9wZXJ0aWVzOiB7XHJcbiAgICAgICAgICBjb2xsZWN0aW9uSUQ6IHsgdHlwZTogYXBpZ2F0ZXdheS5Kc29uU2NoZW1hVHlwZS5TVFJJTkcgfSxcclxuICAgICAgICAgIGdhbWVOYW1lOiB7IHR5cGU6IGFwaWdhdGV3YXkuSnNvblNjaGVtYVR5cGUuU1RSSU5HIH0sXHJcbiAgICAgICAgICB5ZWFyUmVsZWFzZWQ6IHsgdHlwZTogYXBpZ2F0ZXdheS5Kc29uU2NoZW1hVHlwZS5JTlRFR0VSIH0sXHJcbiAgICAgICAgICBnZW5yZTogeyB0eXBlOiBhcGlnYXRld2F5Lkpzb25TY2hlbWFUeXBlLlNUUklORyB9LFxyXG4gICAgICAgICAgZGV2ZWxvcGVyOiB7IHR5cGU6IGFwaWdhdGV3YXkuSnNvblNjaGVtYVR5cGUuU1RSSU5HIH0sXHJcbiAgICAgICAgICBjb25zb2xlOiB7IHR5cGU6IGFwaWdhdGV3YXkuSnNvblNjaGVtYVR5cGUuU1RSSU5HIH0sXHJcbiAgICAgICAgICBkZXNpcmVkUHJpY2U6IHsgdHlwZTogYXBpZ2F0ZXdheS5Kc29uU2NoZW1hVHlwZS5JTlRFR0VSIH0sXHJcbiAgICAgICAgICBkZXNpcmVkQ29uZGl0aW9uOiB7IHR5cGU6IGFwaWdhdGV3YXkuSnNvblNjaGVtYVR5cGUuU1RSSU5HIH0sICAgICAgICAgICAgICAgICAgIFxyXG4gICAgICB9LFxyXG4gICAgICByZXF1aXJlZDogWydnYW1lTmFtZScsICdjb2xsZWN0aW9uSUQnXSxcclxuICAgICAgfSxcclxuICAgIH0pXHJcblxyXG4gICAgY29uc3QgbW9kaWZ5R2FtZUluV2lzaGxpc3RNb2RlbCA9IHJlc3RBUEkuYWRkTW9kZWwoJ1dpc2hsaXN0TW9kaWZ5UmVxdWVzdE1vZGVsJywge1xyXG4gICAgICBjb250ZW50VHlwZTogJ2FwcGxpY2F0aW9uL2pzb24nLFxyXG4gICAgICBtb2RlbE5hbWU6ICdXaXNobGlzdE1vZGlmeVJlcXVlc3RNb2RlbCcsXHJcbiAgICAgIHNjaGVtYToge1xyXG4gICAgICBzY2hlbWE6IGFwaWdhdGV3YXkuSnNvblNjaGVtYVZlcnNpb24uRFJBRlQ0LFxyXG4gICAgICB0aXRsZTogJ3dpc2hsaXN0TW9kZWwnLFxyXG4gICAgICB0eXBlOiBhcGlnYXRld2F5Lkpzb25TY2hlbWFUeXBlLk9CSkVDVCxcclxuICAgICAgcHJvcGVydGllczoge1xyXG4gICAgICAgICAgaWQ6IHsgdHlwZTogYXBpZ2F0ZXdheS5Kc29uU2NoZW1hVHlwZS5TVFJJTkcgfSxcclxuICAgICAgICAgIGNvbGxlY3Rpb25JRDogeyB0eXBlOiBhcGlnYXRld2F5Lkpzb25TY2hlbWFUeXBlLlNUUklORyB9LFxyXG4gICAgICAgICAgZ2FtZU5hbWU6IHsgdHlwZTogYXBpZ2F0ZXdheS5Kc29uU2NoZW1hVHlwZS5TVFJJTkcgfSxcclxuICAgICAgICAgIHllYXJSZWxlYXNlZDogeyB0eXBlOiBhcGlnYXRld2F5Lkpzb25TY2hlbWFUeXBlLklOVEVHRVIgfSxcclxuICAgICAgICAgIGdlbnJlOiB7IHR5cGU6IGFwaWdhdGV3YXkuSnNvblNjaGVtYVR5cGUuU1RSSU5HIH0sXHJcbiAgICAgICAgICBkZXZlbG9wZXI6IHsgdHlwZTogYXBpZ2F0ZXdheS5Kc29uU2NoZW1hVHlwZS5TVFJJTkcgfSxcclxuICAgICAgICAgIGNvbnNvbGU6IHsgdHlwZTogYXBpZ2F0ZXdheS5Kc29uU2NoZW1hVHlwZS5TVFJJTkcgfSxcclxuICAgICAgICAgIGRlc2lyZWRQcmljZTogeyB0eXBlOiBhcGlnYXRld2F5Lkpzb25TY2hlbWFUeXBlLklOVEVHRVIgfSxcclxuICAgICAgICAgIGRlc2lyZWRDb25kaXRpb246IHsgdHlwZTogYXBpZ2F0ZXdheS5Kc29uU2NoZW1hVHlwZS5TVFJJTkcgfSwgICAgICAgICAgICAgICAgICAgXHJcbiAgICAgIH0sXHJcbiAgICAgIHJlcXVpcmVkOiBbJ2dhbWVOYW1lJywgJ2lkJywgJ2NvbGxlY3Rpb25JRCddLFxyXG4gICAgICB9LFxyXG4gICAgfSlcclxuICAgIGNvbnN0IGFkZFByaWNlTW9uaXRvclRvV2lzaGxpc3RHYW1lID0gcmVzdEFQSS5hZGRNb2RlbCgnUHJpY2VNb25pdG9yUmVxdWVzdE1vbmRlbCcsIHtcclxuICAgICAgY29udGVudFR5cGU6ICdhcHBsaWNhdGlvbi9qc29uJyxcclxuICAgICAgbW9kZWxOYW1lOiAnYWRkUHJpY2VNb25pdG9yJyxcclxuICAgICAgc2NoZW1hOiB7XHJcbiAgICAgIHNjaGVtYTogYXBpZ2F0ZXdheS5Kc29uU2NoZW1hVmVyc2lvbi5EUkFGVDQsXHJcbiAgICAgIHRpdGxlOiAnd2lzaGxpc3RNb2RlbCcsXHJcbiAgICAgIHR5cGU6IGFwaWdhdGV3YXkuSnNvblNjaGVtYVR5cGUuT0JKRUNULFxyXG4gICAgICBwcm9wZXJ0aWVzOiB7XHJcbiAgICAgICAgICBpZDogeyB0eXBlOiBhcGlnYXRld2F5Lkpzb25TY2hlbWFUeXBlLlNUUklORyB9LFxyXG4gICAgICAgICAgY29sbGVjdGlvbklEOiB7IHR5cGU6IGFwaWdhdGV3YXkuSnNvblNjaGVtYVR5cGUuU1RSSU5HIH0sXHJcbiAgICAgICAgICBkZXNpcmVkUHJpY2U6IHsgdHlwZTogYXBpZ2F0ZXdheS5Kc29uU2NoZW1hVHlwZS5JTlRFR0VSIH0sXHJcbiAgICAgICAgICBkZXNpcmVkQ29uZGl0aW9uOiB7IHR5cGU6IGFwaWdhdGV3YXkuSnNvblNjaGVtYVR5cGUuU1RSSU5HIH0sICAgICAgICAgICAgICAgICAgIFxyXG4gICAgICB9LFxyXG4gICAgICByZXF1aXJlZDogWydpZCcsICdjb2xsZWN0aW9uSUQnLCAnZGVzaXJlZFByaWNlJywgJ2Rlc2lyZWRDb25kaXRpb24nXSxcclxuICAgICAgfVxyXG4gICAgfSk7XHJcblxyXG4gICAgLy9NZXRob2QgZGVmaW5pdGlvbnNcclxuICAgIGNvbnN0IGdldEdhbWUgPSByZXN0QVBJLnJvb3QuYWRkUmVzb3VyY2UoXCJnZXRHYW1lXCIpLmFkZE1ldGhvZChcIkdFVFwiLCBhcGlJbnRlZ3JhdGlvbiwge1xyXG4gICAgICBhdXRob3JpemF0aW9uVHlwZTogYXBpZ2F0ZXdheS5BdXRob3JpemF0aW9uVHlwZS5DT0dOSVRPLFxyXG4gICAgICBhdXRob3JpemVyOiB7XHJcbiAgICAgICAgYXV0aG9yaXplcklkOiBhdXRob3JpemVyLnJlZlxyXG4gICAgICB9LFxyXG4gICAgICByZXF1ZXN0UGFyYW1ldGVyczoge1xyXG4gICAgICAgIFwibWV0aG9kLnJlcXVlc3QucXVlcnlzdHJpbmcuZ2FtZU5hbWVcIjogdHJ1ZSxcclxuICAgICAgICBcIm1ldGhvZC5yZXF1ZXN0LnF1ZXJ5c3RyaW5nLmlkXCI6IHRydWUsICAgICAgICBcclxuICAgICAgfSxcclxuICAgICAgcmVxdWVzdFZhbGlkYXRvcjogbmV3IGFwaWdhdGV3YXkuUmVxdWVzdFZhbGlkYXRvcihyZXN0QVBJLCAnZ2V0LXJlcXVlc3QtdmFsaWRhdG9yJywge1xyXG4gICAgICAgIHJlc3RBcGk6IHJlc3RBUEksXHJcbiAgICAgICAgdmFsaWRhdGVSZXF1ZXN0Qm9keTogZmFsc2UsXHJcbiAgICAgICAgdmFsaWRhdGVSZXF1ZXN0UGFyYW1ldGVyczogdHJ1ZSxcclxuICAgICAgfSlcclxuICAgIH0pO1xyXG5cclxuICAgIHJlc3RBUEkucm9vdC5hZGRSZXNvdXJjZShcImxpc3RHYW1lc1wiKS5hZGRNZXRob2QoXCJHRVRcIiwgYXBpSW50ZWdyYXRpb24sIHtcclxuICAgICAgYXV0aG9yaXphdGlvblR5cGU6IGFwaWdhdGV3YXkuQXV0aG9yaXphdGlvblR5cGUuQ09HTklUTyxcclxuICAgICAgYXV0aG9yaXplcjoge1xyXG4gICAgICAgIGF1dGhvcml6ZXJJZDogYXV0aG9yaXplci5yZWZcclxuICAgICAgfVxyXG4gICAgfSk7XHJcbiAgICBcclxuICAgIHJlc3RBUEkucm9vdC5hZGRSZXNvdXJjZShcImNyZWF0ZUdhbWVcIikuYWRkTWV0aG9kKFwiUE9TVFwiLCBhcGlJbnRlZ3JhdGlvbiwge1xyXG4gICAgICBhdXRob3JpemF0aW9uVHlwZTogYXBpZ2F0ZXdheS5BdXRob3JpemF0aW9uVHlwZS5DT0dOSVRPLFxyXG4gICAgICBhdXRob3JpemVyOiB7XHJcbiAgICAgICAgYXV0aG9yaXplcklkOiBhdXRob3JpemVyLnJlZlxyXG4gICAgICB9LFxyXG4gICAgICByZXF1ZXN0TW9kZWxzOiB7ICdhcHBsaWNhdGlvbi9qc29uJzogYWRkR2FtZU1vZGVsIH0sXHJcbiAgICAgIHJlcXVlc3RWYWxpZGF0b3I6IG5ldyBhcGlnYXRld2F5LlJlcXVlc3RWYWxpZGF0b3IocmVzdEFQSSwgXCJjcmVhdGUtcmVxdWVzdC12YWxpZGF0b3JcIiwge1xyXG4gICAgICAgIHJlc3RBcGk6IHJlc3RBUEksXHJcbiAgICAgICAgdmFsaWRhdGVSZXF1ZXN0Qm9keTogdHJ1ZSxcclxuICAgICAgICB2YWxpZGF0ZVJlcXVlc3RQYXJhbWV0ZXJzOiBmYWxzZSxcclxuICAgICAgfSlcclxuICAgIH0pO1xyXG5cclxuICAgIHJlc3RBUEkucm9vdC5hZGRSZXNvdXJjZShcIm1vZGlmeUdhbWVcIikuYWRkTWV0aG9kKFwiUFVUXCIsIGFwaUludGVncmF0aW9uLCB7XHJcbiAgICAgIGF1dGhvcml6YXRpb25UeXBlOiBhcGlnYXRld2F5LkF1dGhvcml6YXRpb25UeXBlLkNPR05JVE8sXHJcbiAgICAgIGF1dGhvcml6ZXI6IHtcclxuICAgICAgICBhdXRob3JpemVySWQ6IGF1dGhvcml6ZXIucmVmXHJcbiAgICAgIH0sXHJcbiAgICAgIHJlcXVlc3RNb2RlbHM6IHsgJ2FwcGxpY2F0aW9uL2pzb24nOiBtb2RpZnlHYW1lTW9kZWwgfSxcclxuICAgICAgcmVxdWVzdFZhbGlkYXRvcjogbmV3IGFwaWdhdGV3YXkuUmVxdWVzdFZhbGlkYXRvcihyZXN0QVBJLCAnbW9kaWZ5LXJlcXVlc3QtdmFsaWRhdG9yJywge1xyXG4gICAgICAgIHJlc3RBcGk6IHJlc3RBUEksXHJcbiAgICAgICAgdmFsaWRhdGVSZXF1ZXN0Qm9keTogdHJ1ZSxcclxuICAgICAgICB2YWxpZGF0ZVJlcXVlc3RQYXJhbWV0ZXJzOiBmYWxzZSxcclxuICAgICAgfSlcclxuICAgIH0pO1xyXG5cclxuICAgIHJlc3RBUEkucm9vdC5hZGRSZXNvdXJjZShcImRlbGV0ZUdhbWVcIikuYWRkTWV0aG9kKFwiREVMRVRFXCIsIGFwaUludGVncmF0aW9uLCB7XHJcbiAgICAgIGF1dGhvcml6YXRpb25UeXBlOiBhcGlnYXRld2F5LkF1dGhvcml6YXRpb25UeXBlLkNPR05JVE8sXHJcbiAgICAgIGF1dGhvcml6ZXI6IHtcclxuICAgICAgICBhdXRob3JpemVySWQ6IGF1dGhvcml6ZXIucmVmXHJcbiAgICAgIH0sXHJcbiAgICAgIHJlcXVlc3RNb2RlbHM6IHsgJ2FwcGxpY2F0aW9uL2pzb24nOiBtb2RpZnlHYW1lTW9kZWwgfSxcclxuICAgICAgcmVxdWVzdFZhbGlkYXRvcjogbmV3IGFwaWdhdGV3YXkuUmVxdWVzdFZhbGlkYXRvcihyZXN0QVBJLCAnZGVsZXRlLXJlcXVlc3QtdmFsaWRhdG9yJywge1xyXG4gICAgICAgIHJlc3RBcGk6IHJlc3RBUEksXHJcbiAgICAgICAgdmFsaWRhdGVSZXF1ZXN0Qm9keTogdHJ1ZSxcclxuICAgICAgICB2YWxpZGF0ZVJlcXVlc3RQYXJhbWV0ZXJzOiBmYWxzZSxcclxuICAgICAgfSlcclxuICAgIH0pO1xyXG5cclxuICAgIGxldCB3aXNobGlzdEFQSSA9IHJlc3RBUEkucm9vdC5hZGRSZXNvdXJjZShcImNvbGxlY3Rpb25cIikuYWRkUmVzb3VyY2UoXCJ3aXNobGlzdFwiKTtcclxuICAgIHdpc2hsaXN0QVBJLmFkZE1ldGhvZChcIkdFVFwiLCBhcGlJbnRlZ3JhdGlvbiwge1xyXG4gICAgICBhdXRob3JpemF0aW9uVHlwZTogYXBpZ2F0ZXdheS5BdXRob3JpemF0aW9uVHlwZS5DT0dOSVRPLFxyXG4gICAgICBhdXRob3JpemVyOiB7XHJcbiAgICAgICAgYXV0aG9yaXplcklkOiBhdXRob3JpemVyLnJlZlxyXG4gICAgICB9LFxyXG4gICAgICByZXF1ZXN0UGFyYW1ldGVyczoge1xyXG4gICAgICAgIFwibWV0aG9kLnJlcXVlc3QucXVlcnlzdHJpbmcuY29sbGVjdGlvbklEXCI6IHRydWUsICAgICAgICBcclxuICAgICAgfSxcclxuICAgICAgcmVxdWVzdFZhbGlkYXRvcjogbmV3IGFwaWdhdGV3YXkuUmVxdWVzdFZhbGlkYXRvcihyZXN0QVBJLCAnZ2V0LXdpc2hsaXN0LXJlcXVlc3QtdmFsaWRhdG9yJywge1xyXG4gICAgICAgIHJlc3RBcGk6IHJlc3RBUEksXHJcbiAgICAgICAgdmFsaWRhdGVSZXF1ZXN0Qm9keTogZmFsc2UsXHJcbiAgICAgICAgdmFsaWRhdGVSZXF1ZXN0UGFyYW1ldGVyczogdHJ1ZSxcclxuICAgICAgfSlcclxuICAgIH0pO1xyXG4gICAgXHJcbiAgICB3aXNobGlzdEFQSS5hZGRSZXNvdXJjZShcImFkZEdhbWVcIikuYWRkTWV0aG9kKFwiUE9TVFwiLCBhcGlJbnRlZ3JhdGlvbiwge1xyXG4gICAgICBhdXRob3JpemF0aW9uVHlwZTogYXBpZ2F0ZXdheS5BdXRob3JpemF0aW9uVHlwZS5DT0dOSVRPLFxyXG4gICAgICBhdXRob3JpemVyOiB7XHJcbiAgICAgICAgYXV0aG9yaXplcklkOiBhdXRob3JpemVyLnJlZlxyXG4gICAgICB9LFxyXG4gICAgICByZXF1ZXN0TW9kZWxzOiB7ICdhcHBsaWNhdGlvbi9qc29uJzogYWRkR2FtZVRvV2lzaGxpc3RNb2RlbCB9LFxyXG4gICAgICByZXF1ZXN0VmFsaWRhdG9yOiBuZXcgYXBpZ2F0ZXdheS5SZXF1ZXN0VmFsaWRhdG9yKHJlc3RBUEksIFwiYWRkZ2FtZS13aXNobGlzdC1yZXF1ZXN0LXZhbGlkYXRvclwiLCB7XHJcbiAgICAgICAgcmVzdEFwaTogcmVzdEFQSSxcclxuICAgICAgICB2YWxpZGF0ZVJlcXVlc3RCb2R5OiB0cnVlLFxyXG4gICAgICAgIHZhbGlkYXRlUmVxdWVzdFBhcmFtZXRlcnM6IGZhbHNlLFxyXG4gICAgICB9KVxyXG4gICAgfSk7XHJcblxyXG4gICAgd2lzaGxpc3RBUEkuYWRkUmVzb3VyY2UoXCJtb2RpZnlHYW1lXCIpLmFkZE1ldGhvZChcIlBVVFwiLCBhcGlJbnRlZ3JhdGlvbiwge1xyXG4gICAgICBhdXRob3JpemF0aW9uVHlwZTogYXBpZ2F0ZXdheS5BdXRob3JpemF0aW9uVHlwZS5DT0dOSVRPLFxyXG4gICAgICBhdXRob3JpemVyOiB7XHJcbiAgICAgICAgYXV0aG9yaXplcklkOiBhdXRob3JpemVyLnJlZlxyXG4gICAgICB9LFxyXG4gICAgICByZXF1ZXN0TW9kZWxzOiB7ICdhcHBsaWNhdGlvbi9qc29uJzogbW9kaWZ5R2FtZUluV2lzaGxpc3RNb2RlbCB9LFxyXG4gICAgICByZXF1ZXN0VmFsaWRhdG9yOiBuZXcgYXBpZ2F0ZXdheS5SZXF1ZXN0VmFsaWRhdG9yKHJlc3RBUEksIFwibW9kaWZ5Z2FtZS13aXNobGlzdC1yZXF1ZXN0LXZhbGlkYXRvclwiLCB7XHJcbiAgICAgICAgcmVzdEFwaTogcmVzdEFQSSxcclxuICAgICAgICB2YWxpZGF0ZVJlcXVlc3RCb2R5OiB0cnVlLFxyXG4gICAgICAgIHZhbGlkYXRlUmVxdWVzdFBhcmFtZXRlcnM6IGZhbHNlLFxyXG4gICAgICB9KVxyXG4gICAgfSk7XHJcblxyXG4gICAgd2lzaGxpc3RBUEkuYWRkUmVzb3VyY2UoXCJyZW1vdmVHYW1lXCIpLmFkZE1ldGhvZChcIkRFTEVURVwiLCBhcGlJbnRlZ3JhdGlvbiwge1xyXG4gICAgICBhdXRob3JpemF0aW9uVHlwZTogYXBpZ2F0ZXdheS5BdXRob3JpemF0aW9uVHlwZS5DT0dOSVRPLFxyXG4gICAgICBhdXRob3JpemVyOiB7XHJcbiAgICAgICAgYXV0aG9yaXplcklkOiBhdXRob3JpemVyLnJlZlxyXG4gICAgICB9LFxyXG4gICAgICByZXF1ZXN0TW9kZWxzOiB7ICdhcHBsaWNhdGlvbi9qc29uJzogbW9kaWZ5R2FtZUluV2lzaGxpc3RNb2RlbCB9LFxyXG4gICAgICByZXF1ZXN0VmFsaWRhdG9yOiBuZXcgYXBpZ2F0ZXdheS5SZXF1ZXN0VmFsaWRhdG9yKHJlc3RBUEksIFwiZGVsZXRlLWdhbWUtd2lzaGxpc3QtcmVxdWVzdC12YWxpZGF0b3JcIiwge1xyXG4gICAgICAgIHJlc3RBcGk6IHJlc3RBUEksXHJcbiAgICAgICAgdmFsaWRhdGVSZXF1ZXN0Qm9keTogdHJ1ZSxcclxuICAgICAgICB2YWxpZGF0ZVJlcXVlc3RQYXJhbWV0ZXJzOiBmYWxzZSxcclxuICAgICAgfSlcclxuICAgIH0pOyAgXHJcbiAgICBcclxuICAgIHdpc2hsaXN0QVBJLmFkZFJlc291cmNlKFwiYWRkUHJpY2VNb25pdG9yXCIpLmFkZE1ldGhvZChcIlBPU1RcIiwgYXBpSW50ZWdyYXRpb24sIHtcclxuICAgICAgYXV0aG9yaXphdGlvblR5cGU6IGFwaWdhdGV3YXkuQXV0aG9yaXphdGlvblR5cGUuQ09HTklUTyxcclxuICAgICAgYXV0aG9yaXplcjoge1xyXG4gICAgICAgIGF1dGhvcml6ZXJJZDogYXV0aG9yaXplci5yZWZcclxuICAgICAgfSxcclxuICAgICAgcmVxdWVzdE1vZGVsczogeyAnYXBwbGljYXRpb24vanNvbic6IGFkZFByaWNlTW9uaXRvclRvV2lzaGxpc3RHYW1lIH0sXHJcbiAgICAgIHJlcXVlc3RWYWxpZGF0b3I6IG5ldyBhcGlnYXRld2F5LlJlcXVlc3RWYWxpZGF0b3IocmVzdEFQSSwgXCJhZGRQcmljZU1vbml0b3Itd2lzaGxpc3QtcmVxdWVzdC12YWxpZGF0b3JcIiwge1xyXG4gICAgICAgIHJlc3RBcGk6IHJlc3RBUEksXHJcbiAgICAgICAgdmFsaWRhdGVSZXF1ZXN0Qm9keTogdHJ1ZSxcclxuICAgICAgICB2YWxpZGF0ZVJlcXVlc3RQYXJhbWV0ZXJzOiBmYWxzZSxcclxuICAgICAgfSlcclxuICAgIH0pO1xyXG5cclxuICAgIHdpc2hsaXN0QVBJLmFkZFJlc291cmNlKFwibW9kaWZ5UHJpY2VNb25pdG9yXCIpLmFkZE1ldGhvZChcIlBVVFwiLCBhcGlJbnRlZ3JhdGlvbiwge1xyXG4gICAgICBhdXRob3JpemF0aW9uVHlwZTogYXBpZ2F0ZXdheS5BdXRob3JpemF0aW9uVHlwZS5DT0dOSVRPLFxyXG4gICAgICBhdXRob3JpemVyOiB7XHJcbiAgICAgICAgYXV0aG9yaXplcklkOiBhdXRob3JpemVyLnJlZlxyXG4gICAgICB9LFxyXG4gICAgICByZXF1ZXN0TW9kZWxzOiB7ICdhcHBsaWNhdGlvbi9qc29uJzogYWRkUHJpY2VNb25pdG9yVG9XaXNobGlzdEdhbWUgfSxcclxuICAgICAgcmVxdWVzdFZhbGlkYXRvcjogbmV3IGFwaWdhdGV3YXkuUmVxdWVzdFZhbGlkYXRvcihyZXN0QVBJLCBcIm1vZGlmeVByaWNlTW9uaXRvci13aXNobGlzdC1yZXF1ZXN0LXZhbGlkYXRvclwiLCB7XHJcbiAgICAgICAgcmVzdEFwaTogcmVzdEFQSSxcclxuICAgICAgICB2YWxpZGF0ZVJlcXVlc3RCb2R5OiB0cnVlLFxyXG4gICAgICAgIHZhbGlkYXRlUmVxdWVzdFBhcmFtZXRlcnM6IGZhbHNlLFxyXG4gICAgICB9KVxyXG4gICAgfSk7XHJcblxyXG4gICAgd2lzaGxpc3RBUEkuYWRkUmVzb3VyY2UoXCJkZWxldGVQcmljZU1vbml0b3JcIikuYWRkTWV0aG9kKFwiREVMRVRFXCIsIGFwaUludGVncmF0aW9uLCB7XHJcbiAgICAgIGF1dGhvcml6YXRpb25UeXBlOiBhcGlnYXRld2F5LkF1dGhvcml6YXRpb25UeXBlLkNPR05JVE8sXHJcbiAgICAgIGF1dGhvcml6ZXI6IHtcclxuICAgICAgICBhdXRob3JpemVySWQ6IGF1dGhvcml6ZXIucmVmXHJcbiAgICAgIH0sXHJcbiAgICAgIHJlcXVlc3RNb2RlbHM6IHsgJ2FwcGxpY2F0aW9uL2pzb24nOiBhZGRQcmljZU1vbml0b3JUb1dpc2hsaXN0R2FtZSB9LFxyXG4gICAgICByZXF1ZXN0VmFsaWRhdG9yOiBuZXcgYXBpZ2F0ZXdheS5SZXF1ZXN0VmFsaWRhdG9yKHJlc3RBUEksIFwiZGVsZXRlUHJpY2VNb25pdG9yLXdpc2hsaXN0LXJlcXVlc3QtdmFsaWRhdG9yXCIsIHtcclxuICAgICAgICByZXN0QXBpOiByZXN0QVBJLFxyXG4gICAgICAgIHZhbGlkYXRlUmVxdWVzdEJvZHk6IHRydWUsXHJcbiAgICAgICAgdmFsaWRhdGVSZXF1ZXN0UGFyYW1ldGVyczogZmFsc2UsXHJcbiAgICAgIH0pXHJcbiAgICB9KTtcclxuICB9IFxyXG59XHJcbiJdfQ==