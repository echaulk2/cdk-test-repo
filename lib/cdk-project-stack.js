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
const iam = require("@aws-cdk/aws-iam");
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2RrLXByb2plY3Qtc3RhY2suanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJjZGstcHJvamVjdC1zdGFjay50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSxxQ0FBcUM7QUFDckMsc0RBQXNEO0FBQ3RELDhDQUE4QztBQUM5QyxrREFBa0Q7QUFDbEQsZ0RBQWdEO0FBQ2hELDhEQUE4RDtBQUM5RCw4Q0FBOEM7QUFDOUMsdURBQXVEO0FBQ3ZELHdDQUF3QztBQUN4Qyx3Q0FBeUM7QUFFekMsTUFBYSxlQUFnQixTQUFRLEdBQUcsQ0FBQyxLQUFLO0lBQzVDLFlBQVksS0FBb0IsRUFBRSxFQUFVLEVBQUUsS0FBc0I7UUFDbEUsS0FBSyxDQUFDLEtBQUssRUFBRSxFQUFFLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFFeEIsMkJBQTJCO1FBQzNCLE1BQU0sU0FBUyxHQUFHLElBQUksUUFBUSxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsNEJBQTRCLEVBQUU7WUFDdkUsWUFBWSxFQUFFLEVBQUUsSUFBSSxFQUFFLGNBQWMsRUFBRSxJQUFJLEVBQUUsUUFBUSxDQUFDLGFBQWEsQ0FBQyxNQUFNLEVBQUU7WUFDM0UsT0FBTyxFQUFFLEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBRSxJQUFJLEVBQUUsUUFBUSxDQUFDLGFBQWEsQ0FBQyxNQUFNLEVBQUU7WUFDakUsbUJBQW1CLEVBQUUsZ0JBQWdCO1NBQ3RDLENBQUMsQ0FBQztRQUVILFNBQVMsQ0FBQyx1QkFBdUIsQ0FBQztZQUNoQyxTQUFTLEVBQUUsZUFBZTtZQUMxQixZQUFZLEVBQUUsRUFBQyxJQUFJLEVBQUUsVUFBVSxFQUFFLElBQUksRUFBRSxRQUFRLENBQUMsYUFBYSxDQUFDLE1BQU0sRUFBQztZQUNyRSxPQUFPLEVBQUUsRUFBQyxJQUFJLEVBQUUsU0FBUyxFQUFFLElBQUksRUFBRSxRQUFRLENBQUMsYUFBYSxDQUFDLE1BQU0sRUFBQztZQUMvRCxZQUFZLEVBQUUsQ0FBQztZQUNmLGFBQWEs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O2dCQUNoQixtQkFBbUIsRUFBRSxJQUFJO2dCQUN6Qix5QkFBeUIsRUFBRSxLQUFLO2FBQ2pDLENBQUM7U0FDSCxDQUFDLENBQUM7SUFDTCxDQUFDO0NBQ0Y7QUEzZEQsMENBMmRDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgY2RrIGZyb20gJ0Bhd3MtY2RrL2NvcmUnO1xuaW1wb3J0ICogYXMgYXBpZ2F0ZXdheSBmcm9tICdAYXdzLWNkay9hd3MtYXBpZ2F0ZXdheSc7XG5pbXBvcnQgKiBhcyBsYW1iZGEgZnJvbSAnQGF3cy1jZGsvYXdzLWxhbWJkYSc7XG5pbXBvcnQgKiBhcyBkeW5hbW9kYiBmcm9tICdAYXdzLWNkay9hd3MtZHluYW1vZGInO1xuaW1wb3J0ICogYXMgY29nbml0byBmcm9tICdAYXdzLWNkay9hd3MtY29nbml0byc7XG5pbXBvcnQgKiBhcyBzZWNyZXRzbWFuYWdlciBmcm9tICdAYXdzLWNkay9hd3Mtc2VjcmV0c21hbmFnZXInO1xuaW1wb3J0ICogYXMgZXZlbnRzIGZyb20gJ0Bhd3MtY2RrL2F3cy1ldmVudHMnO1xuaW1wb3J0ICogYXMgdGFyZ2V0cyBmcm9tICdAYXdzLWNkay9hd3MtZXZlbnRzLXRhcmdldHMnO1xuaW1wb3J0ICogYXMgc3NtIGZyb20gJ0Bhd3MtY2RrL2F3cy1zc20nO1xuaW1wb3J0IGlhbSA9IHJlcXVpcmUoXCJAYXdzLWNkay9hd3MtaWFtXCIpO1xuXG5leHBvcnQgY2xhc3MgQ2RrUHJvamVjdFN0YWNrIGV4dGVuZHMgY2RrLlN0YWNrIHtcbiAgY29uc3RydWN0b3Ioc2NvcGU6IGNkay5Db25zdHJ1Y3QsIGlkOiBzdHJpbmcsIHByb3BzPzogY2RrLlN0YWNrUHJvcHMpIHtcbiAgICBzdXBlcihzY29wZSwgaWQsIHByb3BzKTtcblxuICAgIC8vRHluYW1vREIgVGFibGUgRGVmaW5pdGlvblxuICAgIGNvbnN0IGdhbWVUYWJsZSA9IG5ldyBkeW5hbW9kYi5UYWJsZSh0aGlzLCAnYXdzLWNkay1keW5hbW9kYi1nYW1lVGFibGUnLCB7XG4gICAgICBwYXJ0aXRpb25LZXk6IHsgbmFtZTogJ3BhcnRpdGlvbktleScsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuU1RSSU5HIH0sXG4gICAgICBzb3J0S2V5OiB7IG5hbWU6ICdzb3J0S2V5JywgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5TVFJJTkcgfSxcbiAgICAgIHRpbWVUb0xpdmVBdHRyaWJ1dGU6IFwiZXhwaXJhdGlvbkRhdGVcIlxuICAgIH0pO1xuXG4gICAgZ2FtZVRhYmxlLmFkZEdsb2JhbFNlY29uZGFyeUluZGV4KHtcbiAgICAgIGluZGV4TmFtZTogJ2l0ZW1UeXBlSW5kZXgnLFxuICAgICAgcGFydGl0aW9uS2V5OiB7bmFtZTogJ2l0ZW1UeXBlJywgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5TVFJJTkd9LFxuICAgICAgc29ydEtleToge25hbWU6ICdzb3J0S2V5JywgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5TVFJJTkd9LFxuICAgICAgcmVhZENhcGFjaXR5OiAxLFxuICAgICAgd3JpdGVDYXBhY2l0eTogMSxcbiAgICAgIHByb2plY3Rpb25UeXBlOiBkeW5hbW9kYi5Qcm9qZWN0aW9uVHlwZS5BTEwsXG4gICAgfSk7XG4gICAgXG4gICAgZ2FtZVRhYmxlLmFkZEdsb2JhbFNlY29uZGFyeUluZGV4KHtcbiAgICAgIGluZGV4TmFtZTogJ0dTSS0xJyxcbiAgICAgIHBhcnRpdGlvbktleToge25hbWU6ICdHUzEnLCB0eXBlOiBkeW5hbW9kYi5BdHRyaWJ1dGVUeXBlLlNUUklOR30sXG4gICAgICByZWFkQ2FwYWNpdHk6IDEsXG4gICAgICB3cml0ZUNhcGFjaXR5OiAxLFxuICAgICAgcHJvamVjdGlvblR5cGU6IGR5bmFtb2RiLlByb2plY3Rpb25UeXBlLkFMTCxcbiAgICB9KTtcblxuICAgIGdhbWVUYWJsZS5hZGRHbG9iYWxTZWNvbmRhcnlJbmRleCh7XG4gICAgICBpbmRleE5hbWU6ICdHU0ktMicsXG4gICAgICBwYXJ0aXRpb25LZXk6IHtuYW1lOiAncGFydGl0aW9uS2V5JywgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5TVFJJTkd9LFxuICAgICAgc29ydEtleToge25hbWU6ICdHUzEnLCB0eXBlOiBkeW5hbW9kYi5BdHRyaWJ1dGVUeXBlLlNUUklOR30sXG4gICAgICByZWFkQ2FwYWNpdHk6IDEsXG4gICAgICB3cml0ZUNhcGFjaXR5OiAxLFxuICAgICAgcHJvamVjdGlvblR5cGU6IGR5bmFtb2RiLlByb2plY3Rpb25UeXBlLkFMTCxcbiAgICB9KTtcblxuXG4gICAgY29uc3QgcHJpY2VEYXRhVVJMID0gc3NtLlN0cmluZ1BhcmFtZXRlci5mcm9tU3RyaW5nUGFyYW1ldGVyQXR0cmlidXRlcyh0aGlzLCAncHJpY2VEYXRhVXJsJywge1xuICAgICAgcGFyYW1ldGVyTmFtZTogJ2Nkay1wcm9qZWN0LXByaWNlRGF0YVVSTCcsXG4gICAgfSkuc3RyaW5nVmFsdWU7XG5cbiAgICBjb25zdCBzZXNTb3VyY2VFbWFpbEFkZHJlc3MgPSBzc20uU3RyaW5nUGFyYW1ldGVyLmZyb21TdHJpbmdQYXJhbWV0ZXJBdHRyaWJ1dGVzKHRoaXMsICdzZXNTb3VyY2VFbWFpbEFkZHJlc3MnLCB7XG4gICAgICBwYXJhbWV0ZXJOYW1lOiAnY2RrLXByb2plY3Qtc2VzU291cmNlRW1haWxBZGRyZXNzJ1xuICAgIH0pLnN0cmluZ1ZhbHVlO1xuXG4gICAgICAgIC8vTGFtYmRhIEZ1bmN0aW9uXG4gICAgY29uc3QgbGFtYmRhRnVuY3Rpb24gPSBuZXcgbGFtYmRhLkZ1bmN0aW9uKHRoaXMsICdhd3MtY2RrLWdhbWVBUEktZnVuY3Rpb24nLCB7XG4gICAgICBjb2RlOiBsYW1iZGEuQ29kZS5mcm9tQXNzZXQoXCJmdW5jdGlvbnNcIiksXG4gICAgICBoYW5kbGVyOiAnaW5kZXguaGFuZGxlcicsXG4gICAgICBydW50aW1lOiBsYW1iZGEuUnVudGltZS5OT0RFSlNfMTRfWCxcbiAgICAgIGVudmlyb25tZW50OiB7XG4gICAgICAgIERZTkFNT19EQl9HQU1FX1RBQkxFOiBnYW1lVGFibGUudGFibGVOYW1lLFxuICAgICAgICBQUklDRV9EQVRBX1VSTDogcHJpY2VEYXRhVVJMXG4gICAgICB9LFxuICAgICAgdGltZW91dDogY2RrLkR1cmF0aW9uLnNlY29uZHMoMzApLFxuICAgICAgZGVzY3JpcHRpb246ICdMYW1iZGEgcmVzcG9uc2libGUgZm9yIGhhbmRsaW5nIHRoZSBHYW1lIEFQSSBwdWJsaWMgZW5kcG9pbnRzJ1xuICAgIH0pO1xuXG4gICAgY29uc3Qgbm90aWZpY2F0aW9uc0xhbWJkYSA9IG5ldyBsYW1iZGEuRnVuY3Rpb24odGhpcywgJ2F3cy1jZGstbm90aWZpY2F0aW9ucy1mdW5jdGlvbicsIHtcbiAgICAgIGNvZGU6IGxhbWJkYS5Db2RlLmZyb21Bc3NldChcImZ1bmN0aW9uc1wiKSxcbiAgICAgIGhhbmRsZXI6ICdub3RpZmljYXRpb25zLmhhbmRsZXInLFxuICAgICAgcnVudGltZTogbGFtYmRhLlJ1bnRpbWUuTk9ERUpTXzE0X1gsXG4gICAgICBlbnZpcm9ubWVudDoge1xuICAgICAgICBEWU5BTU9fREJfR0FNRV9UQUJMRTogZ2FtZVRhYmxlLnRhYmxlTmFtZSxcbiAgICAgICAgUFJJQ0VfREFUQV9VUkw6IHByaWNlRGF0YVVSTCxcbiAgICAgICAgU0VTX1NPVVJDRV9FTUFJTF9BRERSRVNTOiBzZXNTb3VyY2VFbWFpbEFkZHJlc3NcbiAgICAgIH0sXG4gICAgICB0aW1lb3V0OiBjZGsuRHVyYXRpb24uc2Vjb25kcygzMCksXG4gICAgICBkZXNjcmlwdGlvbjogJ0xhbWJkYSByZXNwb25zaWJsZSBmb3Igc2VuZGluZyBDb2xsZWN0aW9uIG5vdGlmaWNhdGlvbnMnXG4gICAgfSk7XG5cbiAgICBjb25zdCBzZXNMYW1iZGFQb2xpY3kgPSBuZXcgaWFtLlBvbGljeVN0YXRlbWVudCh7XG4gICAgICBlZmZlY3Q6IGlhbS5FZmZlY3QuQUxMT1csXG4gICAgICBhY3Rpb25zOiBbXCJzZXM6U2VuZEVtYWlsXCJdLFxuICAgICAgcmVzb3VyY2VzOiBbXCIqXCJdLFxuICAgIH0pO1xuXG4gICAgLy9SdW5zIHRoZSBXaXNobGlzdCBOb3RpZmljYXRpb25zIGF0IG1pZG5pZ2h0IGV2ZXJ5IHdlZWtkYXlcbiAgICBjb25zdCBldmVudFJ1bGUgPSBuZXcgZXZlbnRzLlJ1bGUodGhpcywgJ3NjaGVkdWxlUnVsZScsIHtcbiAgICAgIHNjaGVkdWxlOiBldmVudHMuU2NoZWR1bGUuZXhwcmVzc2lvbignY3JvbigwIDUgPyAqIE1PTi1GUkkgKiknKVxuICAgIH0pO1xuICAgIGV2ZW50UnVsZS5hZGRUYXJnZXQobmV3IHRhcmdldHMuTGFtYmRhRnVuY3Rpb24obm90aWZpY2F0aW9uc0xhbWJkYSkpO1xuXG4gICAgbGFtYmRhRnVuY3Rpb24uYWRkVG9Sb2xlUG9saWN5KHNlc0xhbWJkYVBvbGljeSk7XG4gICAgbm90aWZpY2F0aW9uc0xhbWJkYS5hZGRUb1JvbGVQb2xpY3koc2VzTGFtYmRhUG9saWN5KTtcbiAgICBnYW1lVGFibGUuZ3JhbnRSZWFkV3JpdGVEYXRhKGxhbWJkYUZ1bmN0aW9uKTsgXG4gICAgZ2FtZVRhYmxlLmdyYW50UmVhZFdyaXRlRGF0YShub3RpZmljYXRpb25zTGFtYmRhKTtcblxuICAgIC8vQVBJIEdhdGV3YXlcbiAgICBjb25zdCByZXN0QVBJID0gbmV3IGFwaWdhdGV3YXkuTGFtYmRhUmVzdEFwaSh0aGlzLCBcImF3cy1jZGstcmVzdC1hcGlcIiwge1xuICAgICAgaGFuZGxlcjogbGFtYmRhRnVuY3Rpb24sXG4gICAgICBwcm94eTogZmFsc2UsXG4gICAgICByZXN0QXBpTmFtZTogXCJHYW1lIE1hbmFnZW1lbnQgQVBJXCJcbiAgICB9KTtcbiAgICBjb25zdCBhcGlJbnRlZ3JhdGlvbiA9IG5ldyBhcGlnYXRld2F5LkxhbWJkYUludGVncmF0aW9uKGxhbWJkYUZ1bmN0aW9uKTtcbiAgICBcbiAgICAvL0NvZ25pdG9cbiAgICBjb25zdCB1c2VyUG9vbCA9IG5ldyBjb2duaXRvLlVzZXJQb29sKHRoaXMsICd1c2VyUG9vbCcsIHtcbiAgICAgIHNlbGZTaWduVXBFbmFibGVkOiB0cnVlLFxuICAgICAgdXNlclZlcmlmaWNhdGlvbjoge1xuICAgICAgICBlbWFpbFN1YmplY3Q6ICdWZXJpZnkgeW91ciBlbWFpbCEnLFxuICAgICAgICBlbWFpbEJvZHk6ICdIZWxsbywgVGhhbmtzIGZvciBzaWduaW5nIHVwISB7IyNWZXJpZnkgRW1haWwjI30nLFxuICAgICAgICBlbWFpbFN0eWxlOiBjb2duaXRvLlZlcmlmaWNhdGlvbkVtYWlsU3R5bGUuTElOS1xuICAgICAgfSxcbiAgICAgIHNpZ25JbkFsaWFzZXM6IHtcbiAgICAgICAgdXNlcm5hbWU6IHRydWUsXG4gICAgICAgIGVtYWlsOiB0cnVlXG4gICAgICB9LFxuICAgICAgc3RhbmRhcmRBdHRyaWJ1dGVzOiB7XG4gICAgICAgIGVtYWlsOiB7XG4gICAgICAgICAgcmVxdWlyZWQ6IHRydWVcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pO1xuXG4gICAgY29uc3Qgb0F1dGhTZWNyZXQgPSBzZWNyZXRzbWFuYWdlci5TZWNyZXQuZnJvbVNlY3JldENvbXBsZXRlQXJuKFxuICAgICAgdGhpcyxcbiAgICAgICdkYi1vYXV0aC1pZCcsXG4gICAgICAnYXJuOmF3czpzZWNyZXRzbWFuYWdlcjp1cy1lYXN0LTE6MjIxMTc2MTQwMzY1OnNlY3JldDoyMjAwODYyMTYwMTUtaTMzc3RicWpiZmg1cmxtOXFpM3VhaW1iOWVvNmducnMuYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20tNnhoWkhZJ1xuICAgICk7XG5cbiAgICBjb25zdCB1c2VyUG9vbElkZW50aXR5UHJvdmlkZXJHb29nbGUgPSBuZXcgY29nbml0by5Vc2VyUG9vbElkZW50aXR5UHJvdmlkZXJHb29nbGUodGhpcywgJ3VzZXJQb29sR29vZ2xlJywge1xuICAgICAgdXNlclBvb2w6IHVzZXJQb29sLFxuICAgICAgY2xpZW50SWQ6IG9BdXRoU2VjcmV0LnNlY3JldE5hbWUsXG4gICAgICBjbGllbnRTZWNyZXQ6IG9BdXRoU2VjcmV0LnNlY3JldFZhbHVlLnRvU3RyaW5nKCksXG4gICAgICBhdHRyaWJ1dGVNYXBwaW5nOiB7XG4gICAgICAgIGVtYWlsOiB7XG4gICAgICAgICAgYXR0cmlidXRlTmFtZTogY29nbml0by5Qcm92aWRlckF0dHJpYnV0ZS5HT09HTEVfRU1BSUwuYXR0cmlidXRlTmFtZSxcbiAgICAgICAgfSxcbiAgICAgICAgY3VzdG9tOiB7XG4gICAgICAgICAgZW1haWxfdmVyaWZpZWQ6IGNvZ25pdG8uUHJvdmlkZXJBdHRyaWJ1dGUub3RoZXIoJ2VtYWlsX3ZlcmlmaWVkJyksXG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICBzY29wZXM6IFsncHJvZmlsZScsJ2VtYWlsJywnb3BlbmlkJ11cbiAgICB9KTtcblxuICAgIGNvbnN0IHVzZXJQb29sQ2xpZW50ID0gbmV3IGNvZ25pdG8uVXNlclBvb2xDbGllbnQodGhpcywgJ3VzZXJQb29sQ2xpZW50Jywge1xuICAgICAgdXNlclBvb2w6IHVzZXJQb29sLFxuICAgICAgb0F1dGg6IHtcbiAgICAgICAgY2FsbGJhY2tVcmxzOiBbJ2h0dHBzOi8vZXhhbXBsZS5jb20vY2FsbGJhY2snXSxcbiAgICAgICAgbG9nb3V0VXJsczogWydodHRwczovL2V4YW1wbGUuY29tL3NpZ25vdXQnXSxcbiAgICAgICAgZmxvd3M6IHtcbiAgICAgICAgICBhdXRob3JpemF0aW9uQ29kZUdyYW50OiBmYWxzZSxcbiAgICAgICAgICBpbXBsaWNpdENvZGVHcmFudDogdHJ1ZSxcbiAgICAgICAgICBjbGllbnRDcmVkZW50aWFsczogZmFsc2VcbiAgICAgICAgfSxcbiAgICAgICAgc2NvcGVzOiBbY29nbml0by5PQXV0aFNjb3BlLk9QRU5JRF1cbiAgICAgIH1cbiAgICB9KTtcblxuICAgIGNvbnN0IHVzZXJQb29sRG9tYWluID0gbmV3IGNvZ25pdG8uVXNlclBvb2xEb21haW4odGhpcywgJ3VzZXJQb29sRG9tYWluJywge1xuICAgICAgdXNlclBvb2w6IHVzZXJQb29sLFxuICAgICAgY29nbml0b0RvbWFpbjoge1xuICAgICAgICBkb21haW5QcmVmaXg6ICdjZGtnYW1lYXBpZGVtbydcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIGNvbnN0IGF1dGhvcml6ZXIgPSBuZXcgYXBpZ2F0ZXdheS5DZm5BdXRob3JpemVyKHRoaXMsICdjZm5BdXRoJywge1xuICAgICAgcmVzdEFwaUlkOiByZXN0QVBJLnJlc3RBcGlJZCxcbiAgICAgIG5hbWU6ICdnYW1lQXV0aG9yaXplcicsXG4gICAgICB0eXBlOiAnQ09HTklUT19VU0VSX1BPT0xTJyxcbiAgICAgIGlkZW50aXR5U291cmNlOiAnbWV0aG9kLnJlcXVlc3QuaGVhZGVyLkF1dGhvcml6YXRpb24nLFxuICAgICAgcHJvdmlkZXJBcm5zOiBbdXNlclBvb2wudXNlclBvb2xBcm5dXG4gICAgfSlcblxuICAgIC8vTWV0aG9kIHNjaGVtYVxuICAgIGNvbnN0IGFkZEdhbWVNb2RlbCA9IHJlc3RBUEkuYWRkTW9kZWwoJ0FkZFJlcXVlc3RNb2RlbCcsIHtcbiAgICAgIGNvbnRlbnRUeXBlOiAnYXBwbGljYXRpb24vanNvbicsXG4gICAgICBtb2RlbE5hbWU6ICdBZGRSZXF1ZXN0TW9kZWwnLFxuICAgICAgc2NoZW1hOiB7XG4gICAgICAgIHRpdGxlOiAncG9zdE1vZGVsJyxcbiAgICAgICAgdHlwZTogYXBpZ2F0ZXdheS5Kc29uU2NoZW1hVHlwZS5PQkpFQ1QsICAgICAgXG4gICAgICAgIHJlcXVpcmVkOiBbJ2dhbWVOYW1lJ10sXG4gICAgICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgICAgIGdhbWVOYW1lOiB7IHR5cGU6IGFwaWdhdGV3YXkuSnNvblNjaGVtYVR5cGUuU1RSSU5HIH0sXG4gICAgICAgICAgICB5ZWFyUmVsZWFzZWQ6IHsgdHlwZTogYXBpZ2F0ZXdheS5Kc29uU2NoZW1hVHlwZS5JTlRFR0VSIH0sXG4gICAgICAgICAgICBnZW5yZTogeyB0eXBlOiBhcGlnYXRld2F5Lkpzb25TY2hlbWFUeXBlLlNUUklORyB9LFxuICAgICAgICAgICAgZGV2ZWxvcGVyOiB7IHR5cGU6IGFwaWdhdGV3YXkuSnNvblNjaGVtYVR5cGUuU1RSSU5HIH0sXG4gICAgICAgICAgICBjb25zb2xlOiB7IHR5cGU6IGFwaWdhdGV3YXkuSnNvblNjaGVtYVR5cGUuU1RSSU5HIH0sICAgICAgICAgIFxuICAgICAgICB9XG4gICAgICB9XG4gICAgfSk7ICAgXG4gICAgXG4gICAgY29uc3QgbW9kaWZ5R2FtZU1vZGVsID0gcmVzdEFQSS5hZGRNb2RlbCgnTW9kaWZ5UmVxdWVzdE1vZGVsJywge1xuICAgICAgY29udGVudFR5cGU6ICdhcHBsaWNhdGlvbi9qc29uJyxcbiAgICAgIG1vZGVsTmFtZTogJ01vZGlmeVJlcXVlc3RNb2RlbCcsXG4gICAgICBzY2hlbWE6IHtcbiAgICAgIHNjaGVtYTogYXBpZ2F0ZXdheS5Kc29uU2NoZW1hVmVyc2lvbi5EUkFGVDQsXG4gICAgICB0aXRsZTogJ3Bvc3RNb2RlbCcsXG4gICAgICB0eXBlOiBhcGlnYXRld2F5Lkpzb25TY2hlbWFUeXBlLk9CSkVDVCxcbiAgICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgICBnYW1lSUQ6IHsgdHlwZTogYXBpZ2F0ZXdheS5Kc29uU2NoZW1hVHlwZS5TVFJJTkcgfSxcbiAgICAgICAgICBnYW1lTmFtZTogeyB0eXBlOiBhcGlnYXRld2F5Lkpzb25TY2hlbWFUeXBlLlNUUklORyB9LFxuICAgICAgICAgIHllYXJSZWxlYXNlZDogeyB0eXBlOiBhcGlnYXRld2F5Lkpzb25TY2hlbWFUeXBlLklOVEVHRVIgfSxcbiAgICAgICAgICBnZW5yZTogeyB0eXBlOiBhcGlnYXRld2F5Lkpzb25TY2hlbWFUeXBlLlNUUklORyB9LFxuICAgICAgICAgIGRldmVsb3BlcjogeyB0eXBlOiBhcGlnYXRld2F5Lkpzb25TY2hlbWFUeXBlLlNUUklORyB9LFxuICAgICAgICAgIGNvbnNvbGU6IHsgdHlwZTogYXBpZ2F0ZXdheS5Kc29uU2NoZW1hVHlwZS5TVFJJTkcgfSwgICAgICAgICAgXG4gICAgICB9LFxuICAgICAgcmVxdWlyZWQ6IFsnZ2FtZU5hbWUnLCAnZ2FtZUlEJ10sXG4gICAgICB9LFxuICAgIH0pO1xuICAgIFxuICAgIGNvbnN0IGdldENvbGxlY3Rpb25Nb2RlbCA9IHJlc3RBUEkuYWRkTW9kZWwoJ1dpc2hsaXN0UmVxdWVzdE1vZGVsJywge1xuICAgICAgY29udGVudFR5cGU6ICdhcHBsaWNhdGlvbi9qc29uJyxcbiAgICAgIG1vZGVsTmFtZTogJ1dpc2hsaXN0UmVxdWVzdE1vZGVsJyxcbiAgICAgIHNjaGVtYToge1xuICAgICAgc2NoZW1hOiBhcGlnYXRld2F5Lkpzb25TY2hlbWFWZXJzaW9uLkRSQUZUNCxcbiAgICAgIHRpdGxlOiAnd2lzaGxpc3RNb2RlbCcsXG4gICAgICB0eXBlOiBhcGlnYXRld2F5Lkpzb25TY2hlbWFUeXBlLk9CSkVDVCxcbiAgICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgICBjb2xsZWN0aW9uSUQ6IHsgdHlwZTogYXBpZ2F0ZXdheS5Kc29uU2NoZW1hVHlwZS5TVFJJTkcgfSwgICAgICAgICAgICAgICAgIFxuICAgICAgfSxcbiAgICAgIHJlcXVpcmVkOiBbJ2NvbGxlY3Rpb25JRCddLFxuICAgICAgfSxcbiAgICB9KVxuXG4gICAgY29uc3QgYWRkR2FtZVRvV2lzaGxpc3RNb2RlbCA9IHJlc3RBUEkuYWRkTW9kZWwoJ1dpc2hsaXN0QWRkUmVxdWVzdE1vZGVsJywge1xuICAgICAgY29udGVudFR5cGU6ICdhcHBsaWNhdGlvbi9qc29uJyxcbiAgICAgIG1vZGVsTmFtZTogJ1dpc2hsaXN0QWRkUmVxdWVzdE1vZGVsJyxcbiAgICAgIHNjaGVtYToge1xuICAgICAgc2NoZW1hOiBhcGlnYXRld2F5Lkpzb25TY2hlbWFWZXJzaW9uLkRSQUZUNCxcbiAgICAgIHRpdGxlOiAnd2lzaGxpc3RNb2RlbCcsXG4gICAgICB0eXBlOiBhcGlnYXRld2F5Lkpzb25TY2hlbWFUeXBlLk9CSkVDVCxcbiAgICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgICBjb2xsZWN0aW9uSUQ6IHsgdHlwZTogYXBpZ2F0ZXdheS5Kc29uU2NoZW1hVHlwZS5TVFJJTkcgfSxcbiAgICAgICAgICBnYW1lTmFtZTogeyB0eXBlOiBhcGlnYXRld2F5Lkpzb25TY2hlbWFUeXBlLlNUUklORyB9LFxuICAgICAgICAgIHllYXJSZWxlYXNlZDogeyB0eXBlOiBhcGlnYXRld2F5Lkpzb25TY2hlbWFUeXBlLklOVEVHRVIgfSxcbiAgICAgICAgICBnZW5yZTogeyB0eXBlOiBhcGlnYXRld2F5Lkpzb25TY2hlbWFUeXBlLlNUUklORyB9LFxuICAgICAgICAgIGRldmVsb3BlcjogeyB0eXBlOiBhcGlnYXRld2F5Lkpzb25TY2hlbWFUeXBlLlNUUklORyB9LFxuICAgICAgICAgIGNvbnNvbGU6IHsgdHlwZTogYXBpZ2F0ZXdheS5Kc29uU2NoZW1hVHlwZS5TVFJJTkcgfSxcbiAgICAgICAgICBkZXNpcmVkUHJpY2U6IHsgdHlwZTogYXBpZ2F0ZXdheS5Kc29uU2NoZW1hVHlwZS5JTlRFR0VSIH0sXG4gICAgICAgICAgZGVzaXJlZENvbmRpdGlvbjogeyB0eXBlOiBhcGlnYXRld2F5Lkpzb25TY2hlbWFUeXBlLlNUUklORyB9LCAgICAgICAgICAgICAgICAgICBcbiAgICAgIH0sXG4gICAgICByZXF1aXJlZDogWydnYW1lTmFtZScsICdjb2xsZWN0aW9uSUQnXSxcbiAgICAgIH0sXG4gICAgfSlcblxuICAgIGNvbnN0IG1vZGlmeUdhbWVJbldpc2hsaXN0TW9kZWwgPSByZXN0QVBJLmFkZE1vZGVsKCdXaXNobGlzdE1vZGlmeVJlcXVlc3RNb2RlbCcsIHtcbiAgICAgIGNvbnRlbnRUeXBlOiAnYXBwbGljYXRpb24vanNvbicsXG4gICAgICBtb2RlbE5hbWU6ICdXaXNobGlzdE1vZGlmeVJlcXVlc3RNb2RlbCcsXG4gICAgICBzY2hlbWE6IHtcbiAgICAgIHNjaGVtYTogYXBpZ2F0ZXdheS5Kc29uU2NoZW1hVmVyc2lvbi5EUkFGVDQsXG4gICAgICB0aXRsZTogJ3dpc2hsaXN0TW9kZWwnLFxuICAgICAgdHlwZTogYXBpZ2F0ZXdheS5Kc29uU2NoZW1hVHlwZS5PQkpFQ1QsXG4gICAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICAgICAgaWQ6IHsgdHlwZTogYXBpZ2F0ZXdheS5Kc29uU2NoZW1hVHlwZS5TVFJJTkcgfSxcbiAgICAgICAgICBjb2xsZWN0aW9uSUQ6IHsgdHlwZTogYXBpZ2F0ZXdheS5Kc29uU2NoZW1hVHlwZS5TVFJJTkcgfSxcbiAgICAgICAgICBnYW1lTmFtZTogeyB0eXBlOiBhcGlnYXRld2F5Lkpzb25TY2hlbWFUeXBlLlNUUklORyB9LFxuICAgICAgICAgIHllYXJSZWxlYXNlZDogeyB0eXBlOiBhcGlnYXRld2F5Lkpzb25TY2hlbWFUeXBlLklOVEVHRVIgfSxcbiAgICAgICAgICBnZW5yZTogeyB0eXBlOiBhcGlnYXRld2F5Lkpzb25TY2hlbWFUeXBlLlNUUklORyB9LFxuICAgICAgICAgIGRldmVsb3BlcjogeyB0eXBlOiBhcGlnYXRld2F5Lkpzb25TY2hlbWFUeXBlLlNUUklORyB9LFxuICAgICAgICAgIGNvbnNvbGU6IHsgdHlwZTogYXBpZ2F0ZXdheS5Kc29uU2NoZW1hVHlwZS5TVFJJTkcgfSxcbiAgICAgICAgICBkZXNpcmVkUHJpY2U6IHsgdHlwZTogYXBpZ2F0ZXdheS5Kc29uU2NoZW1hVHlwZS5JTlRFR0VSIH0sXG4gICAgICAgICAgZGVzaXJlZENvbmRpdGlvbjogeyB0eXBlOiBhcGlnYXRld2F5Lkpzb25TY2hlbWFUeXBlLlNUUklORyB9LCAgICAgICAgICAgICAgICAgICBcbiAgICAgIH0sXG4gICAgICByZXF1aXJlZDogWydnYW1lTmFtZScsICdpZCcsICdjb2xsZWN0aW9uSUQnXSxcbiAgICAgIH0sXG4gICAgfSlcblxuICAgIGNvbnN0IGFkZFByaWNlTW9uaXRvclRvV2lzaGxpc3RHYW1lID0gcmVzdEFQSS5hZGRNb2RlbCgnUHJpY2VNb25pdG9yUmVxdWVzdE1vbmRlbCcsIHtcbiAgICAgIGNvbnRlbnRUeXBlOiAnYXBwbGljYXRpb24vanNvbicsXG4gICAgICBtb2RlbE5hbWU6ICdhZGRQcmljZU1vbml0b3InLFxuICAgICAgc2NoZW1hOiB7XG4gICAgICBzY2hlbWE6IGFwaWdhdGV3YXkuSnNvblNjaGVtYVZlcnNpb24uRFJBRlQ0LFxuICAgICAgdGl0bGU6ICd3aXNobGlzdE1vZGVsJyxcbiAgICAgIHR5cGU6IGFwaWdhdGV3YXkuSnNvblNjaGVtYVR5cGUuT0JKRUNULFxuICAgICAgcHJvcGVydGllczoge1xuICAgICAgICAgIGdhbWVJRDogeyB0eXBlOiBhcGlnYXRld2F5Lkpzb25TY2hlbWFUeXBlLlNUUklORyB9LFxuICAgICAgICAgIGNvbGxlY3Rpb25JRDogeyB0eXBlOiBhcGlnYXRld2F5Lkpzb25TY2hlbWFUeXBlLlNUUklORyB9LFxuICAgICAgICAgIGRlc2lyZWRQcmljZTogeyB0eXBlOiBhcGlnYXRld2F5Lkpzb25TY2hlbWFUeXBlLklOVEVHRVIgfSxcbiAgICAgICAgICBkZXNpcmVkQ29uZGl0aW9uOiB7IHR5cGU6IGFwaWdhdGV3YXkuSnNvblNjaGVtYVR5cGUuU1RSSU5HIH0sICAgICAgICAgICAgICAgICAgIFxuICAgICAgfSxcbiAgICAgIHJlcXVpcmVkOiBbJ2dhbWVJRCcsICdjb2xsZWN0aW9uSUQnLCAnZGVzaXJlZFByaWNlJywgJ2Rlc2lyZWRDb25kaXRpb24nXSxcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIGNvbnN0IHVwZGF0ZVByaWNlTW9uaXRvclRvV2lzaGxpc3RHYW1lID0gcmVzdEFQSS5hZGRNb2RlbCgnVXBkYXRlUHJpY2VNb25pdG9yUmVxdWVzdE1vbmRlbCcsIHtcbiAgICAgIGNvbnRlbnRUeXBlOiAnYXBwbGljYXRpb24vanNvbicsXG4gICAgICBtb2RlbE5hbWU6ICd1cGRhdGVQcmljZU1vbml0b3InLFxuICAgICAgc2NoZW1hOiB7XG4gICAgICBzY2hlbWE6IGFwaWdhdGV3YXkuSnNvblNjaGVtYVZlcnNpb24uRFJBRlQ0LFxuICAgICAgdGl0bGU6ICd3aXNobGlzdE1vZGVsJyxcbiAgICAgIHR5cGU6IGFwaWdhdGV3YXkuSnNvblNjaGVtYVR5cGUuT0JKRUNULFxuICAgICAgcHJvcGVydGllczoge1xuICAgICAgICAgIHByaWNlTW9uaXRvcklEOiB7IHR5cGU6IGFwaWdhdGV3YXkuSnNvblNjaGVtYVR5cGUuU1RSSU5HIH0sXG4gICAgICAgICAgZ2FtZUlEOiB7IHR5cGU6IGFwaWdhdGV3YXkuSnNvblNjaGVtYVR5cGUuU1RSSU5HIH0sXG4gICAgICAgICAgY29sbGVjdGlvbklEOiB7IHR5cGU6IGFwaWdhdGV3YXkuSnNvblNjaGVtYVR5cGUuU1RSSU5HIH0sXG4gICAgICAgICAgZGVzaXJlZFByaWNlOiB7IHR5cGU6IGFwaWdhdGV3YXkuSnNvblNjaGVtYVR5cGUuSU5URUdFUiB9LFxuICAgICAgICAgIGRlc2lyZWRDb25kaXRpb246IHsgdHlwZTogYXBpZ2F0ZXdheS5Kc29uU2NoZW1hVHlwZS5TVFJJTkcgfSwgICAgICAgICAgICAgICAgICAgXG4gICAgICB9LFxuICAgICAgcmVxdWlyZWQ6IFsncHJpY2VNb25pdG9ySUQnLCAnZ2FtZUlEJywgJ2NvbGxlY3Rpb25JRCcsICdkZXNpcmVkUHJpY2UnLCAnZGVzaXJlZENvbmRpdGlvbiddLFxuICAgICAgfVxuICAgIH0pO1xuXG4gICAgLy9NZXRob2QgZGVmaW5pdGlvbnNcbiAgICByZXN0QVBJLnJvb3QuYWRkUmVzb3VyY2UoXCJjcmVhdGVVc2VyXCIpLmFkZE1ldGhvZChcIlBPU1RcIiwgYXBpSW50ZWdyYXRpb24sIHtcbiAgICAgIGF1dGhvcml6YXRpb25UeXBlOiBhcGlnYXRld2F5LkF1dGhvcml6YXRpb25UeXBlLkNPR05JVE8sXG4gICAgICBhdXRob3JpemVyOiB7XG4gICAgICAgIGF1dGhvcml6ZXJJZDogYXV0aG9yaXplci5yZWZcbiAgICAgIH0sXG4gICAgICByZXF1ZXN0VmFsaWRhdG9yOiBuZXcgYXBpZ2F0ZXdheS5SZXF1ZXN0VmFsaWRhdG9yKHJlc3RBUEksIFwiY3JlYXRlLXVzZXItcmVxdWVzdC12YWxpZGF0b3JcIiwge1xuICAgICAgICByZXN0QXBpOiByZXN0QVBJLFxuICAgICAgICB2YWxpZGF0ZVJlcXVlc3RCb2R5OiBmYWxzZSxcbiAgICAgICAgdmFsaWRhdGVSZXF1ZXN0UGFyYW1ldGVyczogZmFsc2UsXG4gICAgICB9KVxuICAgIH0pO1xuXG4gICAgcmVzdEFQSS5yb290LmFkZFJlc291cmNlKFwiZ2V0R2FtZVwiKS5hZGRNZXRob2QoXCJHRVRcIiwgYXBpSW50ZWdyYXRpb24sIHtcbiAgICAgIGF1dGhvcml6YXRpb25UeXBlOiBhcGlnYXRld2F5LkF1dGhvcml6YXRpb25UeXBlLkNPR05JVE8sXG4gICAgICBhdXRob3JpemVyOiB7XG4gICAgICAgIGF1dGhvcml6ZXJJZDogYXV0aG9yaXplci5yZWZcbiAgICAgIH0sXG4gICAgICByZXF1ZXN0UGFyYW1ldGVyczoge1xuICAgICAgICBcIm1ldGhvZC5yZXF1ZXN0LnF1ZXJ5c3RyaW5nLmdhbWVJRFwiOiB0cnVlLCAgICAgICAgXG4gICAgICB9LFxuICAgICAgcmVxdWVzdFZhbGlkYXRvcjogbmV3IGFwaWdhdGV3YXkuUmVxdWVzdFZhbGlkYXRvcihyZXN0QVBJLCAnZ2V0LXJlcXVlc3QtdmFsaWRhdG9yJywge1xuICAgICAgICByZXN0QXBpOiByZXN0QVBJLFxuICAgICAgICB2YWxpZGF0ZVJlcXVlc3RCb2R5OiBmYWxzZSxcbiAgICAgICAgdmFsaWRhdGVSZXF1ZXN0UGFyYW1ldGVyczogdHJ1ZSxcbiAgICAgIH0pXG4gICAgfSk7XG5cbiAgICByZXN0QVBJLnJvb3QuYWRkUmVzb3VyY2UoXCJsaXN0R2FtZXNcIikuYWRkTWV0aG9kKFwiR0VUXCIsIGFwaUludGVncmF0aW9uLCB7XG4gICAgICBhdXRob3JpemF0aW9uVHlwZTogYXBpZ2F0ZXdheS5BdXRob3JpemF0aW9uVHlwZS5DT0dOSVRPLFxuICAgICAgYXV0aG9yaXplcjoge1xuICAgICAgICBhdXRob3JpemVySWQ6IGF1dGhvcml6ZXIucmVmXG4gICAgICB9XG4gICAgfSk7XG4gICAgXG4gICAgcmVzdEFQSS5yb290LmFkZFJlc291cmNlKFwiY3JlYXRlR2FtZVwiKS5hZGRNZXRob2QoXCJQT1NUXCIsIGFwaUludGVncmF0aW9uLCB7XG4gICAgICBhdXRob3JpemF0aW9uVHlwZTogYXBpZ2F0ZXdheS5BdXRob3JpemF0aW9uVHlwZS5DT0dOSVRPLFxuICAgICAgYXV0aG9yaXplcjoge1xuICAgICAgICBhdXRob3JpemVySWQ6IGF1dGhvcml6ZXIucmVmXG4gICAgICB9LFxuICAgICAgcmVxdWVzdFZhbGlkYXRvcjogbmV3IGFwaWdhdGV3YXkuUmVxdWVzdFZhbGlkYXRvcih0aGlzLCBcImNyZWF0ZS1yZXF1ZXN0LXZhbGlkYXRvclwiLCB7XG4gICAgICAgIHJlc3RBcGk6IHJlc3RBUEksXG4gICAgICAgIHZhbGlkYXRlUmVxdWVzdEJvZHk6IHRydWVcbiAgICAgIH0pLFxuICAgICAgcmVxdWVzdE1vZGVsczogeyAnYXBwbGljYXRpb24vanNvbic6IGFkZEdhbWVNb2RlbCB9LFxuICAgIH0pO1xuXG4gICAgcmVzdEFQSS5yb290LmFkZFJlc291cmNlKFwibW9kaWZ5R2FtZVwiKS5hZGRNZXRob2QoXCJQVVRcIiwgYXBpSW50ZWdyYXRpb24sIHtcbiAgICAgIGF1dGhvcml6YXRpb25UeXBlOiBhcGlnYXRld2F5LkF1dGhvcml6YXRpb25UeXBlLkNPR05JVE8sXG4gICAgICBhdXRob3JpemVyOiB7XG4gICAgICAgIGF1dGhvcml6ZXJJZDogYXV0aG9yaXplci5yZWZcbiAgICAgIH0sXG4gICAgICByZXF1ZXN0TW9kZWxzOiB7ICdhcHBsaWNhdGlvbi9qc29uJzogbW9kaWZ5R2FtZU1vZGVsIH0sXG4gICAgICByZXF1ZXN0VmFsaWRhdG9yOiBuZXcgYXBpZ2F0ZXdheS5SZXF1ZXN0VmFsaWRhdG9yKHJlc3RBUEksICdtb2RpZnktcmVxdWVzdC12YWxpZGF0b3InLCB7XG4gICAgICAgIHJlc3RBcGk6IHJlc3RBUEksXG4gICAgICAgIHZhbGlkYXRlUmVxdWVzdEJvZHk6IHRydWUsXG4gICAgICAgIHZhbGlkYXRlUmVxdWVzdFBhcmFtZXRlcnM6IGZhbHNlLFxuICAgICAgfSlcbiAgICB9KTtcblxuICAgIHJlc3RBUEkucm9vdC5hZGRSZXNvdXJjZShcImRlbGV0ZUdhbWVcIikuYWRkTWV0aG9kKFwiREVMRVRFXCIsIGFwaUludGVncmF0aW9uLCB7XG4gICAgICBhdXRob3JpemF0aW9uVHlwZTogYXBpZ2F0ZXdheS5BdXRob3JpemF0aW9uVHlwZS5DT0dOSVRPLFxuICAgICAgYXV0aG9yaXplcjoge1xuICAgICAgICBhdXRob3JpemVySWQ6IGF1dGhvcml6ZXIucmVmXG4gICAgICB9LFxuICAgICAgcmVxdWVzdE1vZGVsczogeyAnYXBwbGljYXRpb24vanNvbic6IG1vZGlmeUdhbWVNb2RlbCB9LFxuICAgICAgcmVxdWVzdFZhbGlkYXRvcjogbmV3IGFwaWdhdGV3YXkuUmVxdWVzdFZhbGlkYXRvcihyZXN0QVBJLCAnZGVsZXRlLXJlcXVlc3QtdmFsaWRhdG9yJywge1xuICAgICAgICByZXN0QXBpOiByZXN0QVBJLFxuICAgICAgICB2YWxpZGF0ZVJlcXVlc3RCb2R5OiB0cnVlLFxuICAgICAgICB2YWxpZGF0ZVJlcXVlc3RQYXJhbWV0ZXJzOiBmYWxzZSxcbiAgICAgIH0pXG4gICAgfSk7XG5cbiAgICBsZXQgd2lzaGxpc3RBUEkgPSByZXN0QVBJLnJvb3QuYWRkUmVzb3VyY2UoXCJjb2xsZWN0aW9uXCIpLmFkZFJlc291cmNlKFwid2lzaGxpc3RcIik7XG5cbiAgICB3aXNobGlzdEFQSS5hZGRSZXNvdXJjZShcImNyZWF0ZVdpc2hsaXN0XCIpLmFkZE1ldGhvZChcIlBPU1RcIiwgYXBpSW50ZWdyYXRpb24sIHtcbiAgICAgIGF1dGhvcml6YXRpb25UeXBlOiBhcGlnYXRld2F5LkF1dGhvcml6YXRpb25UeXBlLkNPR05JVE8sXG4gICAgICBhdXRob3JpemVyOiB7XG4gICAgICAgIGF1dGhvcml6ZXJJZDogYXV0aG9yaXplci5yZWZcbiAgICAgIH0sXG4gICAgICByZXF1ZXN0VmFsaWRhdG9yOiBuZXcgYXBpZ2F0ZXdheS5SZXF1ZXN0VmFsaWRhdG9yKHJlc3RBUEksIFwiY3JlYXRlLXdpc2hsaXN0LXJlcXVlc3QtdmFsaWRhdG9yXCIsIHtcbiAgICAgICAgcmVzdEFwaTogcmVzdEFQSSxcbiAgICAgICAgdmFsaWRhdGVSZXF1ZXN0Qm9keTogZmFsc2UsXG4gICAgICAgIHZhbGlkYXRlUmVxdWVzdFBhcmFtZXRlcnM6IGZhbHNlLFxuICAgICAgfSlcbiAgICB9KTtcblxuICAgIHdpc2hsaXN0QVBJLmFkZE1ldGhvZChcIkdFVFwiLCBhcGlJbnRlZ3JhdGlvbiwge1xuICAgICAgYXV0aG9yaXphdGlvblR5cGU6IGFwaWdhdGV3YXkuQXV0aG9yaXphdGlvblR5cGUuQ09HTklUTyxcbiAgICAgIGF1dGhvcml6ZXI6IHtcbiAgICAgICAgYXV0aG9yaXplcklkOiBhdXRob3JpemVyLnJlZlxuICAgICAgfSxcbiAgICAgIHJlcXVlc3RQYXJhbWV0ZXJzOiB7XG4gICAgICAgIFwibWV0aG9kLnJlcXVlc3QucXVlcnlzdHJpbmcuY29sbGVjdGlvbklEXCI6IHRydWUsICAgICAgICBcbiAgICAgIH0sXG4gICAgICByZXF1ZXN0VmFsaWRhdG9yOiBuZXcgYXBpZ2F0ZXdheS5SZXF1ZXN0VmFsaWRhdG9yKHJlc3RBUEksICdnZXQtd2lzaGxpc3QtcmVxdWVzdC12YWxpZGF0b3InLCB7XG4gICAgICAgIHJlc3RBcGk6IHJlc3RBUEksXG4gICAgICAgIHZhbGlkYXRlUmVxdWVzdEJvZHk6IGZhbHNlLFxuICAgICAgICB2YWxpZGF0ZVJlcXVlc3RQYXJhbWV0ZXJzOiB0cnVlLFxuICAgICAgfSlcbiAgICB9KTtcbiAgICBcbiAgICB3aXNobGlzdEFQSS5hZGRSZXNvdXJjZShcImFkZEdhbWVcIikuYWRkTWV0aG9kKFwiUE9TVFwiLCBhcGlJbnRlZ3JhdGlvbiwge1xuICAgICAgYXV0aG9yaXphdGlvblR5cGU6IGFwaWdhdGV3YXkuQXV0aG9yaXphdGlvblR5cGUuQ09HTklUTyxcbiAgICAgIGF1dGhvcml6ZXI6IHtcbiAgICAgICAgYXV0aG9yaXplcklkOiBhdXRob3JpemVyLnJlZlxuICAgICAgfSxcbiAgICAgIHJlcXVlc3RNb2RlbHM6IHsgJ2FwcGxpY2F0aW9uL2pzb24nOiBhZGRHYW1lVG9XaXNobGlzdE1vZGVsIH0sXG4gICAgICByZXF1ZXN0VmFsaWRhdG9yOiBuZXcgYXBpZ2F0ZXdheS5SZXF1ZXN0VmFsaWRhdG9yKHJlc3RBUEksIFwiYWRkZ2FtZS13aXNobGlzdC1yZXF1ZXN0LXZhbGlkYXRvclwiLCB7XG4gICAgICAgIHJlc3RBcGk6IHJlc3RBUEksXG4gICAgICAgIHZhbGlkYXRlUmVxdWVzdEJvZHk6IHRydWUsXG4gICAgICAgIHZhbGlkYXRlUmVxdWVzdFBhcmFtZXRlcnM6IGZhbHNlLFxuICAgICAgfSlcbiAgICB9KTtcblxuICAgIHdpc2hsaXN0QVBJLmFkZFJlc291cmNlKFwibW9kaWZ5R2FtZVwiKS5hZGRNZXRob2QoXCJQVVRcIiwgYXBpSW50ZWdyYXRpb24sIHtcbiAgICAgIGF1dGhvcml6YXRpb25UeXBlOiBhcGlnYXRld2F5LkF1dGhvcml6YXRpb25UeXBlLkNPR05JVE8sXG4gICAgICBhdXRob3JpemVyOiB7XG4gICAgICAgIGF1dGhvcml6ZXJJZDogYXV0aG9yaXplci5yZWZcbiAgICAgIH0sXG4gICAgICByZXF1ZXN0TW9kZWxzOiB7ICdhcHBsaWNhdGlvbi9qc29uJzogbW9kaWZ5R2FtZUluV2lzaGxpc3RNb2RlbCB9LFxuICAgICAgcmVxdWVzdFZhbGlkYXRvcjogbmV3IGFwaWdhdGV3YXkuUmVxdWVzdFZhbGlkYXRvcihyZXN0QVBJLCBcIm1vZGlmeWdhbWUtd2lzaGxpc3QtcmVxdWVzdC12YWxpZGF0b3JcIiwge1xuICAgICAgICByZXN0QXBpOiByZXN0QVBJLFxuICAgICAgICB2YWxpZGF0ZVJlcXVlc3RCb2R5OiB0cnVlLFxuICAgICAgICB2YWxpZGF0ZVJlcXVlc3RQYXJhbWV0ZXJzOiBmYWxzZSxcbiAgICAgIH0pXG4gICAgfSk7XG5cbiAgICB3aXNobGlzdEFQSS5hZGRSZXNvdXJjZShcInJlbW92ZUdhbWVcIikuYWRkTWV0aG9kKFwiREVMRVRFXCIsIGFwaUludGVncmF0aW9uLCB7XG4gICAgICBhdXRob3JpemF0aW9uVHlwZTogYXBpZ2F0ZXdheS5BdXRob3JpemF0aW9uVHlwZS5DT0dOSVRPLFxuICAgICAgYXV0aG9yaXplcjoge1xuICAgICAgICBhdXRob3JpemVySWQ6IGF1dGhvcml6ZXIucmVmXG4gICAgICB9LFxuICAgICAgcmVxdWVzdE1vZGVsczogeyAnYXBwbGljYXRpb24vanNvbic6IG1vZGlmeUdhbWVJbldpc2hsaXN0TW9kZWwgfSxcbiAgICAgIHJlcXVlc3RWYWxpZGF0b3I6IG5ldyBhcGlnYXRld2F5LlJlcXVlc3RWYWxpZGF0b3IocmVzdEFQSSwgXCJkZWxldGUtZ2FtZS13aXNobGlzdC1yZXF1ZXN0LXZhbGlkYXRvclwiLCB7XG4gICAgICAgIHJlc3RBcGk6IHJlc3RBUEksXG4gICAgICAgIHZhbGlkYXRlUmVxdWVzdEJvZHk6IHRydWUsXG4gICAgICAgIHZhbGlkYXRlUmVxdWVzdFBhcmFtZXRlcnM6IGZhbHNlLFxuICAgICAgfSlcbiAgICB9KTsgIFxuICAgIFxuICAgIHdpc2hsaXN0QVBJLmFkZFJlc291cmNlKFwiYWRkUHJpY2VNb25pdG9yXCIpLmFkZE1ldGhvZChcIlBPU1RcIiwgYXBpSW50ZWdyYXRpb24sIHtcbiAgICAgIGF1dGhvcml6YXRpb25UeXBlOiBhcGlnYXRld2F5LkF1dGhvcml6YXRpb25UeXBlLkNPR05JVE8sXG4gICAgICBhdXRob3JpemVyOiB7XG4gICAgICAgIGF1dGhvcml6ZXJJZDogYXV0aG9yaXplci5yZWZcbiAgICAgIH0sXG4gICAgICByZXF1ZXN0TW9kZWxzOiB7ICdhcHBsaWNhdGlvbi9qc29uJzogYWRkUHJpY2VNb25pdG9yVG9XaXNobGlzdEdhbWUgfSxcbiAgICAgIHJlcXVlc3RWYWxpZGF0b3I6IG5ldyBhcGlnYXRld2F5LlJlcXVlc3RWYWxpZGF0b3IocmVzdEFQSSwgXCJhZGRQcmljZU1vbml0b3Itd2lzaGxpc3QtcmVxdWVzdC12YWxpZGF0b3JcIiwge1xuICAgICAgICByZXN0QXBpOiByZXN0QVBJLFxuICAgICAgICB2YWxpZGF0ZVJlcXVlc3RCb2R5OiB0cnVlLFxuICAgICAgICB2YWxpZGF0ZVJlcXVlc3RQYXJhbWV0ZXJzOiBmYWxzZSxcbiAgICAgIH0pXG4gICAgfSk7XG5cbiAgICB3aXNobGlzdEFQSS5hZGRSZXNvdXJjZShcIm1vZGlmeVByaWNlTW9uaXRvclwiKS5hZGRNZXRob2QoXCJQVVRcIiwgYXBpSW50ZWdyYXRpb24sIHtcbiAgICAgIGF1dGhvcml6YXRpb25UeXBlOiBhcGlnYXRld2F5LkF1dGhvcml6YXRpb25UeXBlLkNPR05JVE8sXG4gICAgICBhdXRob3JpemVyOiB7XG4gICAgICAgIGF1dGhvcml6ZXJJZDogYXV0aG9yaXplci5yZWZcbiAgICAgIH0sXG4gICAgICByZXF1ZXN0TW9kZWxzOiB7ICdhcHBsaWNhdGlvbi9qc29uJzogdXBkYXRlUHJpY2VNb25pdG9yVG9XaXNobGlzdEdhbWUgfSxcbiAgICAgIHJlcXVlc3RWYWxpZGF0b3I6IG5ldyBhcGlnYXRld2F5LlJlcXVlc3RWYWxpZGF0b3IocmVzdEFQSSwgXCJtb2RpZnlQcmljZU1vbml0b3Itd2lzaGxpc3QtcmVxdWVzdC12YWxpZGF0b3JcIiwge1xuICAgICAgICByZXN0QXBpOiByZXN0QVBJLFxuICAgICAgICB2YWxpZGF0ZVJlcXVlc3RCb2R5OiB0cnVlLFxuICAgICAgICB2YWxpZGF0ZVJlcXVlc3RQYXJhbWV0ZXJzOiBmYWxzZSxcbiAgICAgIH0pXG4gICAgfSk7XG5cbiAgICB3aXNobGlzdEFQSS5hZGRSZXNvdXJjZShcImRlbGV0ZVByaWNlTW9uaXRvclwiKS5hZGRNZXRob2QoXCJERUxFVEVcIiwgYXBpSW50ZWdyYXRpb24sIHtcbiAgICAgIGF1dGhvcml6YXRpb25UeXBlOiBhcGlnYXRld2F5LkF1dGhvcml6YXRpb25UeXBlLkNPR05JVE8sXG4gICAgICBhdXRob3JpemVyOiB7XG4gICAgICAgIGF1dGhvcml6ZXJJZDogYXV0aG9yaXplci5yZWZcbiAgICAgIH0sXG4gICAgICByZXF1ZXN0TW9kZWxzOiB7ICdhcHBsaWNhdGlvbi9qc29uJzogdXBkYXRlUHJpY2VNb25pdG9yVG9XaXNobGlzdEdhbWUgfSxcbiAgICAgIHJlcXVlc3RWYWxpZGF0b3I6IG5ldyBhcGlnYXRld2F5LlJlcXVlc3RWYWxpZGF0b3IocmVzdEFQSSwgXCJkZWxldGVQcmljZU1vbml0b3Itd2lzaGxpc3QtcmVxdWVzdC12YWxpZGF0b3JcIiwge1xuICAgICAgICByZXN0QXBpOiByZXN0QVBJLFxuICAgICAgICB2YWxpZGF0ZVJlcXVlc3RCb2R5OiB0cnVlLFxuICAgICAgICB2YWxpZGF0ZVJlcXVlc3RQYXJhbWV0ZXJzOiBmYWxzZSxcbiAgICAgIH0pXG4gICAgfSk7XG4gIH0gXG59XG4iXX0=