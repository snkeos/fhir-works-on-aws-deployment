class LambdaUpdateDeprecatedRuntime {
    constructor(serverless, options) {
        this.serverless = serverless;
        this.options = options;
        this.provider = 'aws';

        this.hooks = {
            'before:deploy:deploy': this.afterCompileEvents.bind(this),
        };
        console.log('LambdaUpdateDeprecatedRuntime::cstor');
    }

    afterCompileEvents() {
        console.log('LambdaUpdateDeprecatedRuntime::afterCompileEvents');
        this.serverless.cli.log('LambdaUpdateDeprecatedRuntime::afterCompileEvents');

        const key = 'CustomDashresourceDashapigwDashcwDashroleLambdaFunction';
        let resources = this.serverless.service.provider.compiledCloudFormationTemplate.Resources;
        if (
            key in resources /* &&
            (resources[key].Properties.Runtime === 'nodejs12.x' ||
                resources[key].Properties.Runtime === 'nodejs14.x' ||
                resources[key].Properties.Runtime === 'nodejs16.x') */
        ) {
            resources[key].Properties.Runtime = 'nodejs18.x';
            this.serverless.cli.log('Fixed runtime to `nodejs18.x`');
        }
    }
}

module.exports = LambdaUpdateDeprecatedRuntime;
