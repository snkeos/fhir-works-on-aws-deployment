class LambdaUpdateDeprecatedRuntime {
    constructor(serverless, options) {
        this.serverless = serverless;
        this.options = options;
        this.provider = 'aws';

        this.hooks = {
            'before:deploy:deploy': this.beforeDeploy.bind(this),
        };
        console.log('LambdaUpdateDeprecatedRuntime::cstor');
    }

    beforeDeploy() {
        this.serverless.cli.log('LambdaUpdateDeprecatedRuntime::before:deploy:deploy');

        const key = 'CustomDashresourceDashapigwDashcwDashroleLambdaFunction';
        let resources = this.serverless.service.provider.compiledCloudFormationTemplate.Resources;
        if (key in resources) {
            resources[key].Properties.Runtime = 'nodejs18.x';
            this.serverless.cli.log('Fixed runtime to `nodejs18.x`');
            resources[key].Properties.RuntimeManagementConfig = {
                UpdateRuntimeOn: 'FunctionUpdate',
            };
            this.serverless.cli.log('Fixed RuntimeManagementConfig: `UpdateRuntimeOn` to `FunctionUpdate`');
        }
    }
}

module.exports = LambdaUpdateDeprecatedRuntime;
