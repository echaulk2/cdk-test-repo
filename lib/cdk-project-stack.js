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
        });
        gameTable.addGlobalSecondaryIndex({
            indexName: 'itemTypeIndex',
            partitionKey: { name: 'itemType', type: dynamodb.AttributeType.STRING },
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
    }
}
exports.CdkProjectStack = CdkProjectStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2RrLXByb2plY3Qtc3RhY2suanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJjZGstcHJvamVjdC1zdGFjay50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSxxQ0FBcUM7QUFDckMsc0RBQXNEO0FBQ3RELDhDQUE4QztBQUM5QyxrREFBa0Q7QUFDbEQsZ0RBQWdEO0FBQ2hELDhEQUE4RDtBQUM5RCw4Q0FBOEM7QUFDOUMsdURBQXVEO0FBQ3ZELHdDQUF3QztBQUN4Qyw2RkFBOEYsQ0FBQyxrR0FBa0c7QUFFak0sTUFBYSxlQUFnQixTQUFRLEdBQUcsQ0FBQyxLQUFLO0lBQzVDLFlBQVksS0FBb0IsRUFBRSxFQUFVLEVBQUUsS0FBc0I7UUFDbEUsS0FBSyxDQUFDLEtBQUssRUFBRSxFQUFFLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFFeEIsMkJBQTJCO1FBQzNCLE1BQU0sU0FBUyxHQUFHLElBQUksUUFBUSxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsNEJBQTRCLEVBQUU7WUFDdkUsWUFBWSxFQUFFLEVBQUUsSUFBSSxFQUFFLGNBQWMsRUFBRSxJQUFJLEVBQUUsUUFBUSxDQUFDLGFBQWEsQ0FBQyxNQUFNLEVBQUU7WUFDM0UsT0FBTyxFQUFFLEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBRSxJQUFJLEVBQUUsUUFBUSxDQUFDLGFBQWEsQ0FBQyxNQUFNLEVBQUU7U0FDbEUsQ0FBQyxDQUFDO1FBRUgsU0FBUyxDQUFDLHVCQUF1QixDQUFDO1lBQ2hDLFNBQVMsRUFBRSxlQUFlO1lBQzFCLFlBQVksRUFBRSxFQUFDLElBQUksRUFBRSxVQUFVLEVBQUUsSUFBSSxFQUFFLFFBQVEsQ0FBQyxhQUFhLENBQUMsTUFBTSxFQUFDO1lBQ3JFLFlBQVksRUFBRSxDQUFDO1lBQ2YsYUFBYSxFQUFFLENBQUM7WUFDaEIsY0FBYyxFQUFFLFFBQVEsQ0FBQyxjQUFjLENBQUMsR0FBRztTQUM1QyxDQUFDLENBQUM7UUFFSCxNQUFNLFlBQVksR0FBRyxHQUFHLENBQUMsZUFBZSxDQUFDLDZCQUE2QixDQUFDLElBQUksRUFBRSxjQUFjLEVBQUU7WUFDM0YsYUFBYSxFQUFFLDBCQUEwQjtTQUMxQyxDQUFDLENBQUMsV0FBVyxDQUFDO1FBRWYsTUFBTSxxQkFBcUIsR0FBRyxHQUFHLENBQUMsZUFBZSxDQUFDLDZCQUE2QixDQUFDLElBQUksRUFBRSx1QkFBdUIsRUFBRTtZQUM3RyxhQUFhLEVBQUUsbUNBQW1DO1NBQ25ELENBQUMsQ0FBQyxXQUFXLENBQUM7UUFFWCxpQkFBaUI7UUFDckIsTUFBTSxjQUFjLEdBQUcsSUFBSSxNQUFNLENBQUMsUUFBUSxDQUFDLElBQUksRUFBRSwwQkFBMEIsRUFBRTtZQUMzRSxJQUFJLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsV0FBVyxDQUFDO1lBQ3hDLE9BQU8sRUFBRSxlQUFlO1lBQ3hCLE9BQU8sRUFBRSxNQUFNLENBQUMsT0FBTyxDQUFDLFdBQVc7WUFDbkMsV0FBVyxFQUFFO2dCQUNYLG9CQUFvQixFQUFFLFNBQVMsQ0FBQyxTQUFTO2dCQUN6QyxjQUFjLEVBQUUsWUFBWTthQUM3QjtZQUNELE9BQU8sRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUM7WUFDakMsV0FBVyxFQUFFLCtEQUErRDtTQUM3RSxDQUFDLENBQUM7UUFFSCxNQUFNLG1CQUFtQixHQUFHLElBQUksTUFBTSxDQUFDLFFBQVEsQ0FBQyxJQUFJLEVBQUUsZ0NBQWdDLEVBQUU7WUFDdEYsSUFBSSxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLFdBQVcsQ0FBQztZQUN4QyxPQUFPLEVBQUUsdUJBQXVCO1lBQ2hDLE9BQU8sRUFBRSxNQUFNLENBQUMsT0FBTyxDQUFDLFdBQVc7WUFDbkMsV0FBVyxFQUFFO2dCQUNYLG9CQUFvQixFQUFFLFNBQVMsQ0FBQyxTQUFTO2dCQUN6QyxjQUFjLEVBQUUsWUFBWTtnQkFDNUIsd0JBQXdCLEVBQUUscUJBQXFCO2FBQ2hEO1lBQ0QsT0FBTyxFQUFFLEdBQUcsQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQztZQUNqQyxXQUFXLEVBQUUseURBQXlEO1NBQ3ZFLENBQUMsQ0FBQztRQUVILE1BQU0sZUFBZSxHQUFHLElBQUksR0FBRyxDQUFDLGVBQWUsQ0FBQztZQUM5QyxNQUFNLEVBQUUsR0FBRyxDQUFDLE1BQU0sQ0FBQyxLQUFLO1lBQ3hCLE9BQU8sRUFBRSxDQUFDLGVBQWUsQ0FBQztZQUMxQixTQUFTLEVBQUUsQ0FBQyxHQUFHLENBQUM7U0FDakIsQ0FBQyxDQUFDO1FBRUgsMkRBQTJEO1FBQzNELE1BQU0sU0FBUyxHQUFHLElBQUksTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsY0FBYyxFQUFFO1lBQ3RELFFBQVEsRUFBRSxNQUFNLENBQUMsUUFBUSxDQUFDLFVBQVUsQ0FBQyx5QkFBeUIsQ0FBQztTQUNoRSxDQUFDLENBQUM7UUFDSCxTQUFTLENBQUMsU0FBUyxDQUFDLElBQUksT0FBTyxDQUFDLGNBQWMsQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDLENBQUM7UUFFckUsY0FBYyxDQUFDLGVBQWUsQ0FBQyxlQUFlLENBQUMsQ0FBQztRQUNoRCxtQkFBbUIsQ0FBQyxlQUFlLENBQUMsZUFBZSxDQUFDLENBQUM7UUFDckQsU0FBUyxDQUFDLGtCQUFrQixDQUFDLGNBQWMsQ0FBQyxDQUFDO1FBQzdDLFNBQVMsQ0FBQyxrQkFBa0IsQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDO1FBRWxELGFBQWE7UUFDYixNQUFNLE9BQU8sR0FBRyxJQUFJLFVBQVUsQ0FBQyxhQUFhLENBQUMsSUFBSSxFQUFFLGtCQUFrQixFQUFFO1lBQ3JFLE9BQU8sRUFBRSxjQUFjO1lBQ3ZCLEtBQUssRUFBRSxLQUFLO1lBQ1osV0FBVyxFQUFFLHFCQUFxQjtTQUNuQyxDQUFDLENBQUM7UUFDSCxNQUFNLGNBQWMsR0FBRyxJQUFJLFVBQVUsQ0FBQyxpQkFBaUIsQ0FBQyxjQUFjLENBQUMsQ0FBQztRQUV4RSxTQUFTO1FBQ1QsTUFBTSxRQUFRLEdBQUcsSUFBSSxPQUFPLENBQUMsUUFBUSxDQUFDLElBQUksRUFBRSxVQUFVLEVBQUU7WUFDdEQsaUJBQWlCLEVBQUUsSUFBSTtZQUN2QixnQkFBZ0IsRUFBRTtnQkFDaEIsWUFBWSxFQUFFLG9CQUFvQjtnQkFDbEMsU0FBUyxFQUFFLGtEQUFrRDtnQkFDN0QsVUFBVSxFQUFFLE9BQU8sQ0FBQyxzQkFBc0IsQ0FBQyxJQUFJO2FBQ2hEO1lBQ0QsYUFBYSxFQUFFO2dCQUNiLFFBQVEsRUFBRSxJQUFJO2dCQUNkLEtBQUssRUFBRSxJQUFJO2FBQ1o7WUFDRCxrQkFBa0IsRUFBRTtnQkFDbEIsS0FBSyxFQUFFO29CQUNMLFFBQVEsRUFBRSxJQUFJO2lCQUNmO2FBQ0Y7U0FDRixDQUFDLENBQUM7UUFFSCxNQUFNLFdBQVcsR0FBRyxjQUFjLENBQUMsTUFBTSxDQUFDLHFCQUFxQixDQUM3RCxJQUFJLEVBQ0osYUFBYSxFQUNiLHNJQUFzSSxDQUN2SSxDQUFDO1FBRUYsTUFBTSw4QkFBOEIsR0FBRyxJQUFJLE9BQU8sQ0FBQyw4QkFBOEIsQ0FBQyxJQUFJLEVBQUUsZ0JBQWdCLEVBQUU7WUFDeEcsUUFBUSxFQUFFLFFBQVE7WUFDbEIsUUFBUSxFQUFFLFdBQVcsQ0FBQyxVQUFVO1lBQ2hDLFlBQVksRUFBRSxXQUFXLENBQUMsV0FBVyxDQUFDLFFBQVEsRUFBRTtZQUNoRCxnQkFBZ0IsRUFBRTtnQkFDaEIsS0FBSyxFQUFFO29CQUNMLGFBQWEsRUFBRSxPQUFPLENBQUMsaUJBQWlCLENBQUMsWUFBWSxDQUFDLGFBQWE7aUJBQ3BFO2dCQUNELE1BQU0sRUFBRTtvQkFDTixjQUFjLEVBQUUsT0FBTyxDQUFDLGlCQUFpQixDQUFDLEtBQUssQ0FBQyxnQkFBZ0IsQ0FBQztpQkFDbEU7YUFDRjtZQUNELE1BQU0sRUFBRSxDQUFDLFNBQVMsRUFBQyxPQUFPLEVBQUMsUUFBUSxDQUFDO1NBQ3JDLENBQUMsQ0FBQztRQUVILE1BQU0sY0FBYyxHQUFHLElBQUksT0FBTyxDQUFDLGNBQWMsQ0FBQyxJQUFJLEVBQUUsZ0JBQWdCLEVBQUU7WUFDeEUsUUFBUSxFQUFFLFFBQVE7WUFDbEIsS0FBSyxFQUFFO2dCQUNMLFlBQVksRUFBRSxDQUFDLDhCQUE4QixDQUFDO2dCQUM5QyxVQUFVLEVBQUUsQ0FBQyw2QkFBNkIsQ0FBQztnQkFDM0MsS0FBSyxFQUFFO29CQUNMLHNCQUFzQixFQUFFLEtBQUs7b0JBQzdCLGlCQUFpQixFQUFFLElBQUk7b0JBQ3ZCLGlCQUFpQixFQUFFLEtBQUs7aUJBQ3pCO2dCQUNELE1BQU0sRUFBRSxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUMsTUFBTSxDQUFDO2FBQ3BDO1NBQ0YsQ0FBQyxDQUFDO1FBRUgsTUFBTSxjQUFjLEdBQUcsSUFBSSxPQUFPLENBQUMsY0FBYyxDQUFDLElBQUksRUFBRSxnQkFBZ0IsRUFBRTtZQUN4RSxRQUFRLEVBQUUsUUFBUTtZQUNsQixhQUFhLEVBQUU7Z0JBQ2IsWUFBWSxFQUFFLGdCQUFnQjthQUMvQjtTQUNGLENBQUMsQ0FBQztRQUVILE1BQU0sVUFBVSxHQUFHLElBQUksVUFBVSxDQUFDLGFBQWEsQ0FBQyxJQUFJLEVBQUUsU0FBUyxFQUFFO1lBQy9ELFNBQVMsRUFBRSxPQUFPLENBQUMsU0FBUztZQUM1QixJQUFJLEVBQUUsZ0JBQWdCO1lBQ3RCLElBQUksRUFBRSxvQkFBb0I7WUFDMUIsY0FBYyxFQUFFLHFDQUFxQztZQUNyRCxZQUFZLEVBQUUsQ0FBQyxRQUFRLENBQUMsV0FBVyxDQUFDO1NBQ3JDLENBQUMsQ0FBQTtRQUVGLGVBQWU7UUFDZixNQUFNLFlBQVksR0FBRyxPQUFPLENBQUMsUUFBUSxDQUFDLGNBQWMsRUFBRTtZQUNwRCxXQUFXLEVBQUUsa0JBQWtCO1lBQy9CLFNBQVMsRUFBRSxXQUFXO1lBQ3RCLE1BQU0sRUFBRTtnQkFDUixNQUFNLEVBQUUsVUFBVSxDQUFDLGlCQUFpQixDQUFDLE1BQU07Z0JBQzNDLEtBQUssRUFBRSxXQUFXO2dCQUNsQixJQUFJLEVBQUUsVUFBVSxDQUFDLGNBQWMsQ0FBQyxNQUFNO2dCQUN0QyxVQUFVLEVBQUU7b0JBQ1IsUUFBUSxFQUFFLEVBQUUsSUFBSSxFQUFFLFVBQVUsQ0FBQyxjQUFjLENBQUMsTUFBTSxFQUFFO29CQUNwRCxZQUFZLEVBQUUsRUFBRSxJQUFJLEVBQUUsVUFBVSxDQUFDLGNBQWMsQ0FBQyxPQUFPLEVBQUU7b0JBQ3pELEtBQUssRUFBRSxFQUFFLElBQUksRUFBRSxVQUFVLENBQUMsY0FBYyxDQUFDLE1BQU0sRUFBRTtvQkFDakQsU0FBUyxFQUFFLEVBQUUsSUFBSSxFQUFFLFVBQVUsQ0FBQyxjQUFjLENBQUMsTUFBTSxFQUFFO29CQUNyRCxPQUFPLEVBQUUsRUFBRSxJQUFJLEVBQUUsVUFBVSxDQUFDLGNBQWMsQ0FBQyxNQUFNLEVBQUU7aUJBQ3REO2dCQUNELFFBQVEsRUFBRSxDQUFDLFVBQVUsQ0FBQzthQUNyQjtTQUNGLENBQUMsQ0FBQztRQUVILE1BQU0sb0JBQW9CLEdBQUcsT0FBTyxDQUFDLFFBQVEsQ0FBQyxzQkFBc0IsRUFBRTtZQUNwRSxXQUFXLEVBQUUsa0JBQWtCO1lBQy9CLFNBQVMsRUFBRSxzQkFBc0I7WUFDakMsTUFBTSxFQUFFO2dCQUNSLE1BQU0sRUFBRSxVQUFVLENBQUMsaUJBQWlCLENBQUMsTUFBTTtnQkFDM0MsS0FBSyxFQUFFLGVBQWU7Z0JBQ3RCLElBQUksRUFBRSxVQUFVLENBQUMsY0FBYyxDQUFDLE1BQU07Z0JBQ3RDLFVBQVUsRUFBRTtvQkFDUixRQUFRLEVBQUUsRUFBRSxJQUFJLEVBQUUsVUFBVSxDQUFDLGNBQWMsQ0FBQyxNQUFNLEVBQUU7b0JBQ3BELFlBQVksRUFBRSxFQUFFLElBQUksRUFBRSxVQUFVLENBQUMsY0FBYyxDQUFDLE9BQU8sRUFBRTtvQkFDekQsS0FBSyxFQUFFLEVBQUUsSUFBSSxFQUFFLFVBQVUsQ0FBQyxjQUFjLENBQUMsTUFBTSxFQUFFO29CQUNqRCxTQUFTLEVBQUUsRUFBRSxJQUFJLEVBQUUsVUFBVSxDQUFDLGNBQWMsQ0FBQyxNQUFNLEVBQUU7b0JBQ3JELE9BQU8sRUFBRSxFQUFFLElBQUksRUFBRSxVQUFVLENBQUMsY0FBYyxDQUFDLE1BQU0sRUFBRTtvQkFDbkQsWUFBWSxFQUFFLEVBQUUsSUFBSSxFQUFFLFVBQVUsQ0FBQyxjQUFjLENBQUMsT0FBTyxFQUFFO29CQUN6RCxnQkFBZ0IsRUFBRSxFQUFFLElBQUksRUFBRSxVQUFVLENBQUMsY0FBYyxDQUFDLE1BQU0sRUFBRTtpQkFDL0Q7Z0JBQ0QsUUFBUSxFQUFFLENBQUMsVUFBVSxDQUFDO2FBQ3JCO1NBQ0YsQ0FBQyxDQUFBO1FBRUYsb0JBQW9CO1FBQ3BCLE1BQU0sT0FBTyxHQUFHLE9BQU8sQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLFNBQVMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxLQUFLLEVBQUUsY0FBYyxFQUFFO1lBQ25GLGlCQUFpQixFQUFFLFVBQVUsQ0FBQyxpQkFBaUIsQ0FBQyxPQUFPO1lBQ3ZELFVBQVUsRUFBRTtnQkFDVixZQUFZLEVBQUUsVUFBVSxDQUFDLEdBQUc7YUFDN0I7WUFDRCxpQkFBaUIsRUFBRTtnQkFDakIscUNBQXFDLEVBQUUsSUFBSTthQUM1QztZQUNELGdCQUFnQixFQUFFLElBQUksVUFBVSxDQUFDLGdCQUFnQixDQUFDLE9BQU8sRUFBRSx1QkFBdUIsRUFBRTtnQkFDbEYsT0FBTyxFQUFFLE9BQU87Z0JBQ2hCLG1CQUFtQixFQUFFLEtBQUs7Z0JBQzFCLHlCQUF5QixFQUFFLElBQUk7YUFDaEMsQ0FBQztTQUNILENBQUMsQ0FBQztRQUVILE9BQU8sQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLFdBQVcsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxLQUFLLEVBQUUsY0FBYyxFQUFFO1lBQ3JFLGlCQUFpQixFQUFFLFVBQVUsQ0FBQyxpQkFBaUIsQ0FBQyxPQUFPO1lBQ3ZELFVBQVUsRUFBRTtnQkFDVixZQUFZLEVBQUUsVUFBVSxDQUFDLEdBQUc7YUFDN0I7U0FDRixDQUFDLENBQUM7UUFFSCxPQUFPLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxZQUFZLENBQUMsQ0FBQyxTQUFTLENBQUMsTUFBTSxFQUFFLGNBQWMsRUFBRTtZQUN2RSxpQkFBaUIsRUFBRSxVQUFVLENBQUMsaUJBQWlCLENBQUMsT0FBTztZQUN2RCxVQUFVLEVBQUU7Z0JBQ1YsWUFBWSxFQUFFLFVBQVUsQ0FBQyxHQUFHO2FBQzdCO1lBQ0QsYUFBYSxFQUFFLEVBQUUsa0JBQWtCLEVBQUUsWUFBWSxFQUFFO1lBQ25ELGdCQUFnQixFQUFFLElBQUksVUFBVSxDQUFDLGdCQUFnQixDQUFDLE9BQU8sRUFBRSwwQkFBMEIsRUFBRTtnQkFDckYsT0FBTyxFQUFFLE9BQU87Z0JBQ2hCLG1CQUFtQixFQUFFLElBQUk7Z0JBQ3pCLHlCQUF5QixFQUFFLEtBQUs7YUFDakMsQ0FBQztTQUNILENBQUMsQ0FBQztRQUVILE9BQU8sQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLFlBQVksQ0FBQyxDQUFDLFNBQVMsQ0FBQyxLQUFLLEVBQUUsY0FBYyxFQUFFO1lBQ3RFLGlCQUFpQixFQUFFLFVBQVUsQ0FBQyxpQkFBaUIsQ0FBQyxPQUFPO1lBQ3ZELFVBQVUsRUFBRTtnQkFDVixZQUFZLEVBQUUsVUFBVSxDQUFDLEdBQUc7YUFDN0I7WUFDRCxhQUFhLEVBQUUsRUFBRSxrQkFBa0IsRUFBRSxZQUFZLEVBQUU7WUFDbkQsZ0JBQWdCLEVBQUUsSUFBSSxVQUFVLENBQUMsZ0JBQWdCLENBQUMsT0FBTyxFQUFFLDBCQUEwQixFQUFFO2dCQUNyRixPQUFPLEVBQUUsT0FBTztnQkFDaEIsbUJBQW1CLEVBQUUsSUFBSTtnQkFDekIseUJBQXlCLEVBQUUsS0FBSzthQUNqQyxDQUFDO1NBQ0gsQ0FBQyxDQUFDO1FBRUgsT0FBTyxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsWUFBWSxDQUFDLENBQUMsU0FBUyxDQUFDLFFBQVEsRUFBRSxjQUFjLEVBQUU7WUFDekUsaUJBQWlCLEVBQUUsVUFBVSxDQUFDLGlCQUFpQixDQUFDLE9BQU87WUFDdkQsVUFBVSxFQUFFO2dCQUNWLFlBQVksRUFBRSxVQUFVLENBQUMsR0FBRzthQUM3QjtZQUNELGFBQWEsRUFBRSxFQUFFLGtCQUFrQixFQUFFLFlBQVksRUFBRTtZQUNuRCxnQkFBZ0IsRUFBRSxJQUFJLFVBQVUsQ0FBQyxnQkFBZ0IsQ0FBQyxPQUFPLEVBQUUsMEJBQTBCLEVBQUU7Z0JBQ3JGLE9BQU8sRUFBRSxPQUFPO2dCQUNoQixtQkFBbUIsRUFBRSxJQUFJO2dCQUN6Qix5QkFBeUIsRUFBRSxLQUFLO2FBQ2pDLENBQUM7U0FDSCxDQUFDLENBQUM7UUFFSCxJQUFJLFdBQVcsR0FBRyxPQUFPLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxZQUFZLENBQUMsQ0FBQyxXQUFXLENBQUMsVUFBVSxDQUFDLENBQUM7UUFDakYsV0FBVyxDQUFDLFNBQVMsQ0FBQyxLQUFLLEVBQUUsY0FBYyxFQUFFO1lBQzNDLGlCQUFpQixFQUFFLFVBQVUsQ0FBQyxpQkFBaUIsQ0FBQyxPQUFPO1lBQ3ZELFVBQVUsRUFBRTtnQkFDVixZQUFZLEVBQUUsVUFBVSxDQUFDLEdBQUc7YUFDN0I7U0FDRixDQUFDLENBQUM7UUFHSCxXQUFXLENBQUMsV0FBVyxDQUFDLFNBQVMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxNQUFNLEVBQUUsY0FBYyxFQUFFO1lBQ25FLGlCQUFpQixFQUFFLFVBQVUsQ0FBQyxpQkFBaUIsQ0FBQyxPQUFPO1lBQ3ZELFVBQVUsRUFBRTtnQkFDVixZQUFZLEVBQUUsVUFBVSxDQUFDLEdBQUc7YUFDN0I7WUFDRCxhQUFhLEVBQUUsRUFBRSxrQkFBa0IsRUFBRSxvQkFBb0IsRUFBRTtZQUMzRCxnQkFBZ0IsRUFBRSxJQUFJLFVBQVUsQ0FBQyxnQkFBZ0IsQ0FBQyxPQUFPLEVBQUUsb0NBQW9DLEVBQUU7Z0JBQy9GLE9BQU8sRUFBRSxPQUFPO2dCQUNoQixtQkFBbUIsRUFBRSxJQUFJO2dCQUN6Qix5QkFBeUIsRUFBRSxLQUFLO2FBQ2pDLENBQUM7U0FDSCxDQUFDLENBQUM7UUFFSCxXQUFXLENBQUMsV0FBVyxDQUFDLFlBQVksQ0FBQyxDQUFDLFNBQVMsQ0FBQyxLQUFLLEVBQUUsY0FBYyxFQUFFO1lBQ3JFLGlCQUFpQixFQUFFLFVBQVUsQ0FBQyxpQkFBaUIsQ0FBQyxPQUFPO1lBQ3ZELFVBQVUsRUFBRTtnQkFDVixZQUFZLEVBQUUsVUFBVSxDQUFDLEdBQUc7YUFDN0I7WUFDRCxhQUFhLEVBQUUsRUFBRSxrQkFBa0IsRUFBRSxvQkFBb0IsRUFBRTtZQUMzRCxnQkFBZ0IsRUFBRSxJQUFJLFVBQVUsQ0FBQyxnQkFBZ0IsQ0FBQyxPQUFPLEVBQUUsdUNBQXVDLEVBQUU7Z0JBQ2xHLE9BQU8sRUFBRSxPQUFPO2dCQUNoQixtQkFBbUIsRUFBRSxJQUFJO2dCQUN6Qix5QkFBeUIsRUFBRSxLQUFLO2FBQ2pDLENBQUM7U0FDSCxDQUFDLENBQUM7UUFFSCxXQUFXLENBQUMsV0FBVyxDQUFDLFlBQVksQ0FBQyxDQUFDLFNBQVMsQ0FBQyxRQUFRLEVBQUUsY0FBYyxFQUFFO1lBQ3hFLGlCQUFpQixFQUFFLFVBQVUsQ0FBQyxpQkFBaUIsQ0FBQyxPQUFPO1lBQ3ZELFVBQVUsRUFBRTtnQkFDVixZQUFZLEVBQUUsVUFBVSxDQUFDLEdBQUc7YUFDN0I7WUFDRCxhQUFhLEVBQUUsRUFBRSxrQkFBa0IsRUFBRSxvQkFBb0IsRUFBRTtZQUMzRCxnQkFBZ0IsRUFBRSxJQUFJLFVBQVUsQ0FBQyxnQkFBZ0IsQ0FBQyxPQUFPLEVBQUUsd0NBQXdDLEVBQUU7Z0JBQ25HLE9BQU8sRUFBRSxPQUFPO2dCQUNoQixtQkFBbUIsRUFBRSxJQUFJO2dCQUN6Qix5QkFBeUIsRUFBRSxLQUFLO2FBQ2pDLENBQUM7U0FDSCxDQUFDLENBQUM7SUFHTCxDQUFDO0NBQ0Y7QUF6U0QsMENBeVNDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgY2RrIGZyb20gJ0Bhd3MtY2RrL2NvcmUnO1xyXG5pbXBvcnQgKiBhcyBhcGlnYXRld2F5IGZyb20gJ0Bhd3MtY2RrL2F3cy1hcGlnYXRld2F5JztcclxuaW1wb3J0ICogYXMgbGFtYmRhIGZyb20gJ0Bhd3MtY2RrL2F3cy1sYW1iZGEnO1xyXG5pbXBvcnQgKiBhcyBkeW5hbW9kYiBmcm9tICdAYXdzLWNkay9hd3MtZHluYW1vZGInO1xyXG5pbXBvcnQgKiBhcyBjb2duaXRvIGZyb20gJ0Bhd3MtY2RrL2F3cy1jb2duaXRvJztcclxuaW1wb3J0ICogYXMgc2VjcmV0c21hbmFnZXIgZnJvbSAnQGF3cy1jZGsvYXdzLXNlY3JldHNtYW5hZ2VyJztcclxuaW1wb3J0ICogYXMgZXZlbnRzIGZyb20gJ0Bhd3MtY2RrL2F3cy1ldmVudHMnO1xyXG5pbXBvcnQgKiBhcyB0YXJnZXRzIGZyb20gJ0Bhd3MtY2RrL2F3cy1ldmVudHMtdGFyZ2V0cyc7XHJcbmltcG9ydCAqIGFzIHNzbSBmcm9tICdAYXdzLWNkay9hd3Mtc3NtJztcclxuaW1wb3J0IGlhbSA9IHJlcXVpcmUoXCIuLi9ub2RlX21vZHVsZXMvQGF3cy1jZGsvYXdzLWNsb3Vkd2F0Y2gvbm9kZV9tb2R1bGVzL0Bhd3MtY2RrL2F3cy1pYW1cIik7IC8vVGhlcmUncyBzb21lIGJ1ZyB3aXRoIGltcG9ydGluZyB0aGUgaWFtIG1vZHVsZS4uLiBzZWUgaHR0cHM6Ly9naXRodWIuY29tL2F3cy9hd3MtY2RrL2lzc3Vlcy84NDEwXHJcblxyXG5leHBvcnQgY2xhc3MgQ2RrUHJvamVjdFN0YWNrIGV4dGVuZHMgY2RrLlN0YWNrIHtcclxuICBjb25zdHJ1Y3RvcihzY29wZTogY2RrLkNvbnN0cnVjdCwgaWQ6IHN0cmluZywgcHJvcHM/OiBjZGsuU3RhY2tQcm9wcykge1xyXG4gICAgc3VwZXIoc2NvcGUsIGlkLCBwcm9wcyk7XHJcblxyXG4gICAgLy9EeW5hbW9EQiBUYWJsZSBEZWZpbml0aW9uXHJcbiAgICBjb25zdCBnYW1lVGFibGUgPSBuZXcgZHluYW1vZGIuVGFibGUodGhpcywgJ2F3cy1jZGstZHluYW1vZGItZ2FtZVRhYmxlJywge1xyXG4gICAgICBwYXJ0aXRpb25LZXk6IHsgbmFtZTogJ3BhcnRpdGlvbktleScsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuU1RSSU5HIH0sXHJcbiAgICAgIHNvcnRLZXk6IHsgbmFtZTogJ3NvcnRLZXknLCB0eXBlOiBkeW5hbW9kYi5BdHRyaWJ1dGVUeXBlLlNUUklORyB9LFxyXG4gICAgfSk7XHJcblxyXG4gICAgZ2FtZVRhYmxlLmFkZEdsb2JhbFNlY29uZGFyeUluZGV4KHtcclxuICAgICAgaW5kZXhOYW1lOiAnaXRlbVR5cGVJbmRleCcsXHJcbiAgICAgIHBhcnRpdGlvbktleToge25hbWU6ICdpdGVtVHlwZScsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuU1RSSU5HfSxcclxuICAgICAgcmVhZENhcGFjaXR5OiAxLFxyXG4gICAgICB3cml0ZUNhcGFjaXR5OiAxLFxyXG4gICAgICBwcm9qZWN0aW9uVHlwZTogZHluYW1vZGIuUHJvamVjdGlvblR5cGUuQUxMLFxyXG4gICAgfSk7XHJcblxyXG4gICAgY29uc3QgcHJpY2VEYXRhVVJMID0gc3NtLlN0cmluZ1BhcmFtZXRlci5mcm9tU3RyaW5nUGFyYW1ldGVyQXR0cmlidXRlcyh0aGlzLCAncHJpY2VEYXRhVXJsJywge1xyXG4gICAgICBwYXJhbWV0ZXJOYW1lOiAnY2RrLXByb2plY3QtcHJpY2VEYXRhVVJMJyxcclxuICAgIH0pLnN0cmluZ1ZhbHVlO1xyXG5cclxuICAgIGNvbnN0IHNlc1NvdXJjZUVtYWlsQWRkcmVzcyA9IHNzbS5TdHJpbmdQYXJhbWV0ZXIuZnJvbVN0cmluZ1BhcmFtZXRlckF0dHJpYnV0ZXModGhpcywgJ3Nlc1NvdXJjZUVtYWlsQWRkcmVzcycsIHtcclxuICAgICAgcGFyYW1ldGVyTmFtZTogJ2Nkay1wcm9qZWN0LXNlc1NvdXJjZUVtYWlsQWRkcmVzcydcclxuICAgIH0pLnN0cmluZ1ZhbHVlO1xyXG5cclxuICAgICAgICAvL0xhbWJkYSBGdW5jdGlvblxyXG4gICAgY29uc3QgbGFtYmRhRnVuY3Rpb24gPSBuZXcgbGFtYmRhLkZ1bmN0aW9uKHRoaXMsICdhd3MtY2RrLWdhbWVBUEktZnVuY3Rpb24nLCB7XHJcbiAgICAgIGNvZGU6IGxhbWJkYS5Db2RlLmZyb21Bc3NldChcImZ1bmN0aW9uc1wiKSxcclxuICAgICAgaGFuZGxlcjogJ2luZGV4LmhhbmRsZXInLFxyXG4gICAgICBydW50aW1lOiBsYW1iZGEuUnVudGltZS5OT0RFSlNfMTRfWCxcclxuICAgICAgZW52aXJvbm1lbnQ6IHtcclxuICAgICAgICBEWU5BTU9fREJfR0FNRV9UQUJMRTogZ2FtZVRhYmxlLnRhYmxlTmFtZSxcclxuICAgICAgICBQUklDRV9EQVRBX1VSTDogcHJpY2VEYXRhVVJMXHJcbiAgICAgIH0sXHJcbiAgICAgIHRpbWVvdXQ6IGNkay5EdXJhdGlvbi5zZWNvbmRzKDMwKSxcclxuICAgICAgZGVzY3JpcHRpb246ICdMYW1iZGEgcmVzcG9uc2libGUgZm9yIGhhbmRsaW5nIHRoZSBHYW1lIEFQSSBwdWJsaWMgZW5kcG9pbnRzJ1xyXG4gICAgfSk7XHJcblxyXG4gICAgY29uc3Qgbm90aWZpY2F0aW9uc0xhbWJkYSA9IG5ldyBsYW1iZGEuRnVuY3Rpb24odGhpcywgJ2F3cy1jZGstbm90aWZpY2F0aW9ucy1mdW5jdGlvbicsIHtcclxuICAgICAgY29kZTogbGFtYmRhLkNvZGUuZnJvbUFzc2V0KFwiZnVuY3Rpb25zXCIpLFxyXG4gICAgICBoYW5kbGVyOiAnbm90aWZpY2F0aW9ucy5oYW5kbGVyJyxcclxuICAgICAgcnVudGltZTogbGFtYmRhLlJ1bnRpbWUuTk9ERUpTXzE0X1gsXHJcbiAgICAgIGVudmlyb25tZW50OiB7XHJcbiAgICAgICAgRFlOQU1PX0RCX0dBTUVfVEFCTEU6IGdhbWVUYWJsZS50YWJsZU5hbWUsXHJcbiAgICAgICAgUFJJQ0VfREFUQV9VUkw6IHByaWNlRGF0YVVSTCxcclxuICAgICAgICBTRVNfU09VUkNFX0VNQUlMX0FERFJFU1M6IHNlc1NvdXJjZUVtYWlsQWRkcmVzc1xyXG4gICAgICB9LFxyXG4gICAgICB0aW1lb3V0OiBjZGsuRHVyYXRpb24uc2Vjb25kcygzMCksXHJcbiAgICAgIGRlc2NyaXB0aW9uOiAnTGFtYmRhIHJlc3BvbnNpYmxlIGZvciBzZW5kaW5nIENvbGxlY3Rpb24gbm90aWZpY2F0aW9ucydcclxuICAgIH0pO1xyXG5cclxuICAgIGNvbnN0IHNlc0xhbWJkYVBvbGljeSA9IG5ldyBpYW0uUG9saWN5U3RhdGVtZW50KHtcclxuICAgICAgZWZmZWN0OiBpYW0uRWZmZWN0LkFMTE9XLFxyXG4gICAgICBhY3Rpb25zOiBbXCJzZXM6U2VuZEVtYWlsXCJdLFxyXG4gICAgICByZXNvdXJjZXM6IFtcIipcIl0sXHJcbiAgICB9KTtcclxuXHJcbiAgICAvL1J1bnMgdGhlIFdpc2hsaXN0IE5vdGlmaWNhdGlvbnMgYXQgbWlkbmlnaHQgZXZlcnkgd2Vla2RheVxyXG4gICAgY29uc3QgZXZlbnRSdWxlID0gbmV3IGV2ZW50cy5SdWxlKHRoaXMsICdzY2hlZHVsZVJ1bGUnLCB7XHJcbiAgICAgIHNjaGVkdWxlOiBldmVudHMuU2NoZWR1bGUuZXhwcmVzc2lvbignY3JvbigwIDUgPyAqIE1PTi1GUkkgKiknKVxyXG4gICAgfSk7XHJcbiAgICBldmVudFJ1bGUuYWRkVGFyZ2V0KG5ldyB0YXJnZXRzLkxhbWJkYUZ1bmN0aW9uKG5vdGlmaWNhdGlvbnNMYW1iZGEpKTtcclxuXHJcbiAgICBsYW1iZGFGdW5jdGlvbi5hZGRUb1JvbGVQb2xpY3koc2VzTGFtYmRhUG9saWN5KTtcclxuICAgIG5vdGlmaWNhdGlvbnNMYW1iZGEuYWRkVG9Sb2xlUG9saWN5KHNlc0xhbWJkYVBvbGljeSk7XHJcbiAgICBnYW1lVGFibGUuZ3JhbnRSZWFkV3JpdGVEYXRhKGxhbWJkYUZ1bmN0aW9uKTsgXHJcbiAgICBnYW1lVGFibGUuZ3JhbnRSZWFkV3JpdGVEYXRhKG5vdGlmaWNhdGlvbnNMYW1iZGEpO1xyXG5cclxuICAgIC8vQVBJIEdhdGV3YXlcclxuICAgIGNvbnN0IHJlc3RBUEkgPSBuZXcgYXBpZ2F0ZXdheS5MYW1iZGFSZXN0QXBpKHRoaXMsIFwiYXdzLWNkay1yZXN0LWFwaVwiLCB7XHJcbiAgICAgIGhhbmRsZXI6IGxhbWJkYUZ1bmN0aW9uLFxyXG4gICAgICBwcm94eTogZmFsc2UsXHJcbiAgICAgIHJlc3RBcGlOYW1lOiBcIkdhbWUgTWFuYWdlbWVudCBBUElcIlxyXG4gICAgfSk7XHJcbiAgICBjb25zdCBhcGlJbnRlZ3JhdGlvbiA9IG5ldyBhcGlnYXRld2F5LkxhbWJkYUludGVncmF0aW9uKGxhbWJkYUZ1bmN0aW9uKTtcclxuICAgIFxyXG4gICAgLy9Db2duaXRvXHJcbiAgICBjb25zdCB1c2VyUG9vbCA9IG5ldyBjb2duaXRvLlVzZXJQb29sKHRoaXMsICd1c2VyUG9vbCcsIHtcclxuICAgICAgc2VsZlNpZ25VcEVuYWJsZWQ6IHRydWUsXHJcbiAgICAgIHVzZXJWZXJpZmljYXRpb246IHtcclxuICAgICAgICBlbWFpbFN1YmplY3Q6ICdWZXJpZnkgeW91ciBlbWFpbCEnLFxyXG4gICAgICAgIGVtYWlsQm9keTogJ0hlbGxvLCBUaGFua3MgZm9yIHNpZ25pbmcgdXAhIHsjI1ZlcmlmeSBFbWFpbCMjfScsXHJcbiAgICAgICAgZW1haWxTdHlsZTogY29nbml0by5WZXJpZmljYXRpb25FbWFpbFN0eWxlLkxJTktcclxuICAgICAgfSxcclxuICAgICAgc2lnbkluQWxpYXNlczoge1xyXG4gICAgICAgIHVzZXJuYW1lOiB0cnVlLFxyXG4gICAgICAgIGVtYWlsOiB0cnVlXHJcbiAgICAgIH0sXHJcbiAgICAgIHN0YW5kYXJkQXR0cmlidXRlczoge1xyXG4gICAgICAgIGVtYWlsOiB7XHJcbiAgICAgICAgICByZXF1aXJlZDogdHJ1ZVxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfSk7XHJcblxyXG4gICAgY29uc3Qgb0F1dGhTZWNyZXQgPSBzZWNyZXRzbWFuYWdlci5TZWNyZXQuZnJvbVNlY3JldENvbXBsZXRlQXJuKFxyXG4gICAgICB0aGlzLFxyXG4gICAgICAnZGItb2F1dGgtaWQnLFxyXG4gICAgICAnYXJuOmF3czpzZWNyZXRzbWFuYWdlcjp1cy1lYXN0LTE6MjIxMTc2MTQwMzY1OnNlY3JldDoyMjAwODYyMTYwMTUtaTMzc3RicWpiZmg1cmxtOXFpM3VhaW1iOWVvNmducnMuYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20tNnhoWkhZJ1xyXG4gICAgKTtcclxuXHJcbiAgICBjb25zdCB1c2VyUG9vbElkZW50aXR5UHJvdmlkZXJHb29nbGUgPSBuZXcgY29nbml0by5Vc2VyUG9vbElkZW50aXR5UHJvdmlkZXJHb29nbGUodGhpcywgJ3VzZXJQb29sR29vZ2xlJywge1xyXG4gICAgICB1c2VyUG9vbDogdXNlclBvb2wsXHJcbiAgICAgIGNsaWVudElkOiBvQXV0aFNlY3JldC5zZWNyZXROYW1lLFxyXG4gICAgICBjbGllbnRTZWNyZXQ6IG9BdXRoU2VjcmV0LnNlY3JldFZhbHVlLnRvU3RyaW5nKCksXHJcbiAgICAgIGF0dHJpYnV0ZU1hcHBpbmc6IHtcclxuICAgICAgICBlbWFpbDoge1xyXG4gICAgICAgICAgYXR0cmlidXRlTmFtZTogY29nbml0by5Qcm92aWRlckF0dHJpYnV0ZS5HT09HTEVfRU1BSUwuYXR0cmlidXRlTmFtZSxcclxuICAgICAgICB9LFxyXG4gICAgICAgIGN1c3RvbToge1xyXG4gICAgICAgICAgZW1haWxfdmVyaWZpZWQ6IGNvZ25pdG8uUHJvdmlkZXJBdHRyaWJ1dGUub3RoZXIoJ2VtYWlsX3ZlcmlmaWVkJyksXHJcbiAgICAgICAgfVxyXG4gICAgICB9LFxyXG4gICAgICBzY29wZXM6IFsncHJvZmlsZScsJ2VtYWlsJywnb3BlbmlkJ11cclxuICAgIH0pO1xyXG5cclxuICAgIGNvbnN0IHVzZXJQb29sQ2xpZW50ID0gbmV3IGNvZ25pdG8uVXNlclBvb2xDbGllbnQodGhpcywgJ3VzZXJQb29sQ2xpZW50Jywge1xyXG4gICAgICB1c2VyUG9vbDogdXNlclBvb2wsXHJcbiAgICAgIG9BdXRoOiB7XHJcbiAgICAgICAgY2FsbGJhY2tVcmxzOiBbJ2h0dHBzOi8vZXhhbXBsZS5jb20vY2FsbGJhY2snXSxcclxuICAgICAgICBsb2dvdXRVcmxzOiBbJ2h0dHBzOi8vZXhhbXBsZS5jb20vc2lnbm91dCddLFxyXG4gICAgICAgIGZsb3dzOiB7XHJcbiAgICAgICAgICBhdXRob3JpemF0aW9uQ29kZUdyYW50OiBmYWxzZSxcclxuICAgICAgICAgIGltcGxpY2l0Q29kZUdyYW50OiB0cnVlLFxyXG4gICAgICAgICAgY2xpZW50Q3JlZGVudGlhbHM6IGZhbHNlXHJcbiAgICAgICAgfSxcclxuICAgICAgICBzY29wZXM6IFtjb2duaXRvLk9BdXRoU2NvcGUuT1BFTklEXVxyXG4gICAgICB9XHJcbiAgICB9KTtcclxuXHJcbiAgICBjb25zdCB1c2VyUG9vbERvbWFpbiA9IG5ldyBjb2duaXRvLlVzZXJQb29sRG9tYWluKHRoaXMsICd1c2VyUG9vbERvbWFpbicsIHtcclxuICAgICAgdXNlclBvb2w6IHVzZXJQb29sLFxyXG4gICAgICBjb2duaXRvRG9tYWluOiB7XHJcbiAgICAgICAgZG9tYWluUHJlZml4OiAnY2RrZ2FtZWFwaWRlbW8nXHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG5cclxuICAgIGNvbnN0IGF1dGhvcml6ZXIgPSBuZXcgYXBpZ2F0ZXdheS5DZm5BdXRob3JpemVyKHRoaXMsICdjZm5BdXRoJywge1xyXG4gICAgICByZXN0QXBpSWQ6IHJlc3RBUEkucmVzdEFwaUlkLFxyXG4gICAgICBuYW1lOiAnZ2FtZUF1dGhvcml6ZXInLFxyXG4gICAgICB0eXBlOiAnQ09HTklUT19VU0VSX1BPT0xTJyxcclxuICAgICAgaWRlbnRpdHlTb3VyY2U6ICdtZXRob2QucmVxdWVzdC5oZWFkZXIuQXV0aG9yaXphdGlvbicsXHJcbiAgICAgIHByb3ZpZGVyQXJuczogW3VzZXJQb29sLnVzZXJQb29sQXJuXVxyXG4gICAgfSlcclxuXHJcbiAgICAvL01ldGhvZCBzY2hlbWFcclxuICAgIGNvbnN0IHJlcXVlc3RNb2RlbCA9IHJlc3RBUEkuYWRkTW9kZWwoJ1JlcXVlc3RNb2RlbCcsIHtcclxuICAgICAgY29udGVudFR5cGU6ICdhcHBsaWNhdGlvbi9qc29uJyxcclxuICAgICAgbW9kZWxOYW1lOiAnUG9zdE1vZGVsJyxcclxuICAgICAgc2NoZW1hOiB7XHJcbiAgICAgIHNjaGVtYTogYXBpZ2F0ZXdheS5Kc29uU2NoZW1hVmVyc2lvbi5EUkFGVDQsXHJcbiAgICAgIHRpdGxlOiAncG9zdE1vZGVsJyxcclxuICAgICAgdHlwZTogYXBpZ2F0ZXdheS5Kc29uU2NoZW1hVHlwZS5PQkpFQ1QsXHJcbiAgICAgIHByb3BlcnRpZXM6IHtcclxuICAgICAgICAgIGdhbWVOYW1lOiB7IHR5cGU6IGFwaWdhdGV3YXkuSnNvblNjaGVtYVR5cGUuU1RSSU5HIH0sXHJcbiAgICAgICAgICB5ZWFyUmVsZWFzZWQ6IHsgdHlwZTogYXBpZ2F0ZXdheS5Kc29uU2NoZW1hVHlwZS5JTlRFR0VSIH0sXHJcbiAgICAgICAgICBnZW5yZTogeyB0eXBlOiBhcGlnYXRld2F5Lkpzb25TY2hlbWFUeXBlLlNUUklORyB9LFxyXG4gICAgICAgICAgZGV2ZWxvcGVyOiB7IHR5cGU6IGFwaWdhdGV3YXkuSnNvblNjaGVtYVR5cGUuU1RSSU5HIH0sXHJcbiAgICAgICAgICBjb25zb2xlOiB7IHR5cGU6IGFwaWdhdGV3YXkuSnNvblNjaGVtYVR5cGUuU1RSSU5HIH0sICAgICAgICAgIFxyXG4gICAgICB9LFxyXG4gICAgICByZXF1aXJlZDogWydnYW1lTmFtZSddLFxyXG4gICAgICB9LFxyXG4gICAgfSk7XHJcblxyXG4gICAgY29uc3Qgd2lzaGxpc3RSZXF1ZXN0TW9kZWwgPSByZXN0QVBJLmFkZE1vZGVsKCdXaXNobGlzdFJlcXVlc3RNb2RlbCcsIHtcclxuICAgICAgY29udGVudFR5cGU6ICdhcHBsaWNhdGlvbi9qc29uJyxcclxuICAgICAgbW9kZWxOYW1lOiAnV2lzaGxpc3RSZXF1ZXN0TW9kZWwnLFxyXG4gICAgICBzY2hlbWE6IHtcclxuICAgICAgc2NoZW1hOiBhcGlnYXRld2F5Lkpzb25TY2hlbWFWZXJzaW9uLkRSQUZUNCxcclxuICAgICAgdGl0bGU6ICd3aXNobGlzdE1vZGVsJyxcclxuICAgICAgdHlwZTogYXBpZ2F0ZXdheS5Kc29uU2NoZW1hVHlwZS5PQkpFQ1QsXHJcbiAgICAgIHByb3BlcnRpZXM6IHtcclxuICAgICAgICAgIGdhbWVOYW1lOiB7IHR5cGU6IGFwaWdhdGV3YXkuSnNvblNjaGVtYVR5cGUuU1RSSU5HIH0sXHJcbiAgICAgICAgICB5ZWFyUmVsZWFzZWQ6IHsgdHlwZTogYXBpZ2F0ZXdheS5Kc29uU2NoZW1hVHlwZS5JTlRFR0VSIH0sXHJcbiAgICAgICAgICBnZW5yZTogeyB0eXBlOiBhcGlnYXRld2F5Lkpzb25TY2hlbWFUeXBlLlNUUklORyB9LFxyXG4gICAgICAgICAgZGV2ZWxvcGVyOiB7IHR5cGU6IGFwaWdhdGV3YXkuSnNvblNjaGVtYVR5cGUuU1RSSU5HIH0sXHJcbiAgICAgICAgICBjb25zb2xlOiB7IHR5cGU6IGFwaWdhdGV3YXkuSnNvblNjaGVtYVR5cGUuU1RSSU5HIH0sXHJcbiAgICAgICAgICBkZXNpcmVkUHJpY2U6IHsgdHlwZTogYXBpZ2F0ZXdheS5Kc29uU2NoZW1hVHlwZS5JTlRFR0VSIH0sXHJcbiAgICAgICAgICBkZXNpcmVkQ29uZGl0aW9uOiB7IHR5cGU6IGFwaWdhdGV3YXkuSnNvblNjaGVtYVR5cGUuU1RSSU5HIH0sICAgICAgICAgICAgICAgICAgIFxyXG4gICAgICB9LFxyXG4gICAgICByZXF1aXJlZDogWydnYW1lTmFtZSddLFxyXG4gICAgICB9LFxyXG4gICAgfSlcclxuXHJcbiAgICAvL01ldGhvZCBkZWZpbml0aW9uc1xyXG4gICAgY29uc3QgZ2V0R2FtZSA9IHJlc3RBUEkucm9vdC5hZGRSZXNvdXJjZShcImdldEdhbWVcIikuYWRkTWV0aG9kKFwiR0VUXCIsIGFwaUludGVncmF0aW9uLCB7XHJcbiAgICAgIGF1dGhvcml6YXRpb25UeXBlOiBhcGlnYXRld2F5LkF1dGhvcml6YXRpb25UeXBlLkNPR05JVE8sXHJcbiAgICAgIGF1dGhvcml6ZXI6IHtcclxuICAgICAgICBhdXRob3JpemVySWQ6IGF1dGhvcml6ZXIucmVmXHJcbiAgICAgIH0sXHJcbiAgICAgIHJlcXVlc3RQYXJhbWV0ZXJzOiB7XHJcbiAgICAgICAgXCJtZXRob2QucmVxdWVzdC5xdWVyeXN0cmluZy5nYW1lTmFtZVwiOiB0cnVlXHJcbiAgICAgIH0sXHJcbiAgICAgIHJlcXVlc3RWYWxpZGF0b3I6IG5ldyBhcGlnYXRld2F5LlJlcXVlc3RWYWxpZGF0b3IocmVzdEFQSSwgJ2dldC1yZXF1ZXN0LXZhbGlkYXRvcicsIHtcclxuICAgICAgICByZXN0QXBpOiByZXN0QVBJLFxyXG4gICAgICAgIHZhbGlkYXRlUmVxdWVzdEJvZHk6IGZhbHNlLFxyXG4gICAgICAgIHZhbGlkYXRlUmVxdWVzdFBhcmFtZXRlcnM6IHRydWUsXHJcbiAgICAgIH0pXHJcbiAgICB9KTtcclxuXHJcbiAgICByZXN0QVBJLnJvb3QuYWRkUmVzb3VyY2UoXCJsaXN0R2FtZXNcIikuYWRkTWV0aG9kKFwiR0VUXCIsIGFwaUludGVncmF0aW9uLCB7XHJcbiAgICAgIGF1dGhvcml6YXRpb25UeXBlOiBhcGlnYXRld2F5LkF1dGhvcml6YXRpb25UeXBlLkNPR05JVE8sXHJcbiAgICAgIGF1dGhvcml6ZXI6IHtcclxuICAgICAgICBhdXRob3JpemVySWQ6IGF1dGhvcml6ZXIucmVmXHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG4gICAgXHJcbiAgICByZXN0QVBJLnJvb3QuYWRkUmVzb3VyY2UoXCJjcmVhdGVHYW1lXCIpLmFkZE1ldGhvZChcIlBPU1RcIiwgYXBpSW50ZWdyYXRpb24sIHtcclxuICAgICAgYXV0aG9yaXphdGlvblR5cGU6IGFwaWdhdGV3YXkuQXV0aG9yaXphdGlvblR5cGUuQ09HTklUTyxcclxuICAgICAgYXV0aG9yaXplcjoge1xyXG4gICAgICAgIGF1dGhvcml6ZXJJZDogYXV0aG9yaXplci5yZWZcclxuICAgICAgfSxcclxuICAgICAgcmVxdWVzdE1vZGVsczogeyAnYXBwbGljYXRpb24vanNvbic6IHJlcXVlc3RNb2RlbCB9LFxyXG4gICAgICByZXF1ZXN0VmFsaWRhdG9yOiBuZXcgYXBpZ2F0ZXdheS5SZXF1ZXN0VmFsaWRhdG9yKHJlc3RBUEksIFwiY3JlYXRlLXJlcXVlc3QtdmFsaWRhdG9yXCIsIHtcclxuICAgICAgICByZXN0QXBpOiByZXN0QVBJLFxyXG4gICAgICAgIHZhbGlkYXRlUmVxdWVzdEJvZHk6IHRydWUsXHJcbiAgICAgICAgdmFsaWRhdGVSZXF1ZXN0UGFyYW1ldGVyczogZmFsc2UsXHJcbiAgICAgIH0pXHJcbiAgICB9KTtcclxuXHJcbiAgICByZXN0QVBJLnJvb3QuYWRkUmVzb3VyY2UoXCJtb2RpZnlHYW1lXCIpLmFkZE1ldGhvZChcIlBVVFwiLCBhcGlJbnRlZ3JhdGlvbiwge1xyXG4gICAgICBhdXRob3JpemF0aW9uVHlwZTogYXBpZ2F0ZXdheS5BdXRob3JpemF0aW9uVHlwZS5DT0dOSVRPLFxyXG4gICAgICBhdXRob3JpemVyOiB7XHJcbiAgICAgICAgYXV0aG9yaXplcklkOiBhdXRob3JpemVyLnJlZlxyXG4gICAgICB9LFxyXG4gICAgICByZXF1ZXN0TW9kZWxzOiB7ICdhcHBsaWNhdGlvbi9qc29uJzogcmVxdWVzdE1vZGVsIH0sXHJcbiAgICAgIHJlcXVlc3RWYWxpZGF0b3I6IG5ldyBhcGlnYXRld2F5LlJlcXVlc3RWYWxpZGF0b3IocmVzdEFQSSwgJ21vZGlmeS1yZXF1ZXN0LXZhbGlkYXRvcicsIHtcclxuICAgICAgICByZXN0QXBpOiByZXN0QVBJLFxyXG4gICAgICAgIHZhbGlkYXRlUmVxdWVzdEJvZHk6IHRydWUsXHJcbiAgICAgICAgdmFsaWRhdGVSZXF1ZXN0UGFyYW1ldGVyczogZmFsc2UsXHJcbiAgICAgIH0pXHJcbiAgICB9KTtcclxuXHJcbiAgICByZXN0QVBJLnJvb3QuYWRkUmVzb3VyY2UoXCJkZWxldGVHYW1lXCIpLmFkZE1ldGhvZChcIkRFTEVURVwiLCBhcGlJbnRlZ3JhdGlvbiwge1xyXG4gICAgICBhdXRob3JpemF0aW9uVHlwZTogYXBpZ2F0ZXdheS5BdXRob3JpemF0aW9uVHlwZS5DT0dOSVRPLFxyXG4gICAgICBhdXRob3JpemVyOiB7XHJcbiAgICAgICAgYXV0aG9yaXplcklkOiBhdXRob3JpemVyLnJlZlxyXG4gICAgICB9LFxyXG4gICAgICByZXF1ZXN0TW9kZWxzOiB7ICdhcHBsaWNhdGlvbi9qc29uJzogcmVxdWVzdE1vZGVsIH0sXHJcbiAgICAgIHJlcXVlc3RWYWxpZGF0b3I6IG5ldyBhcGlnYXRld2F5LlJlcXVlc3RWYWxpZGF0b3IocmVzdEFQSSwgJ2RlbGV0ZS1yZXF1ZXN0LXZhbGlkYXRvcicsIHtcclxuICAgICAgICByZXN0QXBpOiByZXN0QVBJLFxyXG4gICAgICAgIHZhbGlkYXRlUmVxdWVzdEJvZHk6IHRydWUsXHJcbiAgICAgICAgdmFsaWRhdGVSZXF1ZXN0UGFyYW1ldGVyczogZmFsc2UsXHJcbiAgICAgIH0pXHJcbiAgICB9KTtcclxuXHJcbiAgICBsZXQgd2lzaGxpc3RBUEkgPSByZXN0QVBJLnJvb3QuYWRkUmVzb3VyY2UoXCJjb2xsZWN0aW9uXCIpLmFkZFJlc291cmNlKFwid2lzaGxpc3RcIik7XHJcbiAgICB3aXNobGlzdEFQSS5hZGRNZXRob2QoXCJHRVRcIiwgYXBpSW50ZWdyYXRpb24sIHtcclxuICAgICAgYXV0aG9yaXphdGlvblR5cGU6IGFwaWdhdGV3YXkuQXV0aG9yaXphdGlvblR5cGUuQ09HTklUTyxcclxuICAgICAgYXV0aG9yaXplcjoge1xyXG4gICAgICAgIGF1dGhvcml6ZXJJZDogYXV0aG9yaXplci5yZWZcclxuICAgICAgfVxyXG4gICAgfSk7XHJcbiAgICBcclxuICAgIFxyXG4gICAgd2lzaGxpc3RBUEkuYWRkUmVzb3VyY2UoXCJhZGRHYW1lXCIpLmFkZE1ldGhvZChcIlBPU1RcIiwgYXBpSW50ZWdyYXRpb24sIHtcclxuICAgICAgYXV0aG9yaXphdGlvblR5cGU6IGFwaWdhdGV3YXkuQXV0aG9yaXphdGlvblR5cGUuQ09HTklUTyxcclxuICAgICAgYXV0aG9yaXplcjoge1xyXG4gICAgICAgIGF1dGhvcml6ZXJJZDogYXV0aG9yaXplci5yZWZcclxuICAgICAgfSxcclxuICAgICAgcmVxdWVzdE1vZGVsczogeyAnYXBwbGljYXRpb24vanNvbic6IHdpc2hsaXN0UmVxdWVzdE1vZGVsIH0sXHJcbiAgICAgIHJlcXVlc3RWYWxpZGF0b3I6IG5ldyBhcGlnYXRld2F5LlJlcXVlc3RWYWxpZGF0b3IocmVzdEFQSSwgXCJhZGRnYW1lLXdpc2hsaXN0LXJlcXVlc3QtdmFsaWRhdG9yXCIsIHtcclxuICAgICAgICByZXN0QXBpOiByZXN0QVBJLFxyXG4gICAgICAgIHZhbGlkYXRlUmVxdWVzdEJvZHk6IHRydWUsXHJcbiAgICAgICAgdmFsaWRhdGVSZXF1ZXN0UGFyYW1ldGVyczogZmFsc2UsXHJcbiAgICAgIH0pXHJcbiAgICB9KTtcclxuXHJcbiAgICB3aXNobGlzdEFQSS5hZGRSZXNvdXJjZShcIm1vZGlmeUdhbWVcIikuYWRkTWV0aG9kKFwiUFVUXCIsIGFwaUludGVncmF0aW9uLCB7XHJcbiAgICAgIGF1dGhvcml6YXRpb25UeXBlOiBhcGlnYXRld2F5LkF1dGhvcml6YXRpb25UeXBlLkNPR05JVE8sXHJcbiAgICAgIGF1dGhvcml6ZXI6IHtcclxuICAgICAgICBhdXRob3JpemVySWQ6IGF1dGhvcml6ZXIucmVmXHJcbiAgICAgIH0sXHJcbiAgICAgIHJlcXVlc3RNb2RlbHM6IHsgJ2FwcGxpY2F0aW9uL2pzb24nOiB3aXNobGlzdFJlcXVlc3RNb2RlbCB9LFxyXG4gICAgICByZXF1ZXN0VmFsaWRhdG9yOiBuZXcgYXBpZ2F0ZXdheS5SZXF1ZXN0VmFsaWRhdG9yKHJlc3RBUEksIFwibW9kaWZ5Z2FtZS13aXNobGlzdC1yZXF1ZXN0LXZhbGlkYXRvclwiLCB7XHJcbiAgICAgICAgcmVzdEFwaTogcmVzdEFQSSxcclxuICAgICAgICB2YWxpZGF0ZVJlcXVlc3RCb2R5OiB0cnVlLFxyXG4gICAgICAgIHZhbGlkYXRlUmVxdWVzdFBhcmFtZXRlcnM6IGZhbHNlLFxyXG4gICAgICB9KVxyXG4gICAgfSk7XHJcblxyXG4gICAgd2lzaGxpc3RBUEkuYWRkUmVzb3VyY2UoXCJyZW1vdmVHYW1lXCIpLmFkZE1ldGhvZChcIkRFTEVURVwiLCBhcGlJbnRlZ3JhdGlvbiwge1xyXG4gICAgICBhdXRob3JpemF0aW9uVHlwZTogYXBpZ2F0ZXdheS5BdXRob3JpemF0aW9uVHlwZS5DT0dOSVRPLFxyXG4gICAgICBhdXRob3JpemVyOiB7XHJcbiAgICAgICAgYXV0aG9yaXplcklkOiBhdXRob3JpemVyLnJlZlxyXG4gICAgICB9LFxyXG4gICAgICByZXF1ZXN0TW9kZWxzOiB7ICdhcHBsaWNhdGlvbi9qc29uJzogd2lzaGxpc3RSZXF1ZXN0TW9kZWwgfSxcclxuICAgICAgcmVxdWVzdFZhbGlkYXRvcjogbmV3IGFwaWdhdGV3YXkuUmVxdWVzdFZhbGlkYXRvcihyZXN0QVBJLCBcImRlbGV0ZS1nYW1lLXdpc2hsaXN0LXJlcXVlc3QtdmFsaWRhdG9yXCIsIHtcclxuICAgICAgICByZXN0QXBpOiByZXN0QVBJLFxyXG4gICAgICAgIHZhbGlkYXRlUmVxdWVzdEJvZHk6IHRydWUsXHJcbiAgICAgICAgdmFsaWRhdGVSZXF1ZXN0UGFyYW1ldGVyczogZmFsc2UsXHJcbiAgICAgIH0pXHJcbiAgICB9KTsgICAgXHJcblxyXG4gICAgXHJcbiAgfSBcclxufVxyXG4iXX0=