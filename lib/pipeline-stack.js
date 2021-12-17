"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CdkpipelinesDemoPipelineStack = void 0;
const core_1 = require("@aws-cdk/core");
const pipelines_1 = require("@aws-cdk/pipelines");
const secretsmanager = require("@aws-cdk/aws-secretsmanager");
/**
 * The stack that defines the application pipeline
 */
class CdkpipelinesDemoPipelineStack extends core_1.Stack {
    constructor(scope, id, props) {
        super(scope, id, props);
        const githubSecret = secretsmanager.Secret.fromSecretCompleteArn(this, 'db-oauth-id', 'arn:aws:secretsmanager:us-east-1:221176140365:secret:github-token-mFjfp1');
        const pipeline = new pipelines_1.CodePipeline(this, 'Pipeline', {
            // The pipeline name
            pipelineName: 'MyServicePipeline',
            // How it will be built and synthesized
            synth: new pipelines_1.ShellStep('Synth', {
                // Where the source can be found
                input: pipelines_1.CodePipelineSource.gitHub('OWNER/REPO', 'main'),
                // Install dependencies, build and run cdk synth
                commands: [
                    'npm ci',
                    'npm run build',
                    'npx cdk synth'
                ],
            }),
        });
        // This is where we add the application stages
        // ...
    }
}
exports.CdkpipelinesDemoPipelineStack = CdkpipelinesDemoPipelineStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGlwZWxpbmUtc3RhY2suanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJwaXBlbGluZS1zdGFjay50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSx3Q0FBMEU7QUFDMUUsa0RBQWlGO0FBQ2pGLDhEQUE4RDtBQUU5RDs7R0FFRztBQUNILE1BQWEsNkJBQThCLFNBQVEsWUFBSztJQUN0RCxZQUFZLEtBQWdCLEVBQUUsRUFBVSxFQUFFLEtBQWtCO1FBQzFELEtBQUssQ0FBQyxLQUFLLEVBQUUsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBRXhCLE1BQU0sWUFBWSxHQUFHLGNBQWMsQ0FBQyxNQUFNLENBQUMscUJBQXFCLENBQzVELElBQUksRUFDSixhQUFhLEVBQ2IsMEVBQTBFLENBQzdFLENBQUM7UUFFRixNQUFNLFFBQVEsR0FBRyxJQUFJLHdCQUFZLENBQUMsSUFBSSxFQUFFLFVBQVUsRUFBRTtZQUNsRCxvQkFBb0I7WUFDcEIsWUFBWSxFQUFFLG1CQUFtQjtZQUVoQyx1Q0FBdUM7WUFDdkMsS0FBSyxFQUFFLElBQUkscUJBQVMsQ0FBQyxPQUFPLEVBQUU7Z0JBQzVCLGdDQUFnQztnQkFDaEMsS0FBSyxFQUFFLDhCQUFrQixDQUFDLE1BQU0sQ0FBQyxZQUFZLEVBQUUsTUFBTSxDQUFDO2dCQUV0RCxnREFBZ0Q7Z0JBQ2hELFFBQVEsRUFBRTtvQkFDUixRQUFRO29CQUNSLGVBQWU7b0JBQ2YsZUFBZTtpQkFDaEI7YUFDRixDQUFDO1NBQ0osQ0FBQyxDQUFDO1FBRUgsOENBQThDO1FBQzlDLE1BQU07SUFDUixDQUFDO0NBQ0Y7QUEvQkQsc0VBK0JDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQ29uc3RydWN0LCBTZWNyZXRWYWx1ZSwgU3RhY2ssIFN0YWNrUHJvcHMgfSBmcm9tICdAYXdzLWNkay9jb3JlJztcclxuaW1wb3J0IHsgQ29kZVBpcGVsaW5lLCBDb2RlUGlwZWxpbmVTb3VyY2UsIFNoZWxsU3RlcCB9IGZyb20gXCJAYXdzLWNkay9waXBlbGluZXNcIjtcclxuaW1wb3J0ICogYXMgc2VjcmV0c21hbmFnZXIgZnJvbSAnQGF3cy1jZGsvYXdzLXNlY3JldHNtYW5hZ2VyJztcclxuXHJcbi8qKlxyXG4gKiBUaGUgc3RhY2sgdGhhdCBkZWZpbmVzIHRoZSBhcHBsaWNhdGlvbiBwaXBlbGluZVxyXG4gKi9cclxuZXhwb3J0IGNsYXNzIENka3BpcGVsaW5lc0RlbW9QaXBlbGluZVN0YWNrIGV4dGVuZHMgU3RhY2sge1xyXG4gIGNvbnN0cnVjdG9yKHNjb3BlOiBDb25zdHJ1Y3QsIGlkOiBzdHJpbmcsIHByb3BzPzogU3RhY2tQcm9wcykge1xyXG4gICAgc3VwZXIoc2NvcGUsIGlkLCBwcm9wcyk7XHJcblxyXG4gICAgY29uc3QgZ2l0aHViU2VjcmV0ID0gc2VjcmV0c21hbmFnZXIuU2VjcmV0LmZyb21TZWNyZXRDb21wbGV0ZUFybihcclxuICAgICAgICB0aGlzLFxyXG4gICAgICAgICdkYi1vYXV0aC1pZCcsXHJcbiAgICAgICAgJ2Fybjphd3M6c2VjcmV0c21hbmFnZXI6dXMtZWFzdC0xOjIyMTE3NjE0MDM2NTpzZWNyZXQ6Z2l0aHViLXRva2VuLW1GamZwMSdcclxuICAgICk7XHJcblxyXG4gICAgY29uc3QgcGlwZWxpbmUgPSBuZXcgQ29kZVBpcGVsaW5lKHRoaXMsICdQaXBlbGluZScsIHtcclxuICAgICAgLy8gVGhlIHBpcGVsaW5lIG5hbWVcclxuICAgICAgcGlwZWxpbmVOYW1lOiAnTXlTZXJ2aWNlUGlwZWxpbmUnLFxyXG5cclxuICAgICAgIC8vIEhvdyBpdCB3aWxsIGJlIGJ1aWx0IGFuZCBzeW50aGVzaXplZFxyXG4gICAgICAgc3ludGg6IG5ldyBTaGVsbFN0ZXAoJ1N5bnRoJywge1xyXG4gICAgICAgICAvLyBXaGVyZSB0aGUgc291cmNlIGNhbiBiZSBmb3VuZFxyXG4gICAgICAgICBpbnB1dDogQ29kZVBpcGVsaW5lU291cmNlLmdpdEh1YignT1dORVIvUkVQTycsICdtYWluJyksXHJcbiAgICAgICAgIFxyXG4gICAgICAgICAvLyBJbnN0YWxsIGRlcGVuZGVuY2llcywgYnVpbGQgYW5kIHJ1biBjZGsgc3ludGhcclxuICAgICAgICAgY29tbWFuZHM6IFtcclxuICAgICAgICAgICAnbnBtIGNpJyxcclxuICAgICAgICAgICAnbnBtIHJ1biBidWlsZCcsXHJcbiAgICAgICAgICAgJ25weCBjZGsgc3ludGgnXHJcbiAgICAgICAgIF0sXHJcbiAgICAgICB9KSxcclxuICAgIH0pO1xyXG5cclxuICAgIC8vIFRoaXMgaXMgd2hlcmUgd2UgYWRkIHRoZSBhcHBsaWNhdGlvbiBzdGFnZXNcclxuICAgIC8vIC4uLlxyXG4gIH1cclxufSJdfQ==