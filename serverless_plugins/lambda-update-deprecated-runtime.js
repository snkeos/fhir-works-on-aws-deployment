'use strict';

class LambdaUpdateDeprecatedRuntime {
    constructor(serverless, options) {
        this.serverless = serverless;
        this.options = options;
        this.provider = 'aws';

        this.hooks = {
            'after:deploy:compileEvents': this.afterCompileEvents.bind(this),
        };
    }

    afterCompileEvents() {
        this.serverless.cli.log('LambdaUpdateDeprecatedRuntime');

        let key = 'CustomDashresourceDashapigwDashcwDashroleLambdaFunction';
        let resources = this.serverless.service.provider.compiledCloudFormationTemplate.Resources;
        if (
            key in resources /* &&
            (resources[key].Properties.Runtime === 'nodejs12.x' ||
                resources[key].Properties.Runtime === 'nodejs14.x' ||
                resources[key].Properties.Runtime === 'nodejs16.x') */
        ) {
            resources[key].Properties.Runtime = 'nodejs18.x';
            this.serverless.cli.log(
                'Fixed CustomDashresourceDashapigwDashcwDashroleLambdaFunction runtime to `nodejs18.x`' );
           
        }
    }
}

module.exports = LambdaUpdateDeprecatedRuntime;
