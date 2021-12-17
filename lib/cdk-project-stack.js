"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CdkProjectStack = void 0;
const cdk = require("@aws-cdk/core");
const apigateway = require("@aws-cdk/aws-apigateway");
const lambda = require("@aws-cdk/aws-lambda");
const dynamodb = require("@aws-cdk/aws-dynamodb");
const cognito = require("@aws-cdk/aws-cognito");
const secretsmanager = require("@aws-cdk/aws-secretsmanager");
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2RrLXByb2plY3Qtc3RhY2suanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJjZGstcHJvamVjdC1zdGFjay50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSxxQ0FBcUM7QUFDckMsc0RBQXNEO0FBQ3RELDhDQUE4QztBQUM5QyxrREFBa0Q7QUFDbEQsZ0RBQWdEO0FBQ2hELDhEQUE4RDtBQUU5RCxNQUFhLGVBQWdCLFNBQVEsR0FBRyxDQUFDLEtBQUs7SUFDNUMsWUFBWSxLQUFvQixFQUFFLEVBQVUsRUFBRSxLQUFzQjtRQUNsRSxLQUFLLENBQUMsS0FBSyxFQUFFLEVBQUUsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUV4QiwyQkFBMkI7UUFDM0IsTUFBTSxTQUFTLEdBQUcsSUFBSSxRQUFRLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSw0QkFBNEIsRUFBRTtZQUN2RSxZQUFZLEVBQUUsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFLElBQUksRUFBRSxRQUFRLENBQUMsYUFBYSxDQUFDLE1BQU0sRUFBRTtZQUNyRSxPQUFPLEVBQUUsRUFBRSxJQUFJLEVBQUUsVUFBVSxFQUFFLElBQUksRUFBRSxRQUFRLENBQUMsYUFBYSxDQUFDLE1BQU0sRUFBRTtTQUNuRSxDQUFDLENBQUM7UUFFSCxNQUFNLHdCQUF3QixHQUFHLENBQUUsY0FBYyxFQUFFLE9BQU8sRUFBRSxXQUFXLEVBQUUsU0FBUyxDQUFFLENBQUM7UUFFckYsaUJBQWlCO1FBQ2pCLE1BQU0sY0FBYyxHQUFHLElBQUksTUFBTSxDQUFDLFFBQVEsQ0FBQyxJQUFJLEVBQUUseUJBQXlCLEVBQUU7WUFDMUUsSUFBSSxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLFdBQVcsQ0FBQztZQUN4QyxPQUFPLEVBQUUsZUFBZTtZQUN4QixPQUFPLEVBQUUsTUFBTSxDQUFDLE9BQU8sQ0FBQyxXQUFXO1lBQ25DLFdBQVcsRUFBRTtnQkFDWCxvQkFBb0IsRUFBRSxTQUFTLENBQUMsU0FB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LElBQUksQ0FBQyxXQUFXLENBQUMsWUFBWSxDQUFDLENBQUMsU0FBUyxDQUFDLEtBQUssRUFBRSxjQUFjLEVBQUU7WUFDdEUsaUJBQWlCLEVBQUUsVUFBVSxDQUFDLGlCQUFpQixDQUFDLE9BQU87WUFDdkQsVUFBVSxFQUFFO2dCQUNWLFlBQVksRUFBRSxVQUFVLENBQUMsR0FBRzthQUM3QjtZQUNELGFBQWEsRUFBRSxFQUFFLGtCQUFrQixFQUFFLFlBQVksRUFBRTtZQUNuRCxnQkFBZ0IsRUFBRSxJQUFJLFVBQVUsQ0FBQyxnQkFBZ0IsQ0FBQyxPQUFPLEVBQUUsMEJBQTBCLEVBQUU7Z0JBQ3JGLE9BQU8sRUFBRSxPQUFPO2dCQUNoQixtQkFBbUIsRUFBRSxJQUFJO2dCQUN6Qix5QkFBeUIsRUFBRSxLQUFLO2FBQ2pDLENBQUM7U0FDSCxDQUFDLENBQUM7UUFFSCxPQUFPLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxZQUFZLENBQUMsQ0FBQyxTQUFTLENBQUMsUUFBUSxFQUFFLGNBQWMsRUFBRTtZQUN6RSxpQkFBaUIsRUFBRSxVQUFVLENBQUMsaUJBQWlCLENBQUMsT0FBTztZQUN2RCxVQUFVLEVBQUU7Z0JBQ1YsWUFBWSxFQUFFLFVBQVUsQ0FBQyxHQUFHO2FBQzdCO1lBQ0QsYUFBYSxFQUFFLEVBQUUsa0JBQWtCLEVBQUUsWUFBWSxFQUFFO1lBQ25ELGdCQUFnQixFQUFFLElBQUksVUFBVSxDQUFDLGdCQUFnQixDQUFDLE9BQU8sRUFBRSwwQkFBMEIsRUFBRTtnQkFDckYsT0FBTyxFQUFFLE9BQU87Z0JBQ2hCLG1CQUFtQixFQUFFLElBQUk7Z0JBQ3pCLHlCQUF5QixFQUFFLEtBQUs7YUFDakMsQ0FBQztTQUNILENBQUMsQ0FBQztJQUNMLENBQUM7Q0FDRjtBQXZMRCwwQ0F1TEMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBjZGsgZnJvbSAnQGF3cy1jZGsvY29yZSc7XG5pbXBvcnQgKiBhcyBhcGlnYXRld2F5IGZyb20gJ0Bhd3MtY2RrL2F3cy1hcGlnYXRld2F5JztcbmltcG9ydCAqIGFzIGxhbWJkYSBmcm9tICdAYXdzLWNkay9hd3MtbGFtYmRhJztcbmltcG9ydCAqIGFzIGR5bmFtb2RiIGZyb20gJ0Bhd3MtY2RrL2F3cy1keW5hbW9kYic7XG5pbXBvcnQgKiBhcyBjb2duaXRvIGZyb20gJ0Bhd3MtY2RrL2F3cy1jb2duaXRvJztcbmltcG9ydCAqIGFzIHNlY3JldHNtYW5hZ2VyIGZyb20gJ0Bhd3MtY2RrL2F3cy1zZWNyZXRzbWFuYWdlcic7XG5cbmV4cG9ydCBjbGFzcyBDZGtQcm9qZWN0U3RhY2sgZXh0ZW5kcyBjZGsuU3RhY2sge1xuICBjb25zdHJ1Y3RvcihzY29wZTogY2RrLkNvbnN0cnVjdCwgaWQ6IHN0cmluZywgcHJvcHM/OiBjZGsuU3RhY2tQcm9wcykge1xuICAgIHN1cGVyKHNjb3BlLCBpZCwgcHJvcHMpO1xuXG4gICAgLy9EeW5hbW9EQiBUYWJsZSBEZWZpbml0aW9uXG4gICAgY29uc3QgZ2FtZVRhYmxlID0gbmV3IGR5bmFtb2RiLlRhYmxlKHRoaXMsICdhd3MtY2RrLWR5bmFtb2RiLWdhbWVUYWJsZScsIHtcbiAgICAgIHBhcnRpdGlvbktleTogeyBuYW1lOiAndXNlcklEJywgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5TVFJJTkcgfSxcbiAgICAgIHNvcnRLZXk6IHsgbmFtZTogJ2dhbWVOYW1lJywgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5TVFJJTkcgfVxuICAgIH0pO1xuXG4gICAgY29uc3QgYWxsb3dlZFJlcXVlc3RQYXJhbWV0ZXJzID0gWyAneWVhclJlbGVhc2VkJywgJ2dlbnJlJywgJ2RldmVsb3BlcicsICdjb25zb2xlJyBdO1xuXG4gICAgLy9MYW1iZGEgRnVuY3Rpb25cbiAgICBjb25zdCBsYW1iZGFGdW5jdGlvbiA9IG5ldyBsYW1iZGEuRnVuY3Rpb24odGhpcywgJ2F3cy1jZGstbGFtYmRhLWZ1bmN0aW9uJywge1xuICAgICAgY29kZTogbGFtYmRhLkNvZGUuZnJvbUFzc2V0KFwiZnVuY3Rpb25zXCIpLFxuICAgICAgaGFuZGxlcjogJ2luZGV4LmhhbmRsZXInLFxuICAgICAgcnVudGltZTogbGFtYmRhLlJ1bnRpbWUuTk9ERUpTXzE0X1gsXG4gICAgICBlbnZpcm9ubWVudDoge1xuICAgICAgICBEWU5BTU9fREJfR0FNRV9UQUJMRTogZ2FtZVRhYmxlLnRhYmxlTmFtZSxcbiAgICAgICAgQUxMT1dFRF9SRVFVRVNUX1BBUkFNRVRFUlM6IEpTT04uc3RyaW5naWZ5KGFsbG93ZWRSZXF1ZXN0UGFyYW1ldGVycylcbiAgICAgIH1cbiAgICB9KTtcbiAgICBnYW1lVGFibGUuZ3JhbnRSZWFkV3JpdGVEYXRhKGxhbWJkYUZ1bmN0aW9uKTsgXG5cbiAgICAvL0FQSSBHYXRld2F5XG4gICAgY29uc3QgcmVzdEFQSSA9IG5ldyBhcGlnYXRld2F5LkxhbWJkYVJlc3RBcGkodGhpcywgXCJhd3MtY2RrLXJlc3QtYXBpXCIsIHtcbiAgICAgIGhhbmRsZXI6IGxhbWJkYUZ1bmN0aW9uLFxuICAgICAgcHJveHk6IGZhbHNlLFxuICAgICAgcmVzdEFwaU5hbWU6IFwiR2FtZSBNYW5hZ2VtZW50IEFQSVwiXG4gICAgfSk7XG4gICAgY29uc3QgYXBpSW50ZWdyYXRpb24gPSBuZXcgYXBpZ2F0ZXdheS5MYW1iZGFJbnRlZ3JhdGlvbihsYW1iZGFGdW5jdGlvbik7XG5cbiAgICAvL0NvZ25pdG9cbiAgICBjb25zdCB1c2VyUG9vbCA9IG5ldyBjb2duaXRvLlVzZXJQb29sKHRoaXMsICd1c2VyUG9vbCcsIHtcbiAgICAgIHNlbGZTaWduVXBFbmFibGVkOiB0cnVlLFxuICAgICAgdXNlclZlcmlmaWNhdGlvbjoge1xuICAgICAgICBlbWFpbFN1YmplY3Q6ICdWZXJpZnkgeW91ciBlbWFpbCEnLFxuICAgICAgICBlbWFpbEJvZHk6ICdIZWxsbywgVGhhbmtzIGZvciBzaWduaW5nIHVwISB7IyNWZXJpZnkgRW1haWwjI30nLFxuICAgICAgICBlbWFpbFN0eWxlOiBjb2duaXRvLlZlcmlmaWNhdGlvbkVtYWlsU3R5bGUuTElOS1xuICAgICAgfSxcbiAgICAgIHNpZ25JbkFsaWFzZXM6IHtcbiAgICAgICAgdXNlcm5hbWU6IHRydWUsXG4gICAgICAgIGVtYWlsOiB0cnVlXG4gICAgICB9LFxuICAgICAgc3RhbmRhcmRBdHRyaWJ1dGVzOiB7XG4gICAgICAgIGVtYWlsOiB7XG4gICAgICAgICAgcmVxdWlyZWQ6IHRydWVcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pO1xuXG4gICAgY29uc3Qgb0F1dGhTZWNyZXQgPSBzZWNyZXRzbWFuYWdlci5TZWNyZXQuZnJvbVNlY3JldENvbXBsZXRlQXJuKFxuICAgICAgdGhpcyxcbiAgICAgICdkYi1vYXV0aC1pZCcsXG4gICAgICAnYXJuOmF3czpzZWNyZXRzbWFuYWdlcjp1cy1lYXN0LTE6MjIxMTc2MTQwMzY1OnNlY3JldDoyMjAwODYyMTYwMTUtaTMzc3RicWpiZmg1cmxtOXFpM3VhaW1iOWVvNmducnMuYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20tNnhoWkhZJ1xuICAgICk7XG5cbiAgICBjb25zdCB1c2VyUG9vbElkZW50aXR5UHJvdmlkZXJHb29nbGUgPSBuZXcgY29nbml0by5Vc2VyUG9vbElkZW50aXR5UHJvdmlkZXJHb29nbGUodGhpcywgJ3VzZXJQb29sR29vZ2xlJywge1xuICAgICAgdXNlclBvb2w6IHVzZXJQb29sLFxuICAgICAgY2xpZW50SWQ6IG9BdXRoU2VjcmV0LnNlY3JldE5hbWUsXG4gICAgICBjbGllbnRTZWNyZXQ6IG9BdXRoU2VjcmV0LnNlY3JldFZhbHVlLnRvU3RyaW5nKCksXG4gICAgICBhdHRyaWJ1dGVNYXBwaW5nOiB7XG4gICAgICAgIGVtYWlsOiB7XG4gICAgICAgICAgYXR0cmlidXRlTmFtZTogY29nbml0by5Qcm92aWRlckF0dHJpYnV0ZS5HT09HTEVfRU1BSUwuYXR0cmlidXRlTmFtZSxcbiAgICAgICAgfSxcbiAgICAgICAgY3VzdG9tOiB7XG4gICAgICAgICAgZW1haWxfdmVyaWZpZWQ6IGNvZ25pdG8uUHJvdmlkZXJBdHRyaWJ1dGUub3RoZXIoJ2VtYWlsX3ZlcmlmaWVkJyksXG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICBzY29wZXM6IFsncHJvZmlsZScsJ2VtYWlsJywnb3BlbmlkJ11cbiAgICB9KTtcblxuICAgIGNvbnN0IHVzZXJQb29sQ2xpZW50ID0gbmV3IGNvZ25pdG8uVXNlclBvb2xDbGllbnQodGhpcywgJ3VzZXJQb29sQ2xpZW50Jywge1xuICAgICAgdXNlclBvb2w6IHVzZXJQb29sLFxuICAgICAgb0F1dGg6IHtcbiAgICAgICAgY2FsbGJhY2tVcmxzOiBbJ2h0dHBzOi8vZXhhbXBsZS5jb20vY2FsbGJhY2snXSxcbiAgICAgICAgbG9nb3V0VXJsczogWydodHRwczovL2V4YW1wbGUuY29tL3NpZ25vdXQnXSxcbiAgICAgICAgZmxvd3M6IHtcbiAgICAgICAgICBhdXRob3JpemF0aW9uQ29kZUdyYW50OiBmYWxzZSxcbiAgICAgICAgICBpbXBsaWNpdENvZGVHcmFudDogdHJ1ZSxcbiAgICAgICAgICBjbGllbnRDcmVkZW50aWFsczogZmFsc2VcbiAgICAgICAgfSxcbiAgICAgICAgc2NvcGVzOiBbY29nbml0by5PQXV0aFNjb3BlLk9QRU5JRF1cbiAgICAgIH1cbiAgICB9KTtcblxuICAgIGNvbnN0IHVzZXJQb29sRG9tYWluID0gbmV3IGNvZ25pdG8uVXNlclBvb2xEb21haW4odGhpcywgJ3VzZXJQb29sRG9tYWluJywge1xuICAgICAgdXNlclBvb2w6IHVzZXJQb29sLFxuICAgICAgY29nbml0b0RvbWFpbjoge1xuICAgICAgICBkb21haW5QcmVmaXg6ICdjZGtnYW1lYXBpZGVtbydcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIGNvbnN0IGF1dGhvcml6ZXIgPSBuZXcgYXBpZ2F0ZXdheS5DZm5BdXRob3JpemVyKHRoaXMsICdjZm5BdXRoJywge1xuICAgICAgcmVzdEFwaUlkOiByZXN0QVBJLnJlc3RBcGlJZCxcbiAgICAgIG5hbWU6ICdnYW1lQXV0aG9yaXplcicsXG4gICAgICB0eXBlOiAnQ09HTklUT19VU0VSX1BPT0xTJyxcbiAgICAgIGlkZW50aXR5U291cmNlOiAnbWV0aG9kLnJlcXVlc3QuaGVhZGVyLkF1dGhvcml6YXRpb24nLFxuICAgICAgcHJvdmlkZXJBcm5zOiBbdXNlclBvb2wudXNlclBvb2xBcm5dXG4gICAgfSlcblxuICAgIC8vTWV0aG9kIHNjaGVtYVxuICAgIGNvbnN0IHJlcXVlc3RNb2RlbCA9IHJlc3RBUEkuYWRkTW9kZWwoJ1JlcXVlc3RNb2RlbCcsIHtcbiAgICAgIGNvbnRlbnRUeXBlOiAnYXBwbGljYXRpb24vanNvbicsXG4gICAgICBtb2RlbE5hbWU6ICdQb3N0TW9kZWwnLFxuICAgICAgc2NoZW1hOiB7XG4gICAgICBzY2hlbWE6IGFwaWdhdGV3YXkuSnNvblNjaGVtYVZlcnNpb24uRFJBRlQ0LFxuICAgICAgdGl0bGU6ICdwb3N0TW9kZWwnLFxuICAgICAgdHlwZTogYXBpZ2F0ZXdheS5Kc29uU2NoZW1hVHlwZS5PQkpFQ1QsXG4gICAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICAgICAgdXNlcklEOiB7IHR5cGU6IGFwaWdhdGV3YXkuSnNvblNjaGVtYVR5cGUuU1RSSU5HIH0sXG4gICAgICAgICAgZ2FtZU5hbWU6IHsgdHlwZTogYXBpZ2F0ZXdheS5Kc29uU2NoZW1hVHlwZS5TVFJJTkcgfSxcbiAgICAgICAgICB5ZWFyUmVsZWFzZWQ6IHsgdHlwZTogYXBpZ2F0ZXdheS5Kc29uU2NoZW1hVHlwZS5JTlRFR0VSIH0sXG4gICAgICAgICAgZ2VucmU6IHsgdHlwZTogYXBpZ2F0ZXdheS5Kc29uU2NoZW1hVHlwZS5TVFJJTkcgfSxcbiAgICAgICAgICBkZXZlbG9wZXI6IHsgdHlwZTogYXBpZ2F0ZXdheS5Kc29uU2NoZW1hVHlwZS5TVFJJTkcgfSxcbiAgICAgICAgICBjb25zb2xlOiB7IHR5cGU6IGFwaWdhdGV3YXkuSnNvblNjaGVtYVR5cGUuU1RSSU5HIH0sICAgICAgICAgIFxuICAgICAgfSxcbiAgICAgIHJlcXVpcmVkOiBbJ3VzZXJJRCcsICdnYW1lTmFtZSddLFxuICAgICAgfSxcbiAgICB9KTtcblxuICAgIC8vTWV0aG9kIGRlZmluaXRpb25zXG4gICAgY29uc3QgZ2V0R2FtZSA9IHJlc3RBUEkucm9vdC5hZGRSZXNvdXJjZShcImdldEdhbWVcIikuYWRkTWV0aG9kKFwiR0VUXCIsIGFwaUludGVncmF0aW9uLCB7XG4gICAgICBhdXRob3JpemF0aW9uVHlwZTogYXBpZ2F0ZXdheS5BdXRob3JpemF0aW9uVHlwZS5DT0dOSVRPLFxuICAgICAgYXV0aG9yaXplcjoge1xuICAgICAgICBhdXRob3JpemVySWQ6IGF1dGhvcml6ZXIucmVmXG4gICAgICB9LFxuICAgICAgcmVxdWVzdFBhcmFtZXRlcnM6IHtcbiAgICAgICAgXCJtZXRob2QucmVxdWVzdC5xdWVyeXN0cmluZy5nYW1lTmFtZVwiOiB0cnVlXG4gICAgICB9LFxuICAgICAgcmVxdWVzdFZhbGlkYXRvcjogbmV3IGFwaWdhdGV3YXkuUmVxdWVzdFZhbGlkYXRvcihyZXN0QVBJLCAnZ2V0LXJlcXVlc3QtdmFsaWRhdG9yJywge1xuICAgICAgICByZXN0QXBpOiByZXN0QVBJLFxuICAgICAgICB2YWxpZGF0ZVJlcXVlc3RCb2R5OiBmYWxzZSxcbiAgICAgICAgdmFsaWRhdGVSZXF1ZXN0UGFyYW1ldGVyczogdHJ1ZSxcbiAgICAgIH0pXG4gICAgfSk7XG5cbiAgICByZXN0QVBJLnJvb3QuYWRkUmVzb3VyY2UoXCJsaXN0R2FtZXNcIikuYWRkTWV0aG9kKFwiR0VUXCIsIGFwaUludGVncmF0aW9uLCB7XG4gICAgICBhdXRob3JpemF0aW9uVHlwZTogYXBpZ2F0ZXdheS5BdXRob3JpemF0aW9uVHlwZS5DT0dOSVRPLFxuICAgICAgYXV0aG9yaXplcjoge1xuICAgICAgICBhdXRob3JpemVySWQ6IGF1dGhvcml6ZXIucmVmXG4gICAgICB9XG4gICAgfSk7XG4gICAgXG4gICAgcmVzdEFQSS5yb290LmFkZFJlc291cmNlKFwiY3JlYXRlR2FtZVwiKS5hZGRNZXRob2QoXCJQT1NUXCIsIGFwaUludGVncmF0aW9uLCB7XG4gICAgICBhdXRob3JpemF0aW9uVHlwZTogYXBpZ2F0ZXdheS5BdXRob3JpemF0aW9uVHlwZS5DT0dOSVRPLFxuICAgICAgYXV0aG9yaXplcjoge1xuICAgICAgICBhdXRob3JpemVySWQ6IGF1dGhvcml6ZXIucmVmXG4gICAgICB9LFxuICAgICAgcmVxdWVzdE1vZGVsczogeyAnYXBwbGljYXRpb24vanNvbic6IHJlcXVlc3RNb2RlbCB9LFxuICAgICAgcmVxdWVzdFZhbGlkYXRvcjogbmV3IGFwaWdhdGV3YXkuUmVxdWVzdFZhbGlkYXRvcihyZXN0QVBJLCBcImNyZWF0ZS1yZXF1ZXN0LXZhbGlkYXRvclwiLCB7XG4gICAgICAgIHJlc3RBcGk6IHJlc3RBUEksXG4gICAgICAgIHZhbGlkYXRlUmVxdWVzdEJvZHk6IHRydWUsXG4gICAgICAgIHZhbGlkYXRlUmVxdWVzdFBhcmFtZXRlcnM6IGZhbHNlLFxuICAgICAgfSlcbiAgICB9KTtcblxuICAgIHJlc3RBUEkucm9vdC5hZGRSZXNvdXJjZShcIm1vZGlmeUdhbWVcIikuYWRkTWV0aG9kKFwiUFVUXCIsIGFwaUludGVncmF0aW9uLCB7XG4gICAgICBhdXRob3JpemF0aW9uVHlwZTogYXBpZ2F0ZXdheS5BdXRob3JpemF0aW9uVHlwZS5DT0dOSVRPLFxuICAgICAgYXV0aG9yaXplcjoge1xuICAgICAgICBhdXRob3JpemVySWQ6IGF1dGhvcml6ZXIucmVmXG4gICAgICB9LFxuICAgICAgcmVxdWVzdE1vZGVsczogeyAnYXBwbGljYXRpb24vanNvbic6IHJlcXVlc3RNb2RlbCB9LFxuICAgICAgcmVxdWVzdFZhbGlkYXRvcjogbmV3IGFwaWdhdGV3YXkuUmVxdWVzdFZhbGlkYXRvcihyZXN0QVBJLCAnbW9kaWZ5LXJlcXVlc3QtdmFsaWRhdG9yJywge1xuICAgICAgICByZXN0QXBpOiByZXN0QVBJLFxuICAgICAgICB2YWxpZGF0ZVJlcXVlc3RCb2R5OiB0cnVlLFxuICAgICAgICB2YWxpZGF0ZVJlcXVlc3RQYXJhbWV0ZXJzOiBmYWxzZSxcbiAgICAgIH0pXG4gICAgfSk7XG5cbiAgICByZXN0QVBJLnJvb3QuYWRkUmVzb3VyY2UoXCJkZWxldGVHYW1lXCIpLmFkZE1ldGhvZChcIkRFTEVURVwiLCBhcGlJbnRlZ3JhdGlvbiwge1xuICAgICAgYXV0aG9yaXphdGlvblR5cGU6IGFwaWdhdGV3YXkuQXV0aG9yaXphdGlvblR5cGUuQ09HTklUTyxcbiAgICAgIGF1dGhvcml6ZXI6IHtcbiAgICAgICAgYXV0aG9yaXplcklkOiBhdXRob3JpemVyLnJlZlxuICAgICAgfSxcbiAgICAgIHJlcXVlc3RNb2RlbHM6IHsgJ2FwcGxpY2F0aW9uL2pzb24nOiByZXF1ZXN0TW9kZWwgfSxcbiAgICAgIHJlcXVlc3RWYWxpZGF0b3I6IG5ldyBhcGlnYXRld2F5LlJlcXVlc3RWYWxpZGF0b3IocmVzdEFQSSwgJ2RlbGV0ZS1yZXF1ZXN0LXZhbGlkYXRvcicsIHtcbiAgICAgICAgcmVzdEFwaTogcmVzdEFQSSxcbiAgICAgICAgdmFsaWRhdGVSZXF1ZXN0Qm9keTogdHJ1ZSxcbiAgICAgICAgdmFsaWRhdGVSZXF1ZXN0UGFyYW1ldGVyczogZmFsc2UsXG4gICAgICB9KVxuICAgIH0pO1xuICB9XG59XG4iXX0=