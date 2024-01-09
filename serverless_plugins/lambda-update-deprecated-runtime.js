class LambdaUpdateDeprecatedRuntime {
    constructor(serverless, options) {
        this.serverless = serverless;
        this.options = options;
        this.provider = 'aws';

        this.hooks = {
            'before:deploy:deploy': this.beforeDeploy.bind(this),
        };
    }

    beforeDeploy() {
        this.serverless.cli.log('LambdaUpdateDeprecatedRuntime::before:deploy:deploy');

        const key = 'CustomDashresourceDashapigwDashcwDashroleLambdaFunction';
        // eslint-disable-next-line prefer-const
        let resources = this.serverless.service.provider.compiledCloudFormationTemplate.Resources;
        if (key in resources) {
            resources[key].Properties.Runtime = 'nodejs18.x';
            this.serverless.cli.log('Fixed runtime to `nodejs18.x`');
        }
    }
}

module.exports = LambdaUpdateDeprecatedRuntime;
