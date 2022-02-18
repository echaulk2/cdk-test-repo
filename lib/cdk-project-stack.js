"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CdkProjectStack = void 0;
const cdk = require("@aws-cdk/core");
const apigateway = require("@aws-cdk/aws-apigateway");
const lambda = require("@aws-cdk/aws-lambda");
const dynamodb = require("@aws-cdk/aws-dynamodb");
const cognito = require("@aws-cdk/aws-cognito");
const secretsmanager = require("@aws-cdk/aws-secretsmanager");
const sns = require("@aws-cdk/aws-sns");
const subscriptions = require("@aws-cdk/aws-sns-subscriptions");
const events = require("@aws-cdk/aws-events");
const targets = require("@aws-cdk/aws-events-targets");
const ssm = require("@aws-cdk/aws-ssm");
class CdkProjectStack extends cdk.Stack {
    constructor(scope, id, props) {
        super(scope, id, props);
        //DynamoDB Table Definition
        const gameTable = new dynamodb.Table(this, 'aws-cdk-dynamodb-gameTable', {
            partitionKey: { name: 'partitionKey', type: dynamodb.AttributeType.STRING },
            sortKey: { name: 'sortKey', type: dynamodb.AttributeType.STRING }
        });
        const allowedRequestParameters = ['yearReleased', 'genre', 'developer', 'console'];
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
exports.CdkProjectStack = CdkProjectStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2RrLXByb2plY3Qtc3RhY2suanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJjZGstcHJvamVjdC1zdGFjay50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSxxQ0FBcUM7QUFDckMsc0RBQXNEO0FBQ3RELDhDQUE4QztBQUM5QyxrREFBa0Q7QUFDbEQsZ0RBQWdEO0FBQ2hELDhEQUE4RDtBQUM5RCx3Q0FBd0M7QUFDeEMsZ0VBQWdFO0FBQ2hFLDhDQUE4QztBQUM5Qyx1REFBdUQ7QUFDdkQsd0NBQXdDO0FBRXhDLE1BQWEsZUFBZ0IsU0FBUSxHQUFHLENBQUMsS0FBSztJQUM1QyxZQUFZLEtBQW9CLEVBQUUsRUFBVSxFQUFFLEtBQXNCO1FBQ2xFLEtBQUssQ0FBQyxLQUFLLEVBQUUsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBRXhCLDJCQUEyQjtRQUMzQixNQUFNLFNBQVMsR0FBRyxJQUFJLFFBQVEsQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLDRCQUE0QixFQUFFO1lBQ3ZFLFlBQVksRUFBRSxFQUFFLElBQUksRUFBRSxjQUFjLEVBQUUsSUFBSSxFQUFFLFFBQVEsQ0FBQyxhQUFhLENBQUMsTUFBTSxFQUFFO1lBQzNFLE9BQU8sRUFBRSxFQUFFLElBQUksRUFBRSxTQUFTLEVBQUUsSUFBSSxFQUFFLFFBQVEsQ0FBQyxhQUFhLENBQUMsTUFBTSxFQUFFO1NBQ2xFLENBQUMsQ0FBQztRQUVILE1BQU0sd0JBQXdCLEdBQUcsQ0FBRSxjQUFjLEVBQUUsT0FBTyxFQUFFLFdBQVcsRUFBRSxTQUFTLENBQUUsQ0FBQztRQUVyRixNQUFNLEtBQUssR0FBRyxJQUFJLEdBQUcsQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLFdBQVcsRUFBRTtZQUM3QyxXQUFXLEVBQUUsY0FBYztTQUM1QixDQUFDLENBQUM7UUFDSCxLQUFLLENBQUMsZUFBZSxDQUFDLElBQUksYUFBYSxDQUFDLGlCQUFpQixDQUFDLHNCQUFzQixDQUFDLENBQUMsQ0FBQztRQUVu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LENBQUM7UUFFSCxVQUFVO1FBQ1YsTUFBTSxTQUFTLEdBQUcsSUFBSSxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxjQUFjLEVBQUU7WUFDdEQsUUFBUSxFQUFFLE1BQU0sQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxDQUFDO1NBQ3ZELENBQUMsQ0FBQztRQUVILFNBQVMsQ0FBQyxTQUFTLENBQUMsSUFBSSxPQUFPLENBQUMsVUFBVSxDQUFDLE9BQU8sRUFBRTtZQUNsRCxJQUFJLEVBQUUsb0RBQW9EO1lBQzFELE1BQU0sRUFBRSxLQUFLO1lBQ2IsS0FBSyxFQUFFLE1BQU07U0FDZCxDQUFDLENBQUMsQ0FBQztJQUNOLENBQUM7Q0FDRjtBQTlSRCwwQ0E4UkMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBjZGsgZnJvbSAnQGF3cy1jZGsvY29yZSc7XHJcbmltcG9ydCAqIGFzIGFwaWdhdGV3YXkgZnJvbSAnQGF3cy1jZGsvYXdzLWFwaWdhdGV3YXknO1xyXG5pbXBvcnQgKiBhcyBsYW1iZGEgZnJvbSAnQGF3cy1jZGsvYXdzLWxhbWJkYSc7XHJcbmltcG9ydCAqIGFzIGR5bmFtb2RiIGZyb20gJ0Bhd3MtY2RrL2F3cy1keW5hbW9kYic7XHJcbmltcG9ydCAqIGFzIGNvZ25pdG8gZnJvbSAnQGF3cy1jZGsvYXdzLWNvZ25pdG8nO1xyXG5pbXBvcnQgKiBhcyBzZWNyZXRzbWFuYWdlciBmcm9tICdAYXdzLWNkay9hd3Mtc2VjcmV0c21hbmFnZXInO1xyXG5pbXBvcnQgKiBhcyBzbnMgZnJvbSAnQGF3cy1jZGsvYXdzLXNucyc7XHJcbmltcG9ydCAqIGFzIHN1YnNjcmlwdGlvbnMgZnJvbSAnQGF3cy1jZGsvYXdzLXNucy1zdWJzY3JpcHRpb25zJztcclxuaW1wb3J0ICogYXMgZXZlbnRzIGZyb20gJ0Bhd3MtY2RrL2F3cy1ldmVudHMnO1xyXG5pbXBvcnQgKiBhcyB0YXJnZXRzIGZyb20gJ0Bhd3MtY2RrL2F3cy1ldmVudHMtdGFyZ2V0cyc7XHJcbmltcG9ydCAqIGFzIHNzbSBmcm9tICdAYXdzLWNkay9hd3Mtc3NtJztcclxuXHJcbmV4cG9ydCBjbGFzcyBDZGtQcm9qZWN0U3RhY2sgZXh0ZW5kcyBjZGsuU3RhY2sge1xyXG4gIGNvbnN0cnVjdG9yKHNjb3BlOiBjZGsuQ29uc3RydWN0LCBpZDogc3RyaW5nLCBwcm9wcz86IGNkay5TdGFja1Byb3BzKSB7XHJcbiAgICBzdXBlcihzY29wZSwgaWQsIHByb3BzKTtcclxuXHJcbiAgICAvL0R5bmFtb0RCIFRhYmxlIERlZmluaXRpb25cclxuICAgIGNvbnN0IGdhbWVUYWJsZSA9IG5ldyBkeW5hbW9kYi5UYWJsZSh0aGlzLCAnYXdzLWNkay1keW5hbW9kYi1nYW1lVGFibGUnLCB7XHJcbiAgICAgIHBhcnRpdGlvbktleTogeyBuYW1lOiAncGFydGl0aW9uS2V5JywgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5TVFJJTkcgfSxcclxuICAgICAgc29ydEtleTogeyBuYW1lOiAnc29ydEtleScsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuU1RSSU5HIH1cclxuICAgIH0pO1xyXG5cclxuICAgIGNvbnN0IGFsbG93ZWRSZXF1ZXN0UGFyYW1ldGVycyA9IFsgJ3llYXJSZWxlYXNlZCcsICdnZW5yZScsICdkZXZlbG9wZXInLCAnY29uc29sZScgXTtcclxuXHJcbiAgICBjb25zdCB0b3BpYyA9IG5ldyBzbnMuVG9waWModGhpcywgJ3Nucy10b3BpYycsIHtcclxuICAgICAgZGlzcGxheU5hbWU6ICdNeSBTTlMgdG9waWMnLFxyXG4gICAgfSk7XHJcbiAgICB0b3BpYy5hZGRTdWJzY3JpcHRpb24obmV3IHN1YnNjcmlwdGlvbnMuRW1haWxTdWJzY3JpcHRpb24oXCJlcmlrY2hhdWxrQGdtYWlsLmNvbVwiKSk7XHJcblxyXG4gICAgY29uc3QgcHJpY2VEYXRhVVJMID0gc3NtLlN0cmluZ1BhcmFtZXRlci5mcm9tU3RyaW5nUGFyYW1ldGVyQXR0cmlidXRlcyh0aGlzLCAnTXlWYWx1ZScsIHtcclxuICAgICAgcGFyYW1ldGVyTmFtZTogJ2Nkay1wcm9qZWN0LXByaWNlRGF0YVVSTCcsXHJcbiAgICAgIC8vICd2ZXJzaW9uJyBjYW4gYmUgc3BlY2lmaWVkIGJ1dCBpcyBvcHRpb25hbC5cclxuICAgIH0pLnN0cmluZ1ZhbHVlO1xyXG5cclxuICAgICAgICAvL0xhbWJkYSBGdW5jdGlvblxyXG4gICAgY29uc3QgbGFtYmRhRnVuY3Rpb24gPSBuZXcgbGFtYmRhLkZ1bmN0aW9uKHRoaXMsICdhd3MtY2RrLWxhbWJkYS1mdW5jdGlvbicsIHtcclxuICAgICAgY29kZTogbGFtYmRhLkNvZGUuZnJvbUFzc2V0KFwiZnVuY3Rpb25zXCIpLFxyXG4gICAgICBoYW5kbGVyOiAnaW5kZXguaGFuZGxlcicsXHJcbiAgICAgIHJ1bnRpbWU6IGxhbWJkYS5SdW50aW1lLk5PREVKU18xNF9YLFxyXG4gICAgICBlbnZpcm9ubWVudDoge1xyXG4gICAgICAgIERZTkFNT19EQl9HQU1FX1RBQkxFOiBnYW1lVGFibGUudGFibGVOYW1lLFxyXG4gICAgICAgIEFMTE9XRURfUkVRVUVTVF9QQVJBTUVURVJTOiBKU09OLnN0cmluZ2lmeShhbGxvd2VkUmVxdWVzdFBhcmFtZXRlcnMpLFxyXG4gICAgICAgIFRPUElDX0FSTjogdG9waWMudG9waWNBcm4sXHJcbiAgICAgICAgUFJJQ0VfREFUQV9VUkw6IHByaWNlRGF0YVVSTFxyXG4gICAgICB9LFxyXG4gICAgICB0aW1lb3V0OiBjZGsuRHVyYXRpb24uc2Vjb25kcygzMClcclxuICAgIH0pO1xyXG4gICAgZ2FtZVRhYmxlLmdyYW50UmVhZFdyaXRlRGF0YShsYW1iZGFGdW5jdGlvbik7IFxyXG5cclxuICAgIC8vQVBJIEdhdGV3YXlcclxuICAgIGNvbnN0IHJlc3RBUEkgPSBuZXcgYXBpZ2F0ZXdheS5MYW1iZGFSZXN0QXBpKHRoaXMsIFwiYXdzLWNkay1yZXN0LWFwaVwiLCB7XHJcbiAgICAgIGhhbmRsZXI6IGxhbWJkYUZ1bmN0aW9uLFxyXG4gICAgICBwcm94eTogZmFsc2UsXHJcbiAgICAgIHJlc3RBcGlOYW1lOiBcIkdhbWUgTWFuYWdlbWVudCBBUElcIlxyXG4gICAgfSk7XHJcbiAgICBjb25zdCBhcGlJbnRlZ3JhdGlvbiA9IG5ldyBhcGlnYXRld2F5LkxhbWJkYUludGVncmF0aW9uKGxhbWJkYUZ1bmN0aW9uKTtcclxuXHJcbiAgICAvL0NvZ25pdG9cclxuICAgIGNvbnN0IHVzZXJQb29sID0gbmV3IGNvZ25pdG8uVXNlclBvb2wodGhpcywgJ3VzZXJQb29sJywge1xyXG4gICAgICBzZWxmU2lnblVwRW5hYmxlZDogdHJ1ZSxcclxuICAgICAgdXNlclZlcmlmaWNhdGlvbjoge1xyXG4gICAgICAgIGVtYWlsU3ViamVjdDogJ1ZlcmlmeSB5b3VyIGVtYWlsIScsXHJcbiAgICAgICAgZW1haWxCb2R5OiAnSGVsbG8sIFRoYW5rcyBmb3Igc2lnbmluZyB1cCEgeyMjVmVyaWZ5IEVtYWlsIyN9JyxcclxuICAgICAgICBlbWFpbFN0eWxlOiBjb2duaXRvLlZlcmlmaWNhdGlvbkVtYWlsU3R5bGUuTElOS1xyXG4gICAgICB9LFxyXG4gICAgICBzaWduSW5BbGlhc2VzOiB7XHJcbiAgICAgICAgdXNlcm5hbWU6IHRydWUsXHJcbiAgICAgICAgZW1haWw6IHRydWVcclxuICAgICAgfSxcclxuICAgICAgc3RhbmRhcmRBdHRyaWJ1dGVzOiB7XHJcbiAgICAgICAgZW1haWw6IHtcclxuICAgICAgICAgIHJlcXVpcmVkOiB0cnVlXHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9KTtcclxuXHJcbiAgICBjb25zdCBvQXV0aFNlY3JldCA9IHNlY3JldHNtYW5hZ2VyLlNlY3JldC5mcm9tU2VjcmV0Q29tcGxldGVBcm4oXHJcbiAgICAgIHRoaXMsXHJcbiAgICAgICdkYi1vYXV0aC1pZCcsXHJcbiAgICAgICdhcm46YXdzOnNlY3JldHNtYW5hZ2VyOnVzLWVhc3QtMToyMjExNzYxNDAzNjU6c2VjcmV0OjIyMDA4NjIxNjAxNS1pMzNzdGJxamJmaDVybG05cWkzdWFpbWI5ZW82Z25ycy5hcHBzLmdvb2dsZXVzZXJjb250ZW50LmNvbS02eGhaSFknXHJcbiAgICApO1xyXG5cclxuICAgIGNvbnN0IHVzZXJQb29sSWRlbnRpdHlQcm92aWRlckdvb2dsZSA9IG5ldyBjb2duaXRvLlVzZXJQb29sSWRlbnRpdHlQcm92aWRlckdvb2dsZSh0aGlzLCAndXNlclBvb2xHb29nbGUnLCB7XHJcbiAgICAgIHVzZXJQb29sOiB1c2VyUG9vbCxcclxuICAgICAgY2xpZW50SWQ6IG9BdXRoU2VjcmV0LnNlY3JldE5hbWUsXHJcbiAgICAgIGNsaWVudFNlY3JldDogb0F1dGhTZWNyZXQuc2VjcmV0VmFsdWUudG9TdHJpbmcoKSxcclxuICAgICAgYXR0cmlidXRlTWFwcGluZzoge1xyXG4gICAgICAgIGVtYWlsOiB7XHJcbiAgICAgICAgICBhdHRyaWJ1dGVOYW1lOiBjb2duaXRvLlByb3ZpZGVyQXR0cmlidXRlLkdPT0dMRV9FTUFJTC5hdHRyaWJ1dGVOYW1lLFxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgY3VzdG9tOiB7XHJcbiAgICAgICAgICBlbWFpbF92ZXJpZmllZDogY29nbml0by5Qcm92aWRlckF0dHJpYnV0ZS5vdGhlcignZW1haWxfdmVyaWZpZWQnKSxcclxuICAgICAgICB9XHJcbiAgICAgIH0sXHJcbiAgICAgIHNjb3BlczogWydwcm9maWxlJywnZW1haWwnLCdvcGVuaWQnXVxyXG4gICAgfSk7XHJcblxyXG4gICAgY29uc3QgdXNlclBvb2xDbGllbnQgPSBuZXcgY29nbml0by5Vc2VyUG9vbENsaWVudCh0aGlzLCAndXNlclBvb2xDbGllbnQnLCB7XHJcbiAgICAgIHVzZXJQb29sOiB1c2VyUG9vbCxcclxuICAgICAgb0F1dGg6IHtcclxuICAgICAgICBjYWxsYmFja1VybHM6IFsnaHR0cHM6Ly9leGFtcGxlLmNvbS9jYWxsYmFjayddLFxyXG4gICAgICAgIGxvZ291dFVybHM6IFsnaHR0cHM6Ly9leGFtcGxlLmNvbS9zaWdub3V0J10sXHJcbiAgICAgICAgZmxvd3M6IHtcclxuICAgICAgICAgIGF1dGhvcml6YXRpb25Db2RlR3JhbnQ6IGZhbHNlLFxyXG4gICAgICAgICAgaW1wbGljaXRDb2RlR3JhbnQ6IHRydWUsXHJcbiAgICAgICAgICBjbGllbnRDcmVkZW50aWFsczogZmFsc2VcclxuICAgICAgICB9LFxyXG4gICAgICAgIHNjb3BlczogW2NvZ25pdG8uT0F1dGhTY29wZS5PUEVOSURdXHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG5cclxuICAgIGNvbnN0IHVzZXJQb29sRG9tYWluID0gbmV3IGNvZ25pdG8uVXNlclBvb2xEb21haW4odGhpcywgJ3VzZXJQb29sRG9tYWluJywge1xyXG4gICAgICB1c2VyUG9vbDogdXNlclBvb2wsXHJcbiAgICAgIGNvZ25pdG9Eb21haW46IHtcclxuICAgICAgICBkb21haW5QcmVmaXg6ICdjZGtnYW1lYXBpZGVtbydcclxuICAgICAgfVxyXG4gICAgfSk7XHJcblxyXG4gICAgY29uc3QgYXV0aG9yaXplciA9IG5ldyBhcGlnYXRld2F5LkNmbkF1dGhvcml6ZXIodGhpcywgJ2NmbkF1dGgnLCB7XHJcbiAgICAgIHJlc3RBcGlJZDogcmVzdEFQSS5yZXN0QXBpSWQsXHJcbiAgICAgIG5hbWU6ICdnYW1lQXV0aG9yaXplcicsXHJcbiAgICAgIHR5cGU6ICdDT0dOSVRPX1VTRVJfUE9PTFMnLFxyXG4gICAgICBpZGVudGl0eVNvdXJjZTogJ21ldGhvZC5yZXF1ZXN0LmhlYWRlci5BdXRob3JpemF0aW9uJyxcclxuICAgICAgcHJvdmlkZXJBcm5zOiBbdXNlclBvb2wudXNlclBvb2xBcm5dXHJcbiAgICB9KVxyXG5cclxuICAgIC8vTWV0aG9kIHNjaGVtYVxyXG4gICAgY29uc3QgcmVxdWVzdE1vZGVsID0gcmVzdEFQSS5hZGRNb2RlbCgnUmVxdWVzdE1vZGVsJywge1xyXG4gICAgICBjb250ZW50VHlwZTogJ2FwcGxpY2F0aW9uL2pzb24nLFxyXG4gICAgICBtb2RlbE5hbWU6ICdQb3N0TW9kZWwnLFxyXG4gICAgICBzY2hlbWE6IHtcclxuICAgICAgc2NoZW1hOiBhcGlnYXRld2F5Lkpzb25TY2hlbWFWZXJzaW9uLkRSQUZUNCxcclxuICAgICAgdGl0bGU6ICdwb3N0TW9kZWwnLFxyXG4gICAgICB0eXBlOiBhcGlnYXRld2F5Lkpzb25TY2hlbWFUeXBlLk9CSkVDVCxcclxuICAgICAgcHJvcGVydGllczoge1xyXG4gICAgICAgICAgZ2FtZU5hbWU6IHsgdHlwZTogYXBpZ2F0ZXdheS5Kc29uU2NoZW1hVHlwZS5TVFJJTkcgfSxcclxuICAgICAgICAgIHllYXJSZWxlYXNlZDogeyB0eXBlOiBhcGlnYXRld2F5Lkpzb25TY2hlbWFUeXBlLklOVEVHRVIgfSxcclxuICAgICAgICAgIGdlbnJlOiB7IHR5cGU6IGFwaWdhdGV3YXkuSnNvblNjaGVtYVR5cGUuU1RSSU5HIH0sXHJcbiAgICAgICAgICBkZXZlbG9wZXI6IHsgdHlwZTogYXBpZ2F0ZXdheS5Kc29uU2NoZW1hVHlwZS5TVFJJTkcgfSxcclxuICAgICAgICAgIGNvbnNvbGU6IHsgdHlwZTogYXBpZ2F0ZXdheS5Kc29uU2NoZW1hVHlwZS5TVFJJTkcgfSwgICAgICAgICAgXHJcbiAgICAgIH0sXHJcbiAgICAgIHJlcXVpcmVkOiBbJ2dhbWVOYW1lJ10sXHJcbiAgICAgIH0sXHJcbiAgICB9KTtcclxuXHJcbiAgICBjb25zdCB3aXNobGlzdFJlcXVlc3RNb2RlbCA9IHJlc3RBUEkuYWRkTW9kZWwoJ1dpc2hsaXN0UmVxdWVzdE1vZGVsJywge1xyXG4gICAgICBjb250ZW50VHlwZTogJ2FwcGxpY2F0aW9uL2pzb24nLFxyXG4gICAgICBtb2RlbE5hbWU6ICdXaXNobGlzdFJlcXVlc3RNb2RlbCcsXHJcbiAgICAgIHNjaGVtYToge1xyXG4gICAgICBzY2hlbWE6IGFwaWdhdGV3YXkuSnNvblNjaGVtYVZlcnNpb24uRFJBRlQ0LFxyXG4gICAgICB0aXRsZTogJ3dpc2hsaXN0TW9kZWwnLFxyXG4gICAgICB0eXBlOiBhcGlnYXRld2F5Lkpzb25TY2hlbWFUeXBlLk9CSkVDVCxcclxuICAgICAgcHJvcGVydGllczoge1xyXG4gICAgICAgICAgZ2FtZU5hbWU6IHsgdHlwZTogYXBpZ2F0ZXdheS5Kc29uU2NoZW1hVHlwZS5TVFJJTkcgfSxcclxuICAgICAgICAgIHllYXJSZWxlYXNlZDogeyB0eXBlOiBhcGlnYXRld2F5Lkpzb25TY2hlbWFUeXBlLklOVEVHRVIgfSxcclxuICAgICAgICAgIGdlbnJlOiB7IHR5cGU6IGFwaWdhdGV3YXkuSnNvblNjaGVtYVR5cGUuU1RSSU5HIH0sXHJcbiAgICAgICAgICBkZXZlbG9wZXI6IHsgdHlwZTogYXBpZ2F0ZXdheS5Kc29uU2NoZW1hVHlwZS5TVFJJTkcgfSxcclxuICAgICAgICAgIGNvbnNvbGU6IHsgdHlwZTogYXBpZ2F0ZXdheS5Kc29uU2NoZW1hVHlwZS5TVFJJTkcgfSxcclxuICAgICAgICAgIGRlc2lyZWRQcmljZTogeyB0eXBlOiBhcGlnYXRld2F5Lkpzb25TY2hlbWFUeXBlLklOVEVHRVIgfSxcclxuICAgICAgICAgIGRlc2lyZWRDb25kaXRpb246IHsgdHlwZTogYXBpZ2F0ZXdheS5Kc29uU2NoZW1hVHlwZS5TVFJJTkcgfSwgICAgICAgICAgICAgICAgICAgXHJcbiAgICAgIH0sXHJcbiAgICAgIHJlcXVpcmVkOiBbJ2dhbWVOYW1lJ10sXHJcbiAgICAgIH0sXHJcbiAgICB9KVxyXG5cclxuICAgIC8vTWV0aG9kIGRlZmluaXRpb25zXHJcbiAgICBjb25zdCBnZXRHYW1lID0gcmVzdEFQSS5yb290LmFkZFJlc291cmNlKFwiZ2V0R2FtZVwiKS5hZGRNZXRob2QoXCJHRVRcIiwgYXBpSW50ZWdyYXRpb24sIHtcclxuICAgICAgYXV0aG9yaXphdGlvblR5cGU6IGFwaWdhdGV3YXkuQXV0aG9yaXphdGlvblR5cGUuQ09HTklUTyxcclxuICAgICAgYXV0aG9yaXplcjoge1xyXG4gICAgICAgIGF1dGhvcml6ZXJJZDogYXV0aG9yaXplci5yZWZcclxuICAgICAgfSxcclxuICAgICAgcmVxdWVzdFBhcmFtZXRlcnM6IHtcclxuICAgICAgICBcIm1ldGhvZC5yZXF1ZXN0LnF1ZXJ5c3RyaW5nLmdhbWVOYW1lXCI6IHRydWVcclxuICAgICAgfSxcclxuICAgICAgcmVxdWVzdFZhbGlkYXRvcjogbmV3IGFwaWdhdGV3YXkuUmVxdWVzdFZhbGlkYXRvcihyZXN0QVBJLCAnZ2V0LXJlcXVlc3QtdmFsaWRhdG9yJywge1xyXG4gICAgICAgIHJlc3RBcGk6IHJlc3RBUEksXHJcbiAgICAgICAgdmFsaWRhdGVSZXF1ZXN0Qm9keTogZmFsc2UsXHJcbiAgICAgICAgdmFsaWRhdGVSZXF1ZXN0UGFyYW1ldGVyczogdHJ1ZSxcclxuICAgICAgfSlcclxuICAgIH0pO1xyXG5cclxuICAgIHJlc3RBUEkucm9vdC5hZGRSZXNvdXJjZShcImxpc3RHYW1lc1wiKS5hZGRNZXRob2QoXCJHRVRcIiwgYXBpSW50ZWdyYXRpb24sIHtcclxuICAgICAgYXV0aG9yaXphdGlvblR5cGU6IGFwaWdhdGV3YXkuQXV0aG9yaXphdGlvblR5cGUuQ09HTklUTyxcclxuICAgICAgYXV0aG9yaXplcjoge1xyXG4gICAgICAgIGF1dGhvcml6ZXJJZDogYXV0aG9yaXplci5yZWZcclxuICAgICAgfVxyXG4gICAgfSk7XHJcbiAgICBcclxuICAgIHJlc3RBUEkucm9vdC5hZGRSZXNvdXJjZShcImNyZWF0ZUdhbWVcIikuYWRkTWV0aG9kKFwiUE9TVFwiLCBhcGlJbnRlZ3JhdGlvbiwge1xyXG4gICAgICBhdXRob3JpemF0aW9uVHlwZTogYXBpZ2F0ZXdheS5BdXRob3JpemF0aW9uVHlwZS5DT0dOSVRPLFxyXG4gICAgICBhdXRob3JpemVyOiB7XHJcbiAgICAgICAgYXV0aG9yaXplcklkOiBhdXRob3JpemVyLnJlZlxyXG4gICAgICB9LFxyXG4gICAgICByZXF1ZXN0TW9kZWxzOiB7ICdhcHBsaWNhdGlvbi9qc29uJzogcmVxdWVzdE1vZGVsIH0sXHJcbiAgICAgIHJlcXVlc3RWYWxpZGF0b3I6IG5ldyBhcGlnYXRld2F5LlJlcXVlc3RWYWxpZGF0b3IocmVzdEFQSSwgXCJjcmVhdGUtcmVxdWVzdC12YWxpZGF0b3JcIiwge1xyXG4gICAgICAgIHJlc3RBcGk6IHJlc3RBUEksXHJcbiAgICAgICAgdmFsaWRhdGVSZXF1ZXN0Qm9keTogdHJ1ZSxcclxuICAgICAgICB2YWxpZGF0ZVJlcXVlc3RQYXJhbWV0ZXJzOiBmYWxzZSxcclxuICAgICAgfSlcclxuICAgIH0pO1xyXG5cclxuICAgIHJlc3RBUEkucm9vdC5hZGRSZXNvdXJjZShcIm1vZGlmeUdhbWVcIikuYWRkTWV0aG9kKFwiUFVUXCIsIGFwaUludGVncmF0aW9uLCB7XHJcbiAgICAgIGF1dGhvcml6YXRpb25UeXBlOiBhcGlnYXRld2F5LkF1dGhvcml6YXRpb25UeXBlLkNPR05JVE8sXHJcbiAgICAgIGF1dGhvcml6ZXI6IHtcclxuICAgICAgICBhdXRob3JpemVySWQ6IGF1dGhvcml6ZXIucmVmXHJcbiAgICAgIH0sXHJcbiAgICAgIHJlcXVlc3RNb2RlbHM6IHsgJ2FwcGxpY2F0aW9uL2pzb24nOiByZXF1ZXN0TW9kZWwgfSxcclxuICAgICAgcmVxdWVzdFZhbGlkYXRvcjogbmV3IGFwaWdhdGV3YXkuUmVxdWVzdFZhbGlkYXRvcihyZXN0QVBJLCAnbW9kaWZ5LXJlcXVlc3QtdmFsaWRhdG9yJywge1xyXG4gICAgICAgIHJlc3RBcGk6IHJlc3RBUEksXHJcbiAgICAgICAgdmFsaWRhdGVSZXF1ZXN0Qm9keTogdHJ1ZSxcclxuICAgICAgICB2YWxpZGF0ZVJlcXVlc3RQYXJhbWV0ZXJzOiBmYWxzZSxcclxuICAgICAgfSlcclxuICAgIH0pO1xyXG5cclxuICAgIHJlc3RBUEkucm9vdC5hZGRSZXNvdXJjZShcImRlbGV0ZUdhbWVcIikuYWRkTWV0aG9kKFwiREVMRVRFXCIsIGFwaUludGVncmF0aW9uLCB7XHJcbiAgICAgIGF1dGhvcml6YXRpb25UeXBlOiBhcGlnYXRld2F5LkF1dGhvcml6YXRpb25UeXBlLkNPR05JVE8sXHJcbiAgICAgIGF1dGhvcml6ZXI6IHtcclxuICAgICAgICBhdXRob3JpemVySWQ6IGF1dGhvcml6ZXIucmVmXHJcbiAgICAgIH0sXHJcbiAgICAgIHJlcXVlc3RNb2RlbHM6IHsgJ2FwcGxpY2F0aW9uL2pzb24nOiByZXF1ZXN0TW9kZWwgfSxcclxuICAgICAgcmVxdWVzdFZhbGlkYXRvcjogbmV3IGFwaWdhdGV3YXkuUmVxdWVzdFZhbGlkYXRvcihyZXN0QVBJLCAnZGVsZXRlLXJlcXVlc3QtdmFsaWRhdG9yJywge1xyXG4gICAgICAgIHJlc3RBcGk6IHJlc3RBUEksXHJcbiAgICAgICAgdmFsaWRhdGVSZXF1ZXN0Qm9keTogdHJ1ZSxcclxuICAgICAgICB2YWxpZGF0ZVJlcXVlc3RQYXJhbWV0ZXJzOiBmYWxzZSxcclxuICAgICAgfSlcclxuICAgIH0pO1xyXG5cclxuICAgIGxldCB3aXNobGlzdEFQSSA9IHJlc3RBUEkucm9vdC5hZGRSZXNvdXJjZShcImNvbGxlY3Rpb25cIikuYWRkUmVzb3VyY2UoXCJ3aXNobGlzdFwiKTtcclxuICAgIHdpc2hsaXN0QVBJLmFkZE1ldGhvZChcIkdFVFwiLCBhcGlJbnRlZ3JhdGlvbiwge1xyXG4gICAgICBhdXRob3JpemF0aW9uVHlwZTogYXBpZ2F0ZXdheS5BdXRob3JpemF0aW9uVHlwZS5DT0dOSVRPLFxyXG4gICAgICBhdXRob3JpemVyOiB7XHJcbiAgICAgICAgYXV0aG9yaXplcklkOiBhdXRob3JpemVyLnJlZlxyXG4gICAgICB9XHJcbiAgICB9KTtcclxuICAgIFxyXG4gICAgXHJcbiAgICB3aXNobGlzdEFQSS5hZGRSZXNvdXJjZShcImFkZEdhbWVcIikuYWRkTWV0aG9kKFwiUE9TVFwiLCBhcGlJbnRlZ3JhdGlvbiwge1xyXG4gICAgICBhdXRob3JpemF0aW9uVHlwZTogYXBpZ2F0ZXdheS5BdXRob3JpemF0aW9uVHlwZS5DT0dOSVRPLFxyXG4gICAgICBhdXRob3JpemVyOiB7XHJcbiAgICAgICAgYXV0aG9yaXplcklkOiBhdXRob3JpemVyLnJlZlxyXG4gICAgICB9LFxyXG4gICAgICByZXF1ZXN0TW9kZWxzOiB7ICdhcHBsaWNhdGlvbi9qc29uJzogd2lzaGxpc3RSZXF1ZXN0TW9kZWwgfSxcclxuICAgICAgcmVxdWVzdFZhbGlkYXRvcjogbmV3IGFwaWdhdGV3YXkuUmVxdWVzdFZhbGlkYXRvcihyZXN0QVBJLCBcImFkZGdhbWUtd2lzaGxpc3QtcmVxdWVzdC12YWxpZGF0b3JcIiwge1xyXG4gICAgICAgIHJlc3RBcGk6IHJlc3RBUEksXHJcbiAgICAgICAgdmFsaWRhdGVSZXF1ZXN0Qm9keTogdHJ1ZSxcclxuICAgICAgICB2YWxpZGF0ZVJlcXVlc3RQYXJhbWV0ZXJzOiBmYWxzZSxcclxuICAgICAgfSlcclxuICAgIH0pO1xyXG5cclxuICAgIHdpc2hsaXN0QVBJLmFkZFJlc291cmNlKFwibW9kaWZ5R2FtZVwiKS5hZGRNZXRob2QoXCJQVVRcIiwgYXBpSW50ZWdyYXRpb24sIHtcclxuICAgICAgYXV0aG9yaXphdGlvblR5cGU6IGFwaWdhdGV3YXkuQXV0aG9yaXphdGlvblR5cGUuQ09HTklUTyxcclxuICAgICAgYXV0aG9yaXplcjoge1xyXG4gICAgICAgIGF1dGhvcml6ZXJJZDogYXV0aG9yaXplci5yZWZcclxuICAgICAgfSxcclxuICAgICAgcmVxdWVzdE1vZGVsczogeyAnYXBwbGljYXRpb24vanNvbic6IHdpc2hsaXN0UmVxdWVzdE1vZGVsIH0sXHJcbiAgICAgIHJlcXVlc3RWYWxpZGF0b3I6IG5ldyBhcGlnYXRld2F5LlJlcXVlc3RWYWxpZGF0b3IocmVzdEFQSSwgXCJtb2RpZnlnYW1lLXdpc2hsaXN0LXJlcXVlc3QtdmFsaWRhdG9yXCIsIHtcclxuICAgICAgICByZXN0QXBpOiByZXN0QVBJLFxyXG4gICAgICAgIHZhbGlkYXRlUmVxdWVzdEJvZHk6IHRydWUsXHJcbiAgICAgICAgdmFsaWRhdGVSZXF1ZXN0UGFyYW1ldGVyczogZmFsc2UsXHJcbiAgICAgIH0pXHJcbiAgICB9KTtcclxuXHJcbiAgICB3aXNobGlzdEFQSS5hZGRSZXNvdXJjZShcInJlbW92ZUdhbWVcIikuYWRkTWV0aG9kKFwiREVMRVRFXCIsIGFwaUludGVncmF0aW9uLCB7XHJcbiAgICAgIGF1dGhvcml6YXRpb25UeXBlOiBhcGlnYXRld2F5LkF1dGhvcml6YXRpb25UeXBlLkNPR05JVE8sXHJcbiAgICAgIGF1dGhvcml6ZXI6IHtcclxuICAgICAgICBhdXRob3JpemVySWQ6IGF1dGhvcml6ZXIucmVmXHJcbiAgICAgIH0sXHJcbiAgICAgIHJlcXVlc3RNb2RlbHM6IHsgJ2FwcGxpY2F0aW9uL2pzb24nOiB3aXNobGlzdFJlcXVlc3RNb2RlbCB9LFxyXG4gICAgICByZXF1ZXN0VmFsaWRhdG9yOiBuZXcgYXBpZ2F0ZXdheS5SZXF1ZXN0VmFsaWRhdG9yKHJlc3RBUEksIFwiZGVsZXRlLWdhbWUtd2lzaGxpc3QtcmVxdWVzdC12YWxpZGF0b3JcIiwge1xyXG4gICAgICAgIHJlc3RBcGk6IHJlc3RBUEksXHJcbiAgICAgICAgdmFsaWRhdGVSZXF1ZXN0Qm9keTogdHJ1ZSxcclxuICAgICAgICB2YWxpZGF0ZVJlcXVlc3RQYXJhbWV0ZXJzOiBmYWxzZSxcclxuICAgICAgfSlcclxuICAgIH0pOyAgICBcclxuXHJcbiAgICB3aXNobGlzdEFQSS5hZGRSZXNvdXJjZShcImN1c3RvbWVyV2lzaGxpc3ROb3RpZmljYXRpb25zXCIpLmFkZE1ldGhvZChcIkdFVFwiLCBhcGlJbnRlZ3JhdGlvbiwge1xyXG4gICAgICBhdXRob3JpemF0aW9uVHlwZTogYXBpZ2F0ZXdheS5BdXRob3JpemF0aW9uVHlwZS5DT0dOSVRPLFxyXG4gICAgICBhdXRob3JpemVyOiB7XHJcbiAgICAgICAgYXV0aG9yaXplcklkOiBhdXRob3JpemVyLnJlZlxyXG4gICAgICB9LFxyXG4gICAgICByZXF1ZXN0VmFsaWRhdG9yOiBuZXcgYXBpZ2F0ZXdheS5SZXF1ZXN0VmFsaWRhdG9yKHJlc3RBUEksIFwibm90aWZpY2F0aW9ucy13aXNobGlzdC1yZXF1ZXN0LXZhbGlkYXRvclwiLCB7XHJcbiAgICAgICAgcmVzdEFwaTogcmVzdEFQSSxcclxuICAgICAgICB2YWxpZGF0ZVJlcXVlc3RCb2R5OiB0cnVlLFxyXG4gICAgICAgIHZhbGlkYXRlUmVxdWVzdFBhcmFtZXRlcnM6IGZhbHNlLFxyXG4gICAgICB9KVxyXG4gICAgfSk7ICAgXHJcbiAgICBcclxuICAgIC8vRXZlbnRCdXNcclxuICAgIGNvbnN0IGV2ZW50UnVsZSA9IG5ldyBldmVudHMuUnVsZSh0aGlzLCAnc2NoZWR1bGVSdWxlJywge1xyXG4gICAgICBzY2hlZHVsZTogZXZlbnRzLlNjaGVkdWxlLnJhdGUoY2RrLkR1cmF0aW9uLmhvdXJzKDI0KSksXHJcbiAgICB9KTtcclxuXHJcbiAgICBldmVudFJ1bGUuYWRkVGFyZ2V0KG5ldyB0YXJnZXRzLkFwaUdhdGV3YXkocmVzdEFQSSwge1xyXG4gICAgICBwYXRoOiAnL2NvbGxlY3Rpb24vd2lzaGxpc3QvY3VzdG9tZXJXaXNobGlzdE5vdGlmaWNhdGlvbnMnLFxyXG4gICAgICBtZXRob2Q6ICdHRVQnLFxyXG4gICAgICBzdGFnZTogJ3Byb2QnXHJcbiAgICB9KSk7XHJcbiAgfSBcclxufVxyXG4iXX0=