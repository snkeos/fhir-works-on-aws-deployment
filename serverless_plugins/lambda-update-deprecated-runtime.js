class LambdaUpdateDeprecatedRuntime {
    constructor(serverless, options) {
        this.serverless = serverless;
        this.options = options;
        this.provider = 'aws';

        this.hooks = {
            'after:deploy:compileEvents': this.afterCompileEvents.bind(this),
        };
        console.log('LambdaUpdateDeprecatedRuntime::cstor');
    }

    afterCompileEvents() {
        console.log('LambdaUpdateDeprecatedRuntime::afterCompileEvents');
        this.serverless.cli.log('LambdaUpdateDeprecatedRuntime::afterCompileEvents');

        let resources = this.serverless.service.provider.compiledCloudFormationTemplate.Resources;

        Object.keys(resources).forEach((resourceKey) => {
            resources[resourceKey].Properties.Runtime = 'nodejs18.x'; // or: 'nodejs16.x'
        });

        /*
        let key = 'CustomDashresourceDashapigwDashcwDashroleLambdaFunction';
        let resources = this.serverless.service.provider.compiledCloudFormationTemplate.Resources;
        if (
            key in resources /* &&
            (resources[key].Properties.Runtime === 'nodejs12.x' ||
                resources[key].Properties.Runtime === 'nodejs14.x' ||
                resources[key].Properties.Runtime === 'nodejs16.x') 
        ) {
            resources[key].Properties.Runtime = 'nodejs18.x';
            this.serverless.cli.log(
                'Fixed CustomDashresourceDashapigwDashcwDashroleLambdaFunction runtime to `nodejs18.x`' );
           
        } */
    }
}

module.exports = LambdaUpdateDeprecatedRuntime;
