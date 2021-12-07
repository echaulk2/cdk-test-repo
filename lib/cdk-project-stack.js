"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CdkProjectStack = void 0;
const cdk = require("@aws-cdk/core");
const apigateway = require("@aws-cdk/aws-apigateway");
const lambda = require("@aws-cdk/aws-lambda");
const dynamodb = require("@aws-cdk/aws-dynamodb");
const cognito = require("@aws-cdk/aws-cognito");
class CdkProjectStack extends cdk.Stack {
    constructor(scope, id, props) {
        super(scope, id, props);
        //DynamoDB Table Definition
        const gameTable = new dynamodb.Table(this, 'aws-cdk-dynamodb-gameTable', {
            partitionKey: { name: 'userID', type: dynamodb.AttributeType.STRING },
            sortKey: { name: 'gameName', type: dynamodb.AttributeType.STRING }
        });
        const allowedRequestParameters = ['yearReleased', 'genre', 'developer', 'console'];
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
exports.CdkProjectStack = CdkProjectStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2RrLXByb2plY3Qtc3RhY2suanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJjZGstcHJvamVjdC1zdGFjay50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSxxQ0FBcUM7QUFDckMsc0RBQXNEO0FBQ3RELDhDQUE4QztBQUM5QyxrREFBa0Q7QUFDbEQsZ0RBQWdEO0FBRWhELE1BQWEsZUFBZ0IsU0FBUSxHQUFHLENBQUMsS0FBSztJQUM1QyxZQUFZLEtBQW9CLEVBQUUsRUFBVSxFQUFFLEtBQXNCO1FBQ2xFLEtBQUssQ0FBQyxLQUFLLEVBQUUsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBRXhCLDJCQUEyQjtRQUMzQixNQUFNLFNBQVMsR0FBRyxJQUFJLFFBQVEsQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLDRCQUE0QixFQUFFO1lBQ3ZFLFlBQVksRUFBRSxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsSUFBSSxFQUFFLFFBQVEsQ0FBQyxhQUFhLENBQUMsTUFBTSxFQUFFO1lBQ3JFLE9BQU8sRUFBRSxFQUFFLElBQUksRUFBRSxVQUFVLEVBQUUsSUFBSSxFQUFFLFFBQVEsQ0FBQyxhQUFhLENBQUMsTUFBTSxFQUFFO1NBQ25FLENBQUMsQ0FBQztRQUVILE1BQU0sd0JBQXdCLEdBQUcsQ0FBRSxjQUFjLEVBQUUsT0FBTyxFQUFFLFdBQVcsRUFBRSxTQUFTLENBQUUsQ0FBQztRQUVyRixpQkFBaUI7UUFDakIsTUFBTSxjQUFjLEdBQUcsSUFBSSxNQUFNLENBQUMsUUFBUSxDQUFDLElBQUksRUFBRSx5QkFBeUIsRUFBRTtZQUMxRSxJQUFJLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsV0FBVyxDQUFDO1lBQ3hDLE9BQU8sRUFBRSxlQUFlO1lBQ3hCLE9BQU8sRUFBRSxNQUFNLENBQUMsT0FBTyxDQUFDLFdBQVc7WUFDbkMsV0FBVyxFQUFFO2dCQUNYLG9CQUFvQixFQUFFLFNBQVMsQ0FBQyxTQUFTO2dCQUN6QywwQkFB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RUFBRTtnQkFDVixZQUFZLEVBQUUsVUFBVSxDQUFDLEdBQUc7YUFDN0I7WUFDRCxhQUFhLEVBQUUsRUFBRSxrQkFBa0IsRUFBRSxZQUFZLEVBQUU7WUFDbkQsZ0JBQWdCLEVBQUUsSUFBSSxVQUFVLENBQUMsZ0JBQWdCLENBQUMsT0FBTyxFQUFFLDBCQUEwQixFQUFFO2dCQUNyRixPQUFPLEVBQUUsT0FBTztnQkFDaEIsbUJBQW1CLEVBQUUsSUFBSTtnQkFDekIseUJBQXlCLEVBQUUsS0FBSzthQUNqQyxDQUFDO1NBQ0gsQ0FBQyxDQUFDO1FBRUgsT0FBTyxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsWUFBWSxDQUFDLENBQUMsU0FBUyxDQUFDLFFBQVEsRUFBRSxjQUFjLEVBQUU7WUFDekUsaUJBQWlCLEVBQUUsVUFBVSxDQUFDLGlCQUFpQixDQUFDLE9BQU87WUFDdkQsVUFBVSxFQUFFO2dCQUNWLFlBQVksRUFBRSxVQUFVLENBQUMsR0FBRzthQUM3QjtZQUNELGFBQWEsRUFBRSxFQUFFLGtCQUFrQixFQUFFLFlBQVksRUFBRTtZQUNuRCxnQkFBZ0IsRUFBRSxJQUFJLFVBQVUsQ0FBQyxnQkFBZ0IsQ0FBQyxPQUFPLEVBQUUsMEJBQTBCLEVBQUU7Z0JBQ3JGLE9BQU8sRUFBRSxPQUFPO2dCQUNoQixtQkFBbUIsRUFBRSxJQUFJO2dCQUN6Qix5QkFBeUIsRUFBRSxLQUFLO2FBQ2pDLENBQUM7U0FDSCxDQUFDLENBQUM7SUFDTCxDQUFDO0NBQ0Y7QUFsTEQsMENBa0xDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgY2RrIGZyb20gJ0Bhd3MtY2RrL2NvcmUnO1xuaW1wb3J0ICogYXMgYXBpZ2F0ZXdheSBmcm9tICdAYXdzLWNkay9hd3MtYXBpZ2F0ZXdheSc7XG5pbXBvcnQgKiBhcyBsYW1iZGEgZnJvbSAnQGF3cy1jZGsvYXdzLWxhbWJkYSc7XG5pbXBvcnQgKiBhcyBkeW5hbW9kYiBmcm9tICdAYXdzLWNkay9hd3MtZHluYW1vZGInO1xuaW1wb3J0ICogYXMgY29nbml0byBmcm9tICdAYXdzLWNkay9hd3MtY29nbml0byc7XG5cbmV4cG9ydCBjbGFzcyBDZGtQcm9qZWN0U3RhY2sgZXh0ZW5kcyBjZGsuU3RhY2sge1xuICBjb25zdHJ1Y3RvcihzY29wZTogY2RrLkNvbnN0cnVjdCwgaWQ6IHN0cmluZywgcHJvcHM/OiBjZGsuU3RhY2tQcm9wcykge1xuICAgIHN1cGVyKHNjb3BlLCBpZCwgcHJvcHMpO1xuXG4gICAgLy9EeW5hbW9EQiBUYWJsZSBEZWZpbml0aW9uXG4gICAgY29uc3QgZ2FtZVRhYmxlID0gbmV3IGR5bmFtb2RiLlRhYmxlKHRoaXMsICdhd3MtY2RrLWR5bmFtb2RiLWdhbWVUYWJsZScsIHtcbiAgICAgIHBhcnRpdGlvbktleTogeyBuYW1lOiAndXNlcklEJywgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5TVFJJTkcgfSxcbiAgICAgIHNvcnRLZXk6IHsgbmFtZTogJ2dhbWVOYW1lJywgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5TVFJJTkcgfVxuICAgIH0pO1xuXG4gICAgY29uc3QgYWxsb3dlZFJlcXVlc3RQYXJhbWV0ZXJzID0gWyAneWVhclJlbGVhc2VkJywgJ2dlbnJlJywgJ2RldmVsb3BlcicsICdjb25zb2xlJyBdO1xuXG4gICAgLy9MYW1iZGEgRnVuY3Rpb25cbiAgICBjb25zdCBsYW1iZGFGdW5jdGlvbiA9IG5ldyBsYW1iZGEuRnVuY3Rpb24odGhpcywgJ2F3cy1jZGstbGFtYmRhLWZ1bmN0aW9uJywge1xuICAgICAgY29kZTogbGFtYmRhLkNvZGUuZnJvbUFzc2V0KFwiZnVuY3Rpb25zXCIpLFxuICAgICAgaGFuZGxlcjogJ2luZGV4LmhhbmRsZXInLFxuICAgICAgcnVudGltZTogbGFtYmRhLlJ1bnRpbWUuTk9ERUpTXzE0X1gsXG4gICAgICBlbnZpcm9ubWVudDoge1xuICAgICAgICBEWU5BTU9fREJfR0FNRV9UQUJMRTogZ2FtZVRhYmxlLnRhYmxlTmFtZSxcbiAgICAgICAgQUxMT1dFRF9SRVFVRVNUX1BBUkFNRVRFUlM6IEpTT04uc3RyaW5naWZ5KGFsbG93ZWRSZXF1ZXN0UGFyYW1ldGVycylcbiAgICAgIH1cbiAgICB9KTtcbiAgICBnYW1lVGFibGUuZ3JhbnRSZWFkV3JpdGVEYXRhKGxhbWJkYUZ1bmN0aW9uKTsgXG5cbiAgICAvL0FQSSBHYXRld2F5XG4gICAgY29uc3QgcmVzdEFQSSA9IG5ldyBhcGlnYXRld2F5LkxhbWJkYVJlc3RBcGkodGhpcywgXCJhd3MtY2RrLXJlc3QtYXBpXCIsIHtcbiAgICAgIGhhbmRsZXI6IGxhbWJkYUZ1bmN0aW9uLFxuICAgICAgcHJveHk6IGZhbHNlLFxuICAgICAgcmVzdEFwaU5hbWU6IFwiR2FtZSBNYW5hZ2VtZW50IEFQSVwiXG4gICAgfSk7XG4gICAgY29uc3QgYXBpSW50ZWdyYXRpb24gPSBuZXcgYXBpZ2F0ZXdheS5MYW1iZGFJbnRlZ3JhdGlvbihsYW1iZGFGdW5jdGlvbik7XG5cbiAgICAvL0NvZ25pdG9cbiAgICBjb25zdCB1c2VyUG9vbCA9IG5ldyBjb2duaXRvLlVzZXJQb29sKHRoaXMsICd1c2VyUG9vbCcsIHtcbiAgICAgIHNlbGZTaWduVXBFbmFibGVkOiB0cnVlLFxuICAgICAgdXNlclZlcmlmaWNhdGlvbjoge1xuICAgICAgICBlbWFpbFN1YmplY3Q6ICdWZXJpZnkgeW91ciBlbWFpbCEnLFxuICAgICAgICBlbWFpbEJvZHk6ICdIZWxsbywgVGhhbmtzIGZvciBzaWduaW5nIHVwISB7IyNWZXJpZnkgRW1haWwjI30nLFxuICAgICAgICBlbWFpbFN0eWxlOiBjb2duaXRvLlZlcmlmaWNhdGlvbkVtYWlsU3R5bGUuTElOS1xuICAgICAgfSxcbiAgICAgIHNpZ25JbkFsaWFzZXM6IHtcbiAgICAgICAgdXNlcm5hbWU6IHRydWUsXG4gICAgICAgIGVtYWlsOiB0cnVlXG4gICAgICB9LFxuICAgICAgc3RhbmRhcmRBdHRyaWJ1dGVzOiB7XG4gICAgICAgIGVtYWlsOiB7XG4gICAgICAgICAgcmVxdWlyZWQ6IHRydWVcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pO1xuXG4gICAgY29uc3QgdXNlclBvb2xJZGVudGl0eVByb3ZpZGVyR29vZ2xlID0gbmV3IGNvZ25pdG8uVXNlclBvb2xJZGVudGl0eVByb3ZpZGVyR29vZ2xlKHRoaXMsICd1c2VyUG9vbEdvb2dsZScsIHtcbiAgICAgIHVzZXJQb29sOiB1c2VyUG9vbCxcbiAgICAgIC8vT0F1dGggMi4wIENsaWVudCBJRC9TZWNyZXQgZ2VuZXJhdGVkIGluIG15IEdDUCBhY2NvdW50XG4gICAgICBjbGllbnRJZDogJzIyMDA4NjIxNjAxNS12cTNhaTZmcjFxdXRic2M0MGFhZms0YjMxbWcxczdnbS5hcHBzLmdvb2dsZXVzZXJjb250ZW50LmNvbScsXG4gICAgICBjbGllbnRTZWNyZXQ6ICdHT0NTUFgta0RDTUFQSmVoZlJJbmM1LS1ad1dnSlNhT1F2RScsXG4gICAgICBhdHRyaWJ1dGVNYXBwaW5nOiB7XG4gICAgICAgIGVtYWlsOiB7XG4gICAgICAgICAgYXR0cmlidXRlTmFtZTogY29nbml0by5Qcm92aWRlckF0dHJpYnV0ZS5HT09HTEVfRU1BSUwuYXR0cmlidXRlTmFtZSxcbiAgICAgICAgfSxcbiAgICAgICAgY3VzdG9tOiB7XG4gICAgICAgICAgZW1haWxfdmVyaWZpZWQ6IGNvZ25pdG8uUHJvdmlkZXJBdHRyaWJ1dGUub3RoZXIoJ2VtYWlsX3ZlcmlmaWVkJyksXG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICBzY29wZXM6IFsncHJvZmlsZScsJ2VtYWlsJywnb3BlbmlkJ11cbiAgICB9KTtcblxuICAgIGNvbnN0IHVzZXJQb29sQ2xpZW50ID0gbmV3IGNvZ25pdG8uVXNlclBvb2xDbGllbnQodGhpcywgJ3VzZXJQb29sQ2xpZW50Jywge1xuICAgICAgdXNlclBvb2w6IHVzZXJQb29sLFxuICAgICAgb0F1dGg6IHtcbiAgICAgICAgY2FsbGJhY2tVcmxzOiBbJ2h0dHBzOi8vZXhhbXBsZS5jb20vY2FsbGJhY2snXSxcbiAgICAgICAgbG9nb3V0VXJsczogWydodHRwczovL2V4YW1wbGUuY29tL3NpZ25vdXQnXSxcbiAgICAgICAgZmxvd3M6IHtcbiAgICAgICAgICBhdXRob3JpemF0aW9uQ29kZUdyYW50OiBmYWxzZSxcbiAgICAgICAgICBpbXBsaWNpdENvZGVHcmFudDogdHJ1ZSxcbiAgICAgICAgICBjbGllbnRDcmVkZW50aWFsczogZmFsc2VcbiAgICAgICAgfSxcbiAgICAgICAgc2NvcGVzOiBbY29nbml0by5PQXV0aFNjb3BlLk9QRU5JRF1cbiAgICAgIH1cbiAgICB9KTtcblxuICAgIGNvbnN0IHVzZXJQb29sRG9tYWluID0gbmV3IGNvZ25pdG8uVXNlclBvb2xEb21haW4odGhpcywgJ3VzZXJQb29sRG9tYWluJywge1xuICAgICAgdXNlclBvb2w6IHVzZXJQb29sLFxuICAgICAgY29nbml0b0RvbWFpbjoge1xuICAgICAgICBkb21haW5QcmVmaXg6ICdjZGtnYW1lYXBpZGVtbydcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIGNvbnN0IGF1dGhvcml6ZXIgPSBuZXcgYXBpZ2F0ZXdheS5DZm5BdXRob3JpemVyKHRoaXMsICdjZm5BdXRoJywge1xuICAgICAgcmVzdEFwaUlkOiByZXN0QVBJLnJlc3RBcGlJZCxcbiAgICAgIG5hbWU6ICdnYW1lQXV0aG9yaXplcicsXG4gICAgICB0eXBlOiAnQ09HTklUT19VU0VSX1BPT0xTJyxcbiAgICAgIGlkZW50aXR5U291cmNlOiAnbWV0aG9kLnJlcXVlc3QuaGVhZGVyLkF1dGhvcml6YXRpb24nLFxuICAgICAgcHJvdmlkZXJBcm5zOiBbdXNlclBvb2wudXNlclBvb2xBcm5dXG4gICAgfSlcblxuICAgIC8vTWV0aG9kIHNjaGVtYVxuICAgIGNvbnN0IHJlcXVlc3RNb2RlbCA9IHJlc3RBUEkuYWRkTW9kZWwoJ1JlcXVlc3RNb2RlbCcsIHtcbiAgICAgIGNvbnRlbnRUeXBlOiAnYXBwbGljYXRpb24vanNvbicsXG4gICAgICBtb2RlbE5hbWU6ICdQb3N0TW9kZWwnLFxuICAgICAgc2NoZW1hOiB7XG4gICAgICBzY2hlbWE6IGFwaWdhdGV3YXkuSnNvblNjaGVtYVZlcnNpb24uRFJBRlQ0LFxuICAgICAgdGl0bGU6ICdwb3N0TW9kZWwnLFxuICAgICAgdHlwZTogYXBpZ2F0ZXdheS5Kc29uU2NoZW1hVHlwZS5PQkpFQ1QsXG4gICAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICAgICAgdXNlcklEOiB7IHR5cGU6IGFwaWdhdGV3YXkuSnNvblNjaGVtYVR5cGUuU1RSSU5HIH0sXG4gICAgICAgICAgZ2FtZU5hbWU6IHsgdHlwZTogYXBpZ2F0ZXdheS5Kc29uU2NoZW1hVHlwZS5TVFJJTkcgfSxcbiAgICAgICAgICB5ZWFyUmVsZWFzZWQ6IHsgdHlwZTogYXBpZ2F0ZXdheS5Kc29uU2NoZW1hVHlwZS5JTlRFR0VSIH0sXG4gICAgICAgICAgZ2VucmU6IHsgdHlwZTogYXBpZ2F0ZXdheS5Kc29uU2NoZW1hVHlwZS5TVFJJTkcgfSxcbiAgICAgICAgICBkZXZlbG9wZXI6IHsgdHlwZTogYXBpZ2F0ZXdheS5Kc29uU2NoZW1hVHlwZS5TVFJJTkcgfSxcbiAgICAgICAgICBjb25zb2xlOiB7IHR5cGU6IGFwaWdhdGV3YXkuSnNvblNjaGVtYVR5cGUuU1RSSU5HIH0sICAgICAgICAgIFxuICAgICAgfSxcbiAgICAgIHJlcXVpcmVkOiBbJ3VzZXJJRCcsICdnYW1lTmFtZSddLFxuICAgICAgfSxcbiAgICB9KTtcblxuICAgIC8vTWV0aG9kIGRlZmluaXRpb25zXG4gICAgY29uc3QgZ2V0R2FtZSA9IHJlc3RBUEkucm9vdC5hZGRSZXNvdXJjZShcImdldEdhbWVcIikuYWRkTWV0aG9kKFwiR0VUXCIsIGFwaUludGVncmF0aW9uLCB7XG4gICAgICBhdXRob3JpemF0aW9uVHlwZTogYXBpZ2F0ZXdheS5BdXRob3JpemF0aW9uVHlwZS5DT0dOSVRPLFxuICAgICAgYXV0aG9yaXplcjoge1xuICAgICAgICBhdXRob3JpemVySWQ6IGF1dGhvcml6ZXIucmVmXG4gICAgICB9LFxuICAgICAgcmVxdWVzdFBhcmFtZXRlcnM6IHtcbiAgICAgICAgXCJtZXRob2QucmVxdWVzdC5xdWVyeXN0cmluZy5nYW1lTmFtZVwiOiB0cnVlXG4gICAgICB9LFxuICAgICAgcmVxdWVzdFZhbGlkYXRvcjogbmV3IGFwaWdhdGV3YXkuUmVxdWVzdFZhbGlkYXRvcihyZXN0QVBJLCAnZ2V0LXJlcXVlc3QtdmFsaWRhdG9yJywge1xuICAgICAgICByZXN0QXBpOiByZXN0QVBJLFxuICAgICAgICB2YWxpZGF0ZVJlcXVlc3RCb2R5OiBmYWxzZSxcbiAgICAgICAgdmFsaWRhdGVSZXF1ZXN0UGFyYW1ldGVyczogdHJ1ZSxcbiAgICAgIH0pXG4gICAgfSk7XG5cbiAgICByZXN0QVBJLnJvb3QuYWRkUmVzb3VyY2UoXCJsaXN0R2FtZXNcIikuYWRkTWV0aG9kKFwiR0VUXCIsIGFwaUludGVncmF0aW9uLCB7XG4gICAgICBhdXRob3JpemF0aW9uVHlwZTogYXBpZ2F0ZXdheS5BdXRob3JpemF0aW9uVHlwZS5DT0dOSVRPLFxuICAgICAgYXV0aG9yaXplcjoge1xuICAgICAgICBhdXRob3JpemVySWQ6IGF1dGhvcml6ZXIucmVmXG4gICAgICB9XG4gICAgfSk7XG4gICAgXG4gICAgcmVzdEFQSS5yb290LmFkZFJlc291cmNlKFwiY3JlYXRlR2FtZVwiKS5hZGRNZXRob2QoXCJQT1NUXCIsIGFwaUludGVncmF0aW9uLCB7XG4gICAgICBhdXRob3JpemF0aW9uVHlwZTogYXBpZ2F0ZXdheS5BdXRob3JpemF0aW9uVHlwZS5DT0dOSVRPLFxuICAgICAgYXV0aG9yaXplcjoge1xuICAgICAgICBhdXRob3JpemVySWQ6IGF1dGhvcml6ZXIucmVmXG4gICAgICB9LFxuICAgICAgcmVxdWVzdE1vZGVsczogeyAnYXBwbGljYXRpb24vanNvbic6IHJlcXVlc3RNb2RlbCB9LFxuICAgICAgcmVxdWVzdFZhbGlkYXRvcjogbmV3IGFwaWdhdGV3YXkuUmVxdWVzdFZhbGlkYXRvcihyZXN0QVBJLCBcImNyZWF0ZS1yZXF1ZXN0LXZhbGlkYXRvclwiLCB7XG4gICAgICAgIHJlc3RBcGk6IHJlc3RBUEksXG4gICAgICAgIHZhbGlkYXRlUmVxdWVzdEJvZHk6IHRydWUsXG4gICAgICAgIHZhbGlkYXRlUmVxdWVzdFBhcmFtZXRlcnM6IGZhbHNlLFxuICAgICAgfSlcbiAgICB9KTtcblxuICAgIHJlc3RBUEkucm9vdC5hZGRSZXNvdXJjZShcIm1vZGlmeUdhbWVcIikuYWRkTWV0aG9kKFwiUFVUXCIsIGFwaUludGVncmF0aW9uLCB7XG4gICAgICBhdXRob3JpemF0aW9uVHlwZTogYXBpZ2F0ZXdheS5BdXRob3JpemF0aW9uVHlwZS5DT0dOSVRPLFxuICAgICAgYXV0aG9yaXplcjoge1xuICAgICAgICBhdXRob3JpemVySWQ6IGF1dGhvcml6ZXIucmVmXG4gICAgICB9LFxuICAgICAgcmVxdWVzdE1vZGVsczogeyAnYXBwbGljYXRpb24vanNvbic6IHJlcXVlc3RNb2RlbCB9LFxuICAgICAgcmVxdWVzdFZhbGlkYXRvcjogbmV3IGFwaWdhdGV3YXkuUmVxdWVzdFZhbGlkYXRvcihyZXN0QVBJLCAnbW9kaWZ5LXJlcXVlc3QtdmFsaWRhdG9yJywge1xuICAgICAgICByZXN0QXBpOiByZXN0QVBJLFxuICAgICAgICB2YWxpZGF0ZVJlcXVlc3RCb2R5OiB0cnVlLFxuICAgICAgICB2YWxpZGF0ZVJlcXVlc3RQYXJhbWV0ZXJzOiBmYWxzZSxcbiAgICAgIH0pXG4gICAgfSk7XG5cbiAgICByZXN0QVBJLnJvb3QuYWRkUmVzb3VyY2UoXCJkZWxldGVHYW1lXCIpLmFkZE1ldGhvZChcIkRFTEVURVwiLCBhcGlJbnRlZ3JhdGlvbiwge1xuICAgICAgYXV0aG9yaXphdGlvblR5cGU6IGFwaWdhdGV3YXkuQXV0aG9yaXphdGlvblR5cGUuQ09HTklUTyxcbiAgICAgIGF1dGhvcml6ZXI6IHtcbiAgICAgICAgYXV0aG9yaXplcklkOiBhdXRob3JpemVyLnJlZlxuICAgICAgfSxcbiAgICAgIHJlcXVlc3RNb2RlbHM6IHsgJ2FwcGxpY2F0aW9uL2pzb24nOiByZXF1ZXN0TW9kZWwgfSxcbiAgICAgIHJlcXVlc3RWYWxpZGF0b3I6IG5ldyBhcGlnYXRld2F5LlJlcXVlc3RWYWxpZGF0b3IocmVzdEFQSSwgJ2RlbGV0ZS1yZXF1ZXN0LXZhbGlkYXRvcicsIHtcbiAgICAgICAgcmVzdEFwaTogcmVzdEFQSSxcbiAgICAgICAgdmFsaWRhdGVSZXF1ZXN0Qm9keTogdHJ1ZSxcbiAgICAgICAgdmFsaWRhdGVSZXF1ZXN0UGFyYW1ldGVyczogZmFsc2UsXG4gICAgICB9KVxuICAgIH0pO1xuICB9XG59XG4iXX0=