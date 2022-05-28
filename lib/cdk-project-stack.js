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
            indexName: 'GSI-1',
            partitionKey: { name: 'GS1', type: dynamodb.AttributeType.STRING },
            readCapacity: 1,
            writeCapacity: 1,
            projectionType: dynamodb.ProjectionType.ALL,
        });
        gameTable.addGlobalSecondaryIndex({
            indexName: 'GSI-2',
            partitionKey: { name: 'partitionKey', type: dynamodb.AttributeType.STRING },
            sortKey: { name: 'GS1', type: dynamodb.AttributeType.STRING },
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
exports.CdkProjectStack = CdkProjectStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2RrLXByb2plY3Qtc3RhY2suanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJjZGstcHJvamVjdC1zdGFjay50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSxxQ0FBcUM7QUFDckMsc0RBQXNEO0FBQ3RELDhDQUE4QztBQUM5QyxrREFBa0Q7QUFDbEQsZ0RBQWdEO0FBQ2hELDhEQUE4RDtBQUM5RCw4Q0FBOEM7QUFDOUMsdURBQXVEO0FBQ3ZELHdDQUF3QztBQUN4Qyw2RkFBOEYsQ0FBQyxrR0FBa0c7QUFFak0sTUFBYSxlQUFnQixTQUFRLEdBQUcsQ0FBQyxLQUFLO0lBQzVDLFlBQVksS0FBb0IsRUFBRSxFQUFVLEVBQUUsS0FBc0I7UUFDbEUsS0FBSyxDQUFDLEtBQUssRUFBRSxFQUFFLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFFeEIsMkJBQTJCO1FBQzNCLE1BQU0sU0FBUyxHQUFHLElBQUksUUFBUSxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsNEJBQTRCLEVBQUU7WUFDdkUsWUFBWSxFQUFFLEVBQUUsSUFBSSxFQUFFLGNBQWMsRUFBRSxJQUFJLEVBQUUsUUFBUSxDQUFDLGFBQWEsQ0FBQyxNQUFNLEVBQUU7WUFDM0UsT0FBTyxFQUFFLEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBRSxJQUFJLEVBQUUsUUFBUSxDQUFDLGFBQWEsQ0FBQyxNQUFNLEVBQUU7WUFDakUsbUJBQW1CLEVBQUUsZ0JBQWdCO1NBQ3RDLENBQUMsQ0FBQztRQUVILFNBQVMsQ0FBQyx1QkFBdUIsQ0FBQztZQUNoQyxTQUFTLEVBQUUsZUFBZTtZQUMxQixZQUFZLEVBQUUsRUFBQyxJQUFJLEVBQUUsVUFBVSxFQUFFLElBQUksRUFBRSxRQUFRLENBQUMsYUFBYSxDQUFDLE1BQU0sRUFBQztZQUNyRSxPQUFPLEVBQUUsRUFBQyxJQUFJLEVBQUUsU0FBUyxFQUFFLElBQUksRUFBRSxRQUFRLENBQUMsYUFBYSxDQUFDLE1BQU0sRUFBQztZQUMvRCxZQUFZLEVBQUUsQ0FB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QU8sRUFBRSxPQUFPO2dCQUNoQixtQkFBbUIsRUFBRSxJQUFJO2dCQUN6Qix5QkFBeUIsRUFBRSxLQUFLO2FBQ2pDLENBQUM7U0FDSCxDQUFDLENBQUM7SUFDTCxDQUFDO0NBQ0Y7QUEzZEQsMENBMmRDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgY2RrIGZyb20gJ0Bhd3MtY2RrL2NvcmUnO1xuaW1wb3J0ICogYXMgYXBpZ2F0ZXdheSBmcm9tICdAYXdzLWNkay9hd3MtYXBpZ2F0ZXdheSc7XG5pbXBvcnQgKiBhcyBsYW1iZGEgZnJvbSAnQGF3cy1jZGsvYXdzLWxhbWJkYSc7XG5pbXBvcnQgKiBhcyBkeW5hbW9kYiBmcm9tICdAYXdzLWNkay9hd3MtZHluYW1vZGInO1xuaW1wb3J0ICogYXMgY29nbml0byBmcm9tICdAYXdzLWNkay9hd3MtY29nbml0byc7XG5pbXBvcnQgKiBhcyBzZWNyZXRzbWFuYWdlciBmcm9tICdAYXdzLWNkay9hd3Mtc2VjcmV0c21hbmFnZXInO1xuaW1wb3J0ICogYXMgZXZlbnRzIGZyb20gJ0Bhd3MtY2RrL2F3cy1ldmVudHMnO1xuaW1wb3J0ICogYXMgdGFyZ2V0cyBmcm9tICdAYXdzLWNkay9hd3MtZXZlbnRzLXRhcmdldHMnO1xuaW1wb3J0ICogYXMgc3NtIGZyb20gJ0Bhd3MtY2RrL2F3cy1zc20nO1xuaW1wb3J0IGlhbSA9IHJlcXVpcmUoXCIuLi9ub2RlX21vZHVsZXMvQGF3cy1jZGsvYXdzLWNsb3Vkd2F0Y2gvbm9kZV9tb2R1bGVzL0Bhd3MtY2RrL2F3cy1pYW1cIik7IC8vVGhlcmUncyBzb21lIGJ1ZyB3aXRoIGltcG9ydGluZyB0aGUgaWFtIG1vZHVsZS4uLiBzZWUgaHR0cHM6Ly9naXRodWIuY29tL2F3cy9hd3MtY2RrL2lzc3Vlcy84NDEwXG5cbmV4cG9ydCBjbGFzcyBDZGtQcm9qZWN0U3RhY2sgZXh0ZW5kcyBjZGsuU3RhY2sge1xuICBjb25zdHJ1Y3RvcihzY29wZTogY2RrLkNvbnN0cnVjdCwgaWQ6IHN0cmluZywgcHJvcHM/OiBjZGsuU3RhY2tQcm9wcykge1xuICAgIHN1cGVyKHNjb3BlLCBpZCwgcHJvcHMpO1xuXG4gICAgLy9EeW5hbW9EQiBUYWJsZSBEZWZpbml0aW9uXG4gICAgY29uc3QgZ2FtZVRhYmxlID0gbmV3IGR5bmFtb2RiLlRhYmxlKHRoaXMsICdhd3MtY2RrLWR5bmFtb2RiLWdhbWVUYWJsZScsIHtcbiAgICAgIHBhcnRpdGlvbktleTogeyBuYW1lOiAncGFydGl0aW9uS2V5JywgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5TVFJJTkcgfSxcbiAgICAgIHNvcnRLZXk6IHsgbmFtZTogJ3NvcnRLZXknLCB0eXBlOiBkeW5hbW9kYi5BdHRyaWJ1dGVUeXBlLlNUUklORyB9LFxuICAgICAgdGltZVRvTGl2ZUF0dHJpYnV0ZTogXCJleHBpcmF0aW9uRGF0ZVwiXG4gICAgfSk7XG5cbiAgICBnYW1lVGFibGUuYWRkR2xvYmFsU2Vjb25kYXJ5SW5kZXgoe1xuICAgICAgaW5kZXhOYW1lOiAnaXRlbVR5cGVJbmRleCcsXG4gICAgICBwYXJ0aXRpb25LZXk6IHtuYW1lOiAnaXRlbVR5cGUnLCB0eXBlOiBkeW5hbW9kYi5BdHRyaWJ1dGVUeXBlLlNUUklOR30sXG4gICAgICBzb3J0S2V5OiB7bmFtZTogJ3NvcnRLZXknLCB0eXBlOiBkeW5hbW9kYi5BdHRyaWJ1dGVUeXBlLlNUUklOR30sXG4gICAgICByZWFkQ2FwYWNpdHk6IDEsXG4gICAgICB3cml0ZUNhcGFjaXR5OiAxLFxuICAgICAgcHJvamVjdGlvblR5cGU6IGR5bmFtb2RiLlByb2plY3Rpb25UeXBlLkFMTCxcbiAgICB9KTtcbiAgICBcbiAgICBnYW1lVGFibGUuYWRkR2xvYmFsU2Vjb25kYXJ5SW5kZXgoe1xuICAgICAgaW5kZXhOYW1lOiAnR1NJLTEnLFxuICAgICAgcGFydGl0aW9uS2V5OiB7bmFtZTogJ0dTMScsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuU1RSSU5HfSxcbiAgICAgIHJlYWRDYXBhY2l0eTogMSxcbiAgICAgIHdyaXRlQ2FwYWNpdHk6IDEsXG4gICAgICBwcm9qZWN0aW9uVHlwZTogZHluYW1vZGIuUHJvamVjdGlvblR5cGUuQUxMLFxuICAgIH0pO1xuXG4gICAgZ2FtZVRhYmxlLmFkZEdsb2JhbFNlY29uZGFyeUluZGV4KHtcbiAgICAgIGluZGV4TmFtZTogJ0dTSS0yJyxcbiAgICAgIHBhcnRpdGlvbktleToge25hbWU6ICdwYXJ0aXRpb25LZXknLCB0eXBlOiBkeW5hbW9kYi5BdHRyaWJ1dGVUeXBlLlNUUklOR30sXG4gICAgICBzb3J0S2V5OiB7bmFtZTogJ0dTMScsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuU1RSSU5HfSxcbiAgICAgIHJlYWRDYXBhY2l0eTogMSxcbiAgICAgIHdyaXRlQ2FwYWNpdHk6IDEsXG4gICAgICBwcm9qZWN0aW9uVHlwZTogZHluYW1vZGIuUHJvamVjdGlvblR5cGUuQUxMLFxuICAgIH0pO1xuXG5cbiAgICBjb25zdCBwcmljZURhdGFVUkwgPSBzc20uU3RyaW5nUGFyYW1ldGVyLmZyb21TdHJpbmdQYXJhbWV0ZXJBdHRyaWJ1dGVzKHRoaXMsICdwcmljZURhdGFVcmwnLCB7XG4gICAgICBwYXJhbWV0ZXJOYW1lOiAnY2RrLXByb2plY3QtcHJpY2VEYXRhVVJMJyxcbiAgICB9KS5zdHJpbmdWYWx1ZTtcblxuICAgIGNvbnN0IHNlc1NvdXJjZUVtYWlsQWRkcmVzcyA9IHNzbS5TdHJpbmdQYXJhbWV0ZXIuZnJvbVN0cmluZ1BhcmFtZXRlckF0dHJpYnV0ZXModGhpcywgJ3Nlc1NvdXJjZUVtYWlsQWRkcmVzcycsIHtcbiAgICAgIHBhcmFtZXRlck5hbWU6ICdjZGstcHJvamVjdC1zZXNTb3VyY2VFbWFpbEFkZHJlc3MnXG4gICAgfSkuc3RyaW5nVmFsdWU7XG5cbiAgICAgICAgLy9MYW1iZGEgRnVuY3Rpb25cbiAgICBjb25zdCBsYW1iZGFGdW5jdGlvbiA9IG5ldyBsYW1iZGEuRnVuY3Rpb24odGhpcywgJ2F3cy1jZGstZ2FtZUFQSS1mdW5jdGlvbicsIHtcbiAgICAgIGNvZGU6IGxhbWJkYS5Db2RlLmZyb21Bc3NldChcImZ1bmN0aW9uc1wiKSxcbiAgICAgIGhhbmRsZXI6ICdpbmRleC5oYW5kbGVyJyxcbiAgICAgIHJ1bnRpbWU6IGxhbWJkYS5SdW50aW1lLk5PREVKU18xNF9YLFxuICAgICAgZW52aXJvbm1lbnQ6IHtcbiAgICAgICAgRFlOQU1PX0RCX0dBTUVfVEFCTEU6IGdhbWVUYWJsZS50YWJsZU5hbWUsXG4gICAgICAgIFBSSUNFX0RBVEFfVVJMOiBwcmljZURhdGFVUkxcbiAgICAgIH0sXG4gICAgICB0aW1lb3V0OiBjZGsuRHVyYXRpb24uc2Vjb25kcygzMCksXG4gICAgICBkZXNjcmlwdGlvbjogJ0xhbWJkYSByZXNwb25zaWJsZSBmb3IgaGFuZGxpbmcgdGhlIEdhbWUgQVBJIHB1YmxpYyBlbmRwb2ludHMnXG4gICAgfSk7XG5cbiAgICBjb25zdCBub3RpZmljYXRpb25zTGFtYmRhID0gbmV3IGxhbWJkYS5GdW5jdGlvbih0aGlzLCAnYXdzLWNkay1ub3RpZmljYXRpb25zLWZ1bmN0aW9uJywge1xuICAgICAgY29kZTogbGFtYmRhLkNvZGUuZnJvbUFzc2V0KFwiZnVuY3Rpb25zXCIpLFxuICAgICAgaGFuZGxlcjogJ25vdGlmaWNhdGlvbnMuaGFuZGxlcicsXG4gICAgICBydW50aW1lOiBsYW1iZGEuUnVudGltZS5OT0RFSlNfMTRfWCxcbiAgICAgIGVudmlyb25tZW50OiB7XG4gICAgICAgIERZTkFNT19EQl9HQU1FX1RBQkxFOiBnYW1lVGFibGUudGFibGVOYW1lLFxuICAgICAgICBQUklDRV9EQVRBX1VSTDogcHJpY2VEYXRhVVJMLFxuICAgICAgICBTRVNfU09VUkNFX0VNQUlMX0FERFJFU1M6IHNlc1NvdXJjZUVtYWlsQWRkcmVzc1xuICAgICAgfSxcbiAgICAgIHRpbWVvdXQ6IGNkay5EdXJhdGlvbi5zZWNvbmRzKDMwKSxcbiAgICAgIGRlc2NyaXB0aW9uOiAnTGFtYmRhIHJlc3BvbnNpYmxlIGZvciBzZW5kaW5nIENvbGxlY3Rpb24gbm90aWZpY2F0aW9ucydcbiAgICB9KTtcblxuICAgIGNvbnN0IHNlc0xhbWJkYVBvbGljeSA9IG5ldyBpYW0uUG9saWN5U3RhdGVtZW50KHtcbiAgICAgIGVmZmVjdDogaWFtLkVmZmVjdC5BTExPVyxcbiAgICAgIGFjdGlvbnM6IFtcInNlczpTZW5kRW1haWxcIl0sXG4gICAgICByZXNvdXJjZXM6IFtcIipcIl0sXG4gICAgfSk7XG5cbiAgICAvL1J1bnMgdGhlIFdpc2hsaXN0IE5vdGlmaWNhdGlvbnMgYXQgbWlkbmlnaHQgZXZlcnkgd2Vla2RheVxuICAgIGNvbnN0IGV2ZW50UnVsZSA9IG5ldyBldmVudHMuUnVsZSh0aGlzLCAnc2NoZWR1bGVSdWxlJywge1xuICAgICAgc2NoZWR1bGU6IGV2ZW50cy5TY2hlZHVsZS5leHByZXNzaW9uKCdjcm9uKDAgNSA/ICogTU9OLUZSSSAqKScpXG4gICAgfSk7XG4gICAgZXZlbnRSdWxlLmFkZFRhcmdldChuZXcgdGFyZ2V0cy5MYW1iZGFGdW5jdGlvbihub3RpZmljYXRpb25zTGFtYmRhKSk7XG5cbiAgICBsYW1iZGFGdW5jdGlvbi5hZGRUb1JvbGVQb2xpY3koc2VzTGFtYmRhUG9saWN5KTtcbiAgICBub3RpZmljYXRpb25zTGFtYmRhLmFkZFRvUm9sZVBvbGljeShzZXNMYW1iZGFQb2xpY3kpO1xuICAgIGdhbWVUYWJsZS5ncmFudFJlYWRXcml0ZURhdGEobGFtYmRhRnVuY3Rpb24pOyBcbiAgICBnYW1lVGFibGUuZ3JhbnRSZWFkV3JpdGVEYXRhKG5vdGlmaWNhdGlvbnNMYW1iZGEpO1xuXG4gICAgLy9BUEkgR2F0ZXdheVxuICAgIGNvbnN0IHJlc3RBUEkgPSBuZXcgYXBpZ2F0ZXdheS5MYW1iZGFSZXN0QXBpKHRoaXMsIFwiYXdzLWNkay1yZXN0LWFwaVwiLCB7XG4gICAgICBoYW5kbGVyOiBsYW1iZGFGdW5jdGlvbixcbiAgICAgIHByb3h5OiBmYWxzZSxcbiAgICAgIHJlc3RBcGlOYW1lOiBcIkdhbWUgTWFuYWdlbWVudCBBUElcIlxuICAgIH0pO1xuICAgIGNvbnN0IGFwaUludGVncmF0aW9uID0gbmV3IGFwaWdhdGV3YXkuTGFtYmRhSW50ZWdyYXRpb24obGFtYmRhRnVuY3Rpb24pO1xuICAgIFxuICAgIC8vQ29nbml0b1xuICAgIGNvbnN0IHVzZXJQb29sID0gbmV3IGNvZ25pdG8uVXNlclBvb2wodGhpcywgJ3VzZXJQb29sJywge1xuICAgICAgc2VsZlNpZ25VcEVuYWJsZWQ6IHRydWUsXG4gICAgICB1c2VyVmVyaWZpY2F0aW9uOiB7XG4gICAgICAgIGVtYWlsU3ViamVjdDogJ1ZlcmlmeSB5b3VyIGVtYWlsIScsXG4gICAgICAgIGVtYWlsQm9keTogJ0hlbGxvLCBUaGFua3MgZm9yIHNpZ25pbmcgdXAhIHsjI1ZlcmlmeSBFbWFpbCMjfScsXG4gICAgICAgIGVtYWlsU3R5bGU6IGNvZ25pdG8uVmVyaWZpY2F0aW9uRW1haWxTdHlsZS5MSU5LXG4gICAgICB9LFxuICAgICAgc2lnbkluQWxpYXNlczoge1xuICAgICAgICB1c2VybmFtZTogdHJ1ZSxcbiAgICAgICAgZW1haWw6IHRydWVcbiAgICAgIH0sXG4gICAgICBzdGFuZGFyZEF0dHJpYnV0ZXM6IHtcbiAgICAgICAgZW1haWw6IHtcbiAgICAgICAgICByZXF1aXJlZDogdHJ1ZVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICBjb25zdCBvQXV0aFNlY3JldCA9IHNlY3JldHNtYW5hZ2VyLlNlY3JldC5mcm9tU2VjcmV0Q29tcGxldGVBcm4oXG4gICAgICB0aGlzLFxuICAgICAgJ2RiLW9hdXRoLWlkJyxcbiAgICAgICdhcm46YXdzOnNlY3JldHNtYW5hZ2VyOnVzLWVhc3QtMToyMjExNzYxNDAzNjU6c2VjcmV0OjIyMDA4NjIxNjAxNS1pMzNzdGJxamJmaDVybG05cWkzdWFpbWI5ZW82Z25ycy5hcHBzLmdvb2dsZXVzZXJjb250ZW50LmNvbS02eGhaSFknXG4gICAgKTtcblxuICAgIGNvbnN0IHVzZXJQb29sSWRlbnRpdHlQcm92aWRlckdvb2dsZSA9IG5ldyBjb2duaXRvLlVzZXJQb29sSWRlbnRpdHlQcm92aWRlckdvb2dsZSh0aGlzLCAndXNlclBvb2xHb29nbGUnLCB7XG4gICAgICB1c2VyUG9vbDogdXNlclBvb2wsXG4gICAgICBjbGllbnRJZDogb0F1dGhTZWNyZXQuc2VjcmV0TmFtZSxcbiAgICAgIGNsaWVudFNlY3JldDogb0F1dGhTZWNyZXQuc2VjcmV0VmFsdWUudG9TdHJpbmcoKSxcbiAgICAgIGF0dHJpYnV0ZU1hcHBpbmc6IHtcbiAgICAgICAgZW1haWw6IHtcbiAgICAgICAgICBhdHRyaWJ1dGVOYW1lOiBjb2duaXRvLlByb3ZpZGVyQXR0cmlidXRlLkdPT0dMRV9FTUFJTC5hdHRyaWJ1dGVOYW1lLFxuICAgICAgICB9LFxuICAgICAgICBjdXN0b206IHtcbiAgICAgICAgICBlbWFpbF92ZXJpZmllZDogY29nbml0by5Qcm92aWRlckF0dHJpYnV0ZS5vdGhlcignZW1haWxfdmVyaWZpZWQnKSxcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgIHNjb3BlczogWydwcm9maWxlJywnZW1haWwnLCdvcGVuaWQnXVxuICAgIH0pO1xuXG4gICAgY29uc3QgdXNlclBvb2xDbGllbnQgPSBuZXcgY29nbml0by5Vc2VyUG9vbENsaWVudCh0aGlzLCAndXNlclBvb2xDbGllbnQnLCB7XG4gICAgICB1c2VyUG9vbDogdXNlclBvb2wsXG4gICAgICBvQXV0aDoge1xuICAgICAgICBjYWxsYmFja1VybHM6IFsnaHR0cHM6Ly9leGFtcGxlLmNvbS9jYWxsYmFjayddLFxuICAgICAgICBsb2dvdXRVcmxzOiBbJ2h0dHBzOi8vZXhhbXBsZS5jb20vc2lnbm91dCddLFxuICAgICAgICBmbG93czoge1xuICAgICAgICAgIGF1dGhvcml6YXRpb25Db2RlR3JhbnQ6IGZhbHNlLFxuICAgICAgICAgIGltcGxpY2l0Q29kZUdyYW50OiB0cnVlLFxuICAgICAgICAgIGNsaWVudENyZWRlbnRpYWxzOiBmYWxzZVxuICAgICAgICB9LFxuICAgICAgICBzY29wZXM6IFtjb2duaXRvLk9BdXRoU2NvcGUuT1BFTklEXVxuICAgICAgfVxuICAgIH0pO1xuXG4gICAgY29uc3QgdXNlclBvb2xEb21haW4gPSBuZXcgY29nbml0by5Vc2VyUG9vbERvbWFpbih0aGlzLCAndXNlclBvb2xEb21haW4nLCB7XG4gICAgICB1c2VyUG9vbDogdXNlclBvb2wsXG4gICAgICBjb2duaXRvRG9tYWluOiB7XG4gICAgICAgIGRvbWFpblByZWZpeDogJ2Nka2dhbWVhcGlkZW1vJ1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgY29uc3QgYXV0aG9yaXplciA9IG5ldyBhcGlnYXRld2F5LkNmbkF1dGhvcml6ZXIodGhpcywgJ2NmbkF1dGgnLCB7XG4gICAgICByZXN0QXBpSWQ6IHJlc3RBUEkucmVzdEFwaUlkLFxuICAgICAgbmFtZTogJ2dhbWVBdXRob3JpemVyJyxcbiAgICAgIHR5cGU6ICdDT0dOSVRPX1VTRVJfUE9PTFMnLFxuICAgICAgaWRlbnRpdHlTb3VyY2U6ICdtZXRob2QucmVxdWVzdC5oZWFkZXIuQXV0aG9yaXphdGlvbicsXG4gICAgICBwcm92aWRlckFybnM6IFt1c2VyUG9vbC51c2VyUG9vbEFybl1cbiAgICB9KVxuXG4gICAgLy9NZXRob2Qgc2NoZW1hXG4gICAgY29uc3QgYWRkR2FtZU1vZGVsID0gcmVzdEFQSS5hZGRNb2RlbCgnQWRkUmVxdWVzdE1vZGVsJywge1xuICAgICAgY29udGVudFR5cGU6ICdhcHBsaWNhdGlvbi9qc29uJyxcbiAgICAgIG1vZGVsTmFtZTogJ0FkZFJlcXVlc3RNb2RlbCcsXG4gICAgICBzY2hlbWE6IHtcbiAgICAgICAgdGl0bGU6ICdwb3N0TW9kZWwnLFxuICAgICAgICB0eXBlOiBhcGlnYXRld2F5Lkpzb25TY2hlbWFUeXBlLk9CSkVDVCwgICAgICBcbiAgICAgICAgcmVxdWlyZWQ6IFsnZ2FtZU5hbWUnXSxcbiAgICAgICAgcHJvcGVydGllczoge1xuICAgICAgICAgICAgZ2FtZU5hbWU6IHsgdHlwZTogYXBpZ2F0ZXdheS5Kc29uU2NoZW1hVHlwZS5TVFJJTkcgfSxcbiAgICAgICAgICAgIHllYXJSZWxlYXNlZDogeyB0eXBlOiBhcGlnYXRld2F5Lkpzb25TY2hlbWFUeXBlLklOVEVHRVIgfSxcbiAgICAgICAgICAgIGdlbnJlOiB7IHR5cGU6IGFwaWdhdGV3YXkuSnNvblNjaGVtYVR5cGUuU1RSSU5HIH0sXG4gICAgICAgICAgICBkZXZlbG9wZXI6IHsgdHlwZTogYXBpZ2F0ZXdheS5Kc29uU2NoZW1hVHlwZS5TVFJJTkcgfSxcbiAgICAgICAgICAgIGNvbnNvbGU6IHsgdHlwZTogYXBpZ2F0ZXdheS5Kc29uU2NoZW1hVHlwZS5TVFJJTkcgfSwgICAgICAgICAgXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KTsgICBcbiAgICBcbiAgICBjb25zdCBtb2RpZnlHYW1lTW9kZWwgPSByZXN0QVBJLmFkZE1vZGVsKCdNb2RpZnlSZXF1ZXN0TW9kZWwnLCB7XG4gICAgICBjb250ZW50VHlwZTogJ2FwcGxpY2F0aW9uL2pzb24nLFxuICAgICAgbW9kZWxOYW1lOiAnTW9kaWZ5UmVxdWVzdE1vZGVsJyxcbiAgICAgIHNjaGVtYToge1xuICAgICAgc2NoZW1hOiBhcGlnYXRld2F5Lkpzb25TY2hlbWFWZXJzaW9uLkRSQUZUNCxcbiAgICAgIHRpdGxlOiAncG9zdE1vZGVsJyxcbiAgICAgIHR5cGU6IGFwaWdhdGV3YXkuSnNvblNjaGVtYVR5cGUuT0JKRUNULFxuICAgICAgcHJvcGVydGllczoge1xuICAgICAgICAgIGdhbWVJRDogeyB0eXBlOiBhcGlnYXRld2F5Lkpzb25TY2hlbWFUeXBlLlNUUklORyB9LFxuICAgICAgICAgIGdhbWVOYW1lOiB7IHR5cGU6IGFwaWdhdGV3YXkuSnNvblNjaGVtYVR5cGUuU1RSSU5HIH0sXG4gICAgICAgICAgeWVhclJlbGVhc2VkOiB7IHR5cGU6IGFwaWdhdGV3YXkuSnNvblNjaGVtYVR5cGUuSU5URUdFUiB9LFxuICAgICAgICAgIGdlbnJlOiB7IHR5cGU6IGFwaWdhdGV3YXkuSnNvblNjaGVtYVR5cGUuU1RSSU5HIH0sXG4gICAgICAgICAgZGV2ZWxvcGVyOiB7IHR5cGU6IGFwaWdhdGV3YXkuSnNvblNjaGVtYVR5cGUuU1RSSU5HIH0sXG4gICAgICAgICAgY29uc29sZTogeyB0eXBlOiBhcGlnYXRld2F5Lkpzb25TY2hlbWFUeXBlLlNUUklORyB9LCAgICAgICAgICBcbiAgICAgIH0sXG4gICAgICByZXF1aXJlZDogWydnYW1lTmFtZScsICdnYW1lSUQnXSxcbiAgICAgIH0sXG4gICAgfSk7XG4gICAgXG4gICAgY29uc3QgZ2V0Q29sbGVjdGlvbk1vZGVsID0gcmVzdEFQSS5hZGRNb2RlbCgnV2lzaGxpc3RSZXF1ZXN0TW9kZWwnLCB7XG4gICAgICBjb250ZW50VHlwZTogJ2FwcGxpY2F0aW9uL2pzb24nLFxuICAgICAgbW9kZWxOYW1lOiAnV2lzaGxpc3RSZXF1ZXN0TW9kZWwnLFxuICAgICAgc2NoZW1hOiB7XG4gICAgICBzY2hlbWE6IGFwaWdhdGV3YXkuSnNvblNjaGVtYVZlcnNpb24uRFJBRlQ0LFxuICAgICAgdGl0bGU6ICd3aXNobGlzdE1vZGVsJyxcbiAgICAgIHR5cGU6IGFwaWdhdGV3YXkuSnNvblNjaGVtYVR5cGUuT0JKRUNULFxuICAgICAgcHJvcGVydGllczoge1xuICAgICAgICAgIGNvbGxlY3Rpb25JRDogeyB0eXBlOiBhcGlnYXRld2F5Lkpzb25TY2hlbWFUeXBlLlNUUklORyB9LCAgICAgICAgICAgICAgICAgXG4gICAgICB9LFxuICAgICAgcmVxdWlyZWQ6IFsnY29sbGVjdGlvbklEJ10sXG4gICAgICB9LFxuICAgIH0pXG5cbiAgICBjb25zdCBhZGRHYW1lVG9XaXNobGlzdE1vZGVsID0gcmVzdEFQSS5hZGRNb2RlbCgnV2lzaGxpc3RBZGRSZXF1ZXN0TW9kZWwnLCB7XG4gICAgICBjb250ZW50VHlwZTogJ2FwcGxpY2F0aW9uL2pzb24nLFxuICAgICAgbW9kZWxOYW1lOiAnV2lzaGxpc3RBZGRSZXF1ZXN0TW9kZWwnLFxuICAgICAgc2NoZW1hOiB7XG4gICAgICBzY2hlbWE6IGFwaWdhdGV3YXkuSnNvblNjaGVtYVZlcnNpb24uRFJBRlQ0LFxuICAgICAgdGl0bGU6ICd3aXNobGlzdE1vZGVsJyxcbiAgICAgIHR5cGU6IGFwaWdhdGV3YXkuSnNvblNjaGVtYVR5cGUuT0JKRUNULFxuICAgICAgcHJvcGVydGllczoge1xuICAgICAgICAgIGNvbGxlY3Rpb25JRDogeyB0eXBlOiBhcGlnYXRld2F5Lkpzb25TY2hlbWFUeXBlLlNUUklORyB9LFxuICAgICAgICAgIGdhbWVOYW1lOiB7IHR5cGU6IGFwaWdhdGV3YXkuSnNvblNjaGVtYVR5cGUuU1RSSU5HIH0sXG4gICAgICAgICAgeWVhclJlbGVhc2VkOiB7IHR5cGU6IGFwaWdhdGV3YXkuSnNvblNjaGVtYVR5cGUuSU5URUdFUiB9LFxuICAgICAgICAgIGdlbnJlOiB7IHR5cGU6IGFwaWdhdGV3YXkuSnNvblNjaGVtYVR5cGUuU1RSSU5HIH0sXG4gICAgICAgICAgZGV2ZWxvcGVyOiB7IHR5cGU6IGFwaWdhdGV3YXkuSnNvblNjaGVtYVR5cGUuU1RSSU5HIH0sXG4gICAgICAgICAgY29uc29sZTogeyB0eXBlOiBhcGlnYXRld2F5Lkpzb25TY2hlbWFUeXBlLlNUUklORyB9LFxuICAgICAgICAgIGRlc2lyZWRQcmljZTogeyB0eXBlOiBhcGlnYXRld2F5Lkpzb25TY2hlbWFUeXBlLklOVEVHRVIgfSxcbiAgICAgICAgICBkZXNpcmVkQ29uZGl0aW9uOiB7IHR5cGU6IGFwaWdhdGV3YXkuSnNvblNjaGVtYVR5cGUuU1RSSU5HIH0sICAgICAgICAgICAgICAgICAgIFxuICAgICAgfSxcbiAgICAgIHJlcXVpcmVkOiBbJ2dhbWVOYW1lJywgJ2NvbGxlY3Rpb25JRCddLFxuICAgICAgfSxcbiAgICB9KVxuXG4gICAgY29uc3QgbW9kaWZ5R2FtZUluV2lzaGxpc3RNb2RlbCA9IHJlc3RBUEkuYWRkTW9kZWwoJ1dpc2hsaXN0TW9kaWZ5UmVxdWVzdE1vZGVsJywge1xuICAgICAgY29udGVudFR5cGU6ICdhcHBsaWNhdGlvbi9qc29uJyxcbiAgICAgIG1vZGVsTmFtZTogJ1dpc2hsaXN0TW9kaWZ5UmVxdWVzdE1vZGVsJyxcbiAgICAgIHNjaGVtYToge1xuICAgICAgc2NoZW1hOiBhcGlnYXRld2F5Lkpzb25TY2hlbWFWZXJzaW9uLkRSQUZUNCxcbiAgICAgIHRpdGxlOiAnd2lzaGxpc3RNb2RlbCcsXG4gICAgICB0eXBlOiBhcGlnYXRld2F5Lkpzb25TY2hlbWFUeXBlLk9CSkVDVCxcbiAgICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgICBpZDogeyB0eXBlOiBhcGlnYXRld2F5Lkpzb25TY2hlbWFUeXBlLlNUUklORyB9LFxuICAgICAgICAgIGNvbGxlY3Rpb25JRDogeyB0eXBlOiBhcGlnYXRld2F5Lkpzb25TY2hlbWFUeXBlLlNUUklORyB9LFxuICAgICAgICAgIGdhbWVOYW1lOiB7IHR5cGU6IGFwaWdhdGV3YXkuSnNvblNjaGVtYVR5cGUuU1RSSU5HIH0sXG4gICAgICAgICAgeWVhclJlbGVhc2VkOiB7IHR5cGU6IGFwaWdhdGV3YXkuSnNvblNjaGVtYVR5cGUuSU5URUdFUiB9LFxuICAgICAgICAgIGdlbnJlOiB7IHR5cGU6IGFwaWdhdGV3YXkuSnNvblNjaGVtYVR5cGUuU1RSSU5HIH0sXG4gICAgICAgICAgZGV2ZWxvcGVyOiB7IHR5cGU6IGFwaWdhdGV3YXkuSnNvblNjaGVtYVR5cGUuU1RSSU5HIH0sXG4gICAgICAgICAgY29uc29sZTogeyB0eXBlOiBhcGlnYXRld2F5Lkpzb25TY2hlbWFUeXBlLlNUUklORyB9LFxuICAgICAgICAgIGRlc2lyZWRQcmljZTogeyB0eXBlOiBhcGlnYXRld2F5Lkpzb25TY2hlbWFUeXBlLklOVEVHRVIgfSxcbiAgICAgICAgICBkZXNpcmVkQ29uZGl0aW9uOiB7IHR5cGU6IGFwaWdhdGV3YXkuSnNvblNjaGVtYVR5cGUuU1RSSU5HIH0sICAgICAgICAgICAgICAgICAgIFxuICAgICAgfSxcbiAgICAgIHJlcXVpcmVkOiBbJ2dhbWVOYW1lJywgJ2lkJywgJ2NvbGxlY3Rpb25JRCddLFxuICAgICAgfSxcbiAgICB9KVxuXG4gICAgY29uc3QgYWRkUHJpY2VNb25pdG9yVG9XaXNobGlzdEdhbWUgPSByZXN0QVBJLmFkZE1vZGVsKCdQcmljZU1vbml0b3JSZXF1ZXN0TW9uZGVsJywge1xuICAgICAgY29udGVudFR5cGU6ICdhcHBsaWNhdGlvbi9qc29uJyxcbiAgICAgIG1vZGVsTmFtZTogJ2FkZFByaWNlTW9uaXRvcicsXG4gICAgICBzY2hlbWE6IHtcbiAgICAgIHNjaGVtYTogYXBpZ2F0ZXdheS5Kc29uU2NoZW1hVmVyc2lvbi5EUkFGVDQsXG4gICAgICB0aXRsZTogJ3dpc2hsaXN0TW9kZWwnLFxuICAgICAgdHlwZTogYXBpZ2F0ZXdheS5Kc29uU2NoZW1hVHlwZS5PQkpFQ1QsXG4gICAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICAgICAgZ2FtZUlEOiB7IHR5cGU6IGFwaWdhdGV3YXkuSnNvblNjaGVtYVR5cGUuU1RSSU5HIH0sXG4gICAgICAgICAgY29sbGVjdGlvbklEOiB7IHR5cGU6IGFwaWdhdGV3YXkuSnNvblNjaGVtYVR5cGUuU1RSSU5HIH0sXG4gICAgICAgICAgZGVzaXJlZFByaWNlOiB7IHR5cGU6IGFwaWdhdGV3YXkuSnNvblNjaGVtYVR5cGUuSU5URUdFUiB9LFxuICAgICAgICAgIGRlc2lyZWRDb25kaXRpb246IHsgdHlwZTogYXBpZ2F0ZXdheS5Kc29uU2NoZW1hVHlwZS5TVFJJTkcgfSwgICAgICAgICAgICAgICAgICAgXG4gICAgICB9LFxuICAgICAgcmVxdWlyZWQ6IFsnZ2FtZUlEJywgJ2NvbGxlY3Rpb25JRCcsICdkZXNpcmVkUHJpY2UnLCAnZGVzaXJlZENvbmRpdGlvbiddLFxuICAgICAgfVxuICAgIH0pO1xuXG4gICAgY29uc3QgdXBkYXRlUHJpY2VNb25pdG9yVG9XaXNobGlzdEdhbWUgPSByZXN0QVBJLmFkZE1vZGVsKCdVcGRhdGVQcmljZU1vbml0b3JSZXF1ZXN0TW9uZGVsJywge1xuICAgICAgY29udGVudFR5cGU6ICdhcHBsaWNhdGlvbi9qc29uJyxcbiAgICAgIG1vZGVsTmFtZTogJ3VwZGF0ZVByaWNlTW9uaXRvcicsXG4gICAgICBzY2hlbWE6IHtcbiAgICAgIHNjaGVtYTogYXBpZ2F0ZXdheS5Kc29uU2NoZW1hVmVyc2lvbi5EUkFGVDQsXG4gICAgICB0aXRsZTogJ3dpc2hsaXN0TW9kZWwnLFxuICAgICAgdHlwZTogYXBpZ2F0ZXdheS5Kc29uU2NoZW1hVHlwZS5PQkpFQ1QsXG4gICAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICAgICAgcHJpY2VNb25pdG9ySUQ6IHsgdHlwZTogYXBpZ2F0ZXdheS5Kc29uU2NoZW1hVHlwZS5TVFJJTkcgfSxcbiAgICAgICAgICBnYW1lSUQ6IHsgdHlwZTogYXBpZ2F0ZXdheS5Kc29uU2NoZW1hVHlwZS5TVFJJTkcgfSxcbiAgICAgICAgICBjb2xsZWN0aW9uSUQ6IHsgdHlwZTogYXBpZ2F0ZXdheS5Kc29uU2NoZW1hVHlwZS5TVFJJTkcgfSxcbiAgICAgICAgICBkZXNpcmVkUHJpY2U6IHsgdHlwZTogYXBpZ2F0ZXdheS5Kc29uU2NoZW1hVHlwZS5JTlRFR0VSIH0sXG4gICAgICAgICAgZGVzaXJlZENvbmRpdGlvbjogeyB0eXBlOiBhcGlnYXRld2F5Lkpzb25TY2hlbWFUeXBlLlNUUklORyB9LCAgICAgICAgICAgICAgICAgICBcbiAgICAgIH0sXG4gICAgICByZXF1aXJlZDogWydwcmljZU1vbml0b3JJRCcsICdnYW1lSUQnLCAnY29sbGVjdGlvbklEJywgJ2Rlc2lyZWRQcmljZScsICdkZXNpcmVkQ29uZGl0aW9uJ10sXG4gICAgICB9XG4gICAgfSk7XG5cbiAgICAvL01ldGhvZCBkZWZpbml0aW9uc1xuICAgIHJlc3RBUEkucm9vdC5hZGRSZXNvdXJjZShcImNyZWF0ZVVzZXJcIikuYWRkTWV0aG9kKFwiUE9TVFwiLCBhcGlJbnRlZ3JhdGlvbiwge1xuICAgICAgYXV0aG9yaXphdGlvblR5cGU6IGFwaWdhdGV3YXkuQXV0aG9yaXphdGlvblR5cGUuQ09HTklUTyxcbiAgICAgIGF1dGhvcml6ZXI6IHtcbiAgICAgICAgYXV0aG9yaXplcklkOiBhdXRob3JpemVyLnJlZlxuICAgICAgfSxcbiAgICAgIHJlcXVlc3RWYWxpZGF0b3I6IG5ldyBhcGlnYXRld2F5LlJlcXVlc3RWYWxpZGF0b3IocmVzdEFQSSwgXCJjcmVhdGUtdXNlci1yZXF1ZXN0LXZhbGlkYXRvclwiLCB7XG4gICAgICAgIHJlc3RBcGk6IHJlc3RBUEksXG4gICAgICAgIHZhbGlkYXRlUmVxdWVzdEJvZHk6IGZhbHNlLFxuICAgICAgICB2YWxpZGF0ZVJlcXVlc3RQYXJhbWV0ZXJzOiBmYWxzZSxcbiAgICAgIH0pXG4gICAgfSk7XG5cbiAgICByZXN0QVBJLnJvb3QuYWRkUmVzb3VyY2UoXCJnZXRHYW1lXCIpLmFkZE1ldGhvZChcIkdFVFwiLCBhcGlJbnRlZ3JhdGlvbiwge1xuICAgICAgYXV0aG9yaXphdGlvblR5cGU6IGFwaWdhdGV3YXkuQXV0aG9yaXphdGlvblR5cGUuQ09HTklUTyxcbiAgICAgIGF1dGhvcml6ZXI6IHtcbiAgICAgICAgYXV0aG9yaXplcklkOiBhdXRob3JpemVyLnJlZlxuICAgICAgfSxcbiAgICAgIHJlcXVlc3RQYXJhbWV0ZXJzOiB7XG4gICAgICAgIFwibWV0aG9kLnJlcXVlc3QucXVlcnlzdHJpbmcuZ2FtZUlEXCI6IHRydWUsICAgICAgICBcbiAgICAgIH0sXG4gICAgICByZXF1ZXN0VmFsaWRhdG9yOiBuZXcgYXBpZ2F0ZXdheS5SZXF1ZXN0VmFsaWRhdG9yKHJlc3RBUEksICdnZXQtcmVxdWVzdC12YWxpZGF0b3InLCB7XG4gICAgICAgIHJlc3RBcGk6IHJlc3RBUEksXG4gICAgICAgIHZhbGlkYXRlUmVxdWVzdEJvZHk6IGZhbHNlLFxuICAgICAgICB2YWxpZGF0ZVJlcXVlc3RQYXJhbWV0ZXJzOiB0cnVlLFxuICAgICAgfSlcbiAgICB9KTtcblxuICAgIHJlc3RBUEkucm9vdC5hZGRSZXNvdXJjZShcImxpc3RHYW1lc1wiKS5hZGRNZXRob2QoXCJHRVRcIiwgYXBpSW50ZWdyYXRpb24sIHtcbiAgICAgIGF1dGhvcml6YXRpb25UeXBlOiBhcGlnYXRld2F5LkF1dGhvcml6YXRpb25UeXBlLkNPR05JVE8sXG4gICAgICBhdXRob3JpemVyOiB7XG4gICAgICAgIGF1dGhvcml6ZXJJZDogYXV0aG9yaXplci5yZWZcbiAgICAgIH1cbiAgICB9KTtcbiAgICBcbiAgICByZXN0QVBJLnJvb3QuYWRkUmVzb3VyY2UoXCJjcmVhdGVHYW1lXCIpLmFkZE1ldGhvZChcIlBPU1RcIiwgYXBpSW50ZWdyYXRpb24sIHtcbiAgICAgIGF1dGhvcml6YXRpb25UeXBlOiBhcGlnYXRld2F5LkF1dGhvcml6YXRpb25UeXBlLkNPR05JVE8sXG4gICAgICBhdXRob3JpemVyOiB7XG4gICAgICAgIGF1dGhvcml6ZXJJZDogYXV0aG9yaXplci5yZWZcbiAgICAgIH0sXG4gICAgICByZXF1ZXN0VmFsaWRhdG9yOiBuZXcgYXBpZ2F0ZXdheS5SZXF1ZXN0VmFsaWRhdG9yKHRoaXMsIFwiY3JlYXRlLXJlcXVlc3QtdmFsaWRhdG9yXCIsIHtcbiAgICAgICAgcmVzdEFwaTogcmVzdEFQSSxcbiAgICAgICAgdmFsaWRhdGVSZXF1ZXN0Qm9keTogdHJ1ZVxuICAgICAgfSksXG4gICAgICByZXF1ZXN0TW9kZWxzOiB7ICdhcHBsaWNhdGlvbi9qc29uJzogYWRkR2FtZU1vZGVsIH0sXG4gICAgfSk7XG5cbiAgICByZXN0QVBJLnJvb3QuYWRkUmVzb3VyY2UoXCJtb2RpZnlHYW1lXCIpLmFkZE1ldGhvZChcIlBVVFwiLCBhcGlJbnRlZ3JhdGlvbiwge1xuICAgICAgYXV0aG9yaXphdGlvblR5cGU6IGFwaWdhdGV3YXkuQXV0aG9yaXphdGlvblR5cGUuQ09HTklUTyxcbiAgICAgIGF1dGhvcml6ZXI6IHtcbiAgICAgICAgYXV0aG9yaXplcklkOiBhdXRob3JpemVyLnJlZlxuICAgICAgfSxcbiAgICAgIHJlcXVlc3RNb2RlbHM6IHsgJ2FwcGxpY2F0aW9uL2pzb24nOiBtb2RpZnlHYW1lTW9kZWwgfSxcbiAgICAgIHJlcXVlc3RWYWxpZGF0b3I6IG5ldyBhcGlnYXRld2F5LlJlcXVlc3RWYWxpZGF0b3IocmVzdEFQSSwgJ21vZGlmeS1yZXF1ZXN0LXZhbGlkYXRvcicsIHtcbiAgICAgICAgcmVzdEFwaTogcmVzdEFQSSxcbiAgICAgICAgdmFsaWRhdGVSZXF1ZXN0Qm9keTogdHJ1ZSxcbiAgICAgICAgdmFsaWRhdGVSZXF1ZXN0UGFyYW1ldGVyczogZmFsc2UsXG4gICAgICB9KVxuICAgIH0pO1xuXG4gICAgcmVzdEFQSS5yb290LmFkZFJlc291cmNlKFwiZGVsZXRlR2FtZVwiKS5hZGRNZXRob2QoXCJERUxFVEVcIiwgYXBpSW50ZWdyYXRpb24sIHtcbiAgICAgIGF1dGhvcml6YXRpb25UeXBlOiBhcGlnYXRld2F5LkF1dGhvcml6YXRpb25UeXBlLkNPR05JVE8sXG4gICAgICBhdXRob3JpemVyOiB7XG4gICAgICAgIGF1dGhvcml6ZXJJZDogYXV0aG9yaXplci5yZWZcbiAgICAgIH0sXG4gICAgICByZXF1ZXN0TW9kZWxzOiB7ICdhcHBsaWNhdGlvbi9qc29uJzogbW9kaWZ5R2FtZU1vZGVsIH0sXG4gICAgICByZXF1ZXN0VmFsaWRhdG9yOiBuZXcgYXBpZ2F0ZXdheS5SZXF1ZXN0VmFsaWRhdG9yKHJlc3RBUEksICdkZWxldGUtcmVxdWVzdC12YWxpZGF0b3InLCB7XG4gICAgICAgIHJlc3RBcGk6IHJlc3RBUEksXG4gICAgICAgIHZhbGlkYXRlUmVxdWVzdEJvZHk6IHRydWUsXG4gICAgICAgIHZhbGlkYXRlUmVxdWVzdFBhcmFtZXRlcnM6IGZhbHNlLFxuICAgICAgfSlcbiAgICB9KTtcblxuICAgIGxldCB3aXNobGlzdEFQSSA9IHJlc3RBUEkucm9vdC5hZGRSZXNvdXJjZShcImNvbGxlY3Rpb25cIikuYWRkUmVzb3VyY2UoXCJ3aXNobGlzdFwiKTtcblxuICAgIHdpc2hsaXN0QVBJLmFkZFJlc291cmNlKFwiY3JlYXRlV2lzaGxpc3RcIikuYWRkTWV0aG9kKFwiUE9TVFwiLCBhcGlJbnRlZ3JhdGlvbiwge1xuICAgICAgYXV0aG9yaXphdGlvblR5cGU6IGFwaWdhdGV3YXkuQXV0aG9yaXphdGlvblR5cGUuQ09HTklUTyxcbiAgICAgIGF1dGhvcml6ZXI6IHtcbiAgICAgICAgYXV0aG9yaXplcklkOiBhdXRob3JpemVyLnJlZlxuICAgICAgfSxcbiAgICAgIHJlcXVlc3RWYWxpZGF0b3I6IG5ldyBhcGlnYXRld2F5LlJlcXVlc3RWYWxpZGF0b3IocmVzdEFQSSwgXCJjcmVhdGUtd2lzaGxpc3QtcmVxdWVzdC12YWxpZGF0b3JcIiwge1xuICAgICAgICByZXN0QXBpOiByZXN0QVBJLFxuICAgICAgICB2YWxpZGF0ZVJlcXVlc3RCb2R5OiBmYWxzZSxcbiAgICAgICAgdmFsaWRhdGVSZXF1ZXN0UGFyYW1ldGVyczogZmFsc2UsXG4gICAgICB9KVxuICAgIH0pO1xuXG4gICAgd2lzaGxpc3RBUEkuYWRkTWV0aG9kKFwiR0VUXCIsIGFwaUludGVncmF0aW9uLCB7XG4gICAgICBhdXRob3JpemF0aW9uVHlwZTogYXBpZ2F0ZXdheS5BdXRob3JpemF0aW9uVHlwZS5DT0dOSVRPLFxuICAgICAgYXV0aG9yaXplcjoge1xuICAgICAgICBhdXRob3JpemVySWQ6IGF1dGhvcml6ZXIucmVmXG4gICAgICB9LFxuICAgICAgcmVxdWVzdFBhcmFtZXRlcnM6IHtcbiAgICAgICAgXCJtZXRob2QucmVxdWVzdC5xdWVyeXN0cmluZy5jb2xsZWN0aW9uSURcIjogdHJ1ZSwgICAgICAgIFxuICAgICAgfSxcbiAgICAgIHJlcXVlc3RWYWxpZGF0b3I6IG5ldyBhcGlnYXRld2F5LlJlcXVlc3RWYWxpZGF0b3IocmVzdEFQSSwgJ2dldC13aXNobGlzdC1yZXF1ZXN0LXZhbGlkYXRvcicsIHtcbiAgICAgICAgcmVzdEFwaTogcmVzdEFQSSxcbiAgICAgICAgdmFsaWRhdGVSZXF1ZXN0Qm9keTogZmFsc2UsXG4gICAgICAgIHZhbGlkYXRlUmVxdWVzdFBhcmFtZXRlcnM6IHRydWUsXG4gICAgICB9KVxuICAgIH0pO1xuICAgIFxuICAgIHdpc2hsaXN0QVBJLmFkZFJlc291cmNlKFwiYWRkR2FtZVwiKS5hZGRNZXRob2QoXCJQT1NUXCIsIGFwaUludGVncmF0aW9uLCB7XG4gICAgICBhdXRob3JpemF0aW9uVHlwZTogYXBpZ2F0ZXdheS5BdXRob3JpemF0aW9uVHlwZS5DT0dOSVRPLFxuICAgICAgYXV0aG9yaXplcjoge1xuICAgICAgICBhdXRob3JpemVySWQ6IGF1dGhvcml6ZXIucmVmXG4gICAgICB9LFxuICAgICAgcmVxdWVzdE1vZGVsczogeyAnYXBwbGljYXRpb24vanNvbic6IGFkZEdhbWVUb1dpc2hsaXN0TW9kZWwgfSxcbiAgICAgIHJlcXVlc3RWYWxpZGF0b3I6IG5ldyBhcGlnYXRld2F5LlJlcXVlc3RWYWxpZGF0b3IocmVzdEFQSSwgXCJhZGRnYW1lLXdpc2hsaXN0LXJlcXVlc3QtdmFsaWRhdG9yXCIsIHtcbiAgICAgICAgcmVzdEFwaTogcmVzdEFQSSxcbiAgICAgICAgdmFsaWRhdGVSZXF1ZXN0Qm9keTogdHJ1ZSxcbiAgICAgICAgdmFsaWRhdGVSZXF1ZXN0UGFyYW1ldGVyczogZmFsc2UsXG4gICAgICB9KVxuICAgIH0pO1xuXG4gICAgd2lzaGxpc3RBUEkuYWRkUmVzb3VyY2UoXCJtb2RpZnlHYW1lXCIpLmFkZE1ldGhvZChcIlBVVFwiLCBhcGlJbnRlZ3JhdGlvbiwge1xuICAgICAgYXV0aG9yaXphdGlvblR5cGU6IGFwaWdhdGV3YXkuQXV0aG9yaXphdGlvblR5cGUuQ09HTklUTyxcbiAgICAgIGF1dGhvcml6ZXI6IHtcbiAgICAgICAgYXV0aG9yaXplcklkOiBhdXRob3JpemVyLnJlZlxuICAgICAgfSxcbiAgICAgIHJlcXVlc3RNb2RlbHM6IHsgJ2FwcGxpY2F0aW9uL2pzb24nOiBtb2RpZnlHYW1lSW5XaXNobGlzdE1vZGVsIH0sXG4gICAgICByZXF1ZXN0VmFsaWRhdG9yOiBuZXcgYXBpZ2F0ZXdheS5SZXF1ZXN0VmFsaWRhdG9yKHJlc3RBUEksIFwibW9kaWZ5Z2FtZS13aXNobGlzdC1yZXF1ZXN0LXZhbGlkYXRvclwiLCB7XG4gICAgICAgIHJlc3RBcGk6IHJlc3RBUEksXG4gICAgICAgIHZhbGlkYXRlUmVxdWVzdEJvZHk6IHRydWUsXG4gICAgICAgIHZhbGlkYXRlUmVxdWVzdFBhcmFtZXRlcnM6IGZhbHNlLFxuICAgICAgfSlcbiAgICB9KTtcblxuICAgIHdpc2hsaXN0QVBJLmFkZFJlc291cmNlKFwicmVtb3ZlR2FtZVwiKS5hZGRNZXRob2QoXCJERUxFVEVcIiwgYXBpSW50ZWdyYXRpb24sIHtcbiAgICAgIGF1dGhvcml6YXRpb25UeXBlOiBhcGlnYXRld2F5LkF1dGhvcml6YXRpb25UeXBlLkNPR05JVE8sXG4gICAgICBhdXRob3JpemVyOiB7XG4gICAgICAgIGF1dGhvcml6ZXJJZDogYXV0aG9yaXplci5yZWZcbiAgICAgIH0sXG4gICAgICByZXF1ZXN0TW9kZWxzOiB7ICdhcHBsaWNhdGlvbi9qc29uJzogbW9kaWZ5R2FtZUluV2lzaGxpc3RNb2RlbCB9LFxuICAgICAgcmVxdWVzdFZhbGlkYXRvcjogbmV3IGFwaWdhdGV3YXkuUmVxdWVzdFZhbGlkYXRvcihyZXN0QVBJLCBcImRlbGV0ZS1nYW1lLXdpc2hsaXN0LXJlcXVlc3QtdmFsaWRhdG9yXCIsIHtcbiAgICAgICAgcmVzdEFwaTogcmVzdEFQSSxcbiAgICAgICAgdmFsaWRhdGVSZXF1ZXN0Qm9keTogdHJ1ZSxcbiAgICAgICAgdmFsaWRhdGVSZXF1ZXN0UGFyYW1ldGVyczogZmFsc2UsXG4gICAgICB9KVxuICAgIH0pOyAgXG4gICAgXG4gICAgd2lzaGxpc3RBUEkuYWRkUmVzb3VyY2UoXCJhZGRQcmljZU1vbml0b3JcIikuYWRkTWV0aG9kKFwiUE9TVFwiLCBhcGlJbnRlZ3JhdGlvbiwge1xuICAgICAgYXV0aG9yaXphdGlvblR5cGU6IGFwaWdhdGV3YXkuQXV0aG9yaXphdGlvblR5cGUuQ09HTklUTyxcbiAgICAgIGF1dGhvcml6ZXI6IHtcbiAgICAgICAgYXV0aG9yaXplcklkOiBhdXRob3JpemVyLnJlZlxuICAgICAgfSxcbiAgICAgIHJlcXVlc3RNb2RlbHM6IHsgJ2FwcGxpY2F0aW9uL2pzb24nOiBhZGRQcmljZU1vbml0b3JUb1dpc2hsaXN0R2FtZSB9LFxuICAgICAgcmVxdWVzdFZhbGlkYXRvcjogbmV3IGFwaWdhdGV3YXkuUmVxdWVzdFZhbGlkYXRvcihyZXN0QVBJLCBcImFkZFByaWNlTW9uaXRvci13aXNobGlzdC1yZXF1ZXN0LXZhbGlkYXRvclwiLCB7XG4gICAgICAgIHJlc3RBcGk6IHJlc3RBUEksXG4gICAgICAgIHZhbGlkYXRlUmVxdWVzdEJvZHk6IHRydWUsXG4gICAgICAgIHZhbGlkYXRlUmVxdWVzdFBhcmFtZXRlcnM6IGZhbHNlLFxuICAgICAgfSlcbiAgICB9KTtcblxuICAgIHdpc2hsaXN0QVBJLmFkZFJlc291cmNlKFwibW9kaWZ5UHJpY2VNb25pdG9yXCIpLmFkZE1ldGhvZChcIlBVVFwiLCBhcGlJbnRlZ3JhdGlvbiwge1xuICAgICAgYXV0aG9yaXphdGlvblR5cGU6IGFwaWdhdGV3YXkuQXV0aG9yaXphdGlvblR5cGUuQ09HTklUTyxcbiAgICAgIGF1dGhvcml6ZXI6IHtcbiAgICAgICAgYXV0aG9yaXplcklkOiBhdXRob3JpemVyLnJlZlxuICAgICAgfSxcbiAgICAgIHJlcXVlc3RNb2RlbHM6IHsgJ2FwcGxpY2F0aW9uL2pzb24nOiB1cGRhdGVQcmljZU1vbml0b3JUb1dpc2hsaXN0R2FtZSB9LFxuICAgICAgcmVxdWVzdFZhbGlkYXRvcjogbmV3IGFwaWdhdGV3YXkuUmVxdWVzdFZhbGlkYXRvcihyZXN0QVBJLCBcIm1vZGlmeVByaWNlTW9uaXRvci13aXNobGlzdC1yZXF1ZXN0LXZhbGlkYXRvclwiLCB7XG4gICAgICAgIHJlc3RBcGk6IHJlc3RBUEksXG4gICAgICAgIHZhbGlkYXRlUmVxdWVzdEJvZHk6IHRydWUsXG4gICAgICAgIHZhbGlkYXRlUmVxdWVzdFBhcmFtZXRlcnM6IGZhbHNlLFxuICAgICAgfSlcbiAgICB9KTtcblxuICAgIHdpc2hsaXN0QVBJLmFkZFJlc291cmNlKFwiZGVsZXRlUHJpY2VNb25pdG9yXCIpLmFkZE1ldGhvZChcIkRFTEVURVwiLCBhcGlJbnRlZ3JhdGlvbiwge1xuICAgICAgYXV0aG9yaXphdGlvblR5cGU6IGFwaWdhdGV3YXkuQXV0aG9yaXphdGlvblR5cGUuQ09HTklUTyxcbiAgICAgIGF1dGhvcml6ZXI6IHtcbiAgICAgICAgYXV0aG9yaXplcklkOiBhdXRob3JpemVyLnJlZlxuICAgICAgfSxcbiAgICAgIHJlcXVlc3RNb2RlbHM6IHsgJ2FwcGxpY2F0aW9uL2pzb24nOiB1cGRhdGVQcmljZU1vbml0b3JUb1dpc2hsaXN0R2FtZSB9LFxuICAgICAgcmVxdWVzdFZhbGlkYXRvcjogbmV3IGFwaWdhdGV3YXkuUmVxdWVzdFZhbGlkYXRvcihyZXN0QVBJLCBcImRlbGV0ZVByaWNlTW9uaXRvci13aXNobGlzdC1yZXF1ZXN0LXZhbGlkYXRvclwiLCB7XG4gICAgICAgIHJlc3RBcGk6IHJlc3RBUEksXG4gICAgICAgIHZhbGlkYXRlUmVxdWVzdEJvZHk6IHRydWUsXG4gICAgICAgIHZhbGlkYXRlUmVxdWVzdFBhcmFtZXRlcnM6IGZhbHNlLFxuICAgICAgfSlcbiAgICB9KTtcbiAgfSBcbn1cbiJdfQ==