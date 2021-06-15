/*
 *  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *  SPDX-License-Identifier: Apache-2.0
 */

import {
    FhirConfig,
    FhirVersion,
    stubs,
    BASE_R4_RESOURCES,
    BASE_STU3_RESOURCES,
    Validator,
} from 'fhir-works-on-aws-interface';
import { ElasticSearchService } from 'fhir-works-on-aws-search-es';
import { RBACHandler } from 'fhir-works-on-aws-authz-rbac';
import {
    DynamoDb,
    DynamoDbDataService,
    DynamoDbBundleService,
    S3DataService,
    DynamoDbUtil,
} from 'fhir-works-on-aws-persistence-ddb';
import JsonSchemaValidator from 'fhir-works-on-aws-routing/lib/router/validation/jsonSchemaValidator';
import HapiFhirLambdaValidator from 'fhir-works-on-aws-routing/lib/router/validation/hapiFhirLambdaValidator';
import RBACRules from './RBACRules';
import { loadImplementationGuides } from './implementationGuides/loadCompiledIGs';

const { IS_OFFLINE } = process.env;

const fhirVersion: FhirVersion = '4.0.1';
const baseResources = fhirVersion === '4.0.1' ? BASE_R4_RESOURCES : BASE_STU3_RESOURCES;
const authService = IS_OFFLINE ? stubs.passThroughAuthz : new RBACHandler(RBACRules(baseResources), fhirVersion);
const dynamoDbDataService = new DynamoDbDataService(DynamoDb);
const dynamoDbBundleService = new DynamoDbBundleService(DynamoDb);

// Configure the input validators. Validators run in the order that they appear on the array. Use an empty array to disable input validation.
const validators: Validator[] = [];
if (process.env.VALIDATOR_LAMBDA_ALIAS) {
    // The HAPI FHIR Validator must be deployed separately. It is the recommended choice when using implementation guides.
    validators.push(new HapiFhirLambdaValidator(process.env.VALIDATOR_LAMBDA_ALIAS));
} else {
    // The JSON Schema Validator is simpler and is a good choice for testing the FHIR server with minimal configuration.
    validators.push(new JsonSchemaValidator(fhirVersion));
}

const esSearch = new ElasticSearchService(
    [
        {
            key: 'documentStatus',
            value: ['AVAILABLE'],
            comparisonOperator: '==',
            logicalOperator: 'AND',
        },
    ],
    DynamoDbUtil.cleanItem,
    fhirVersion,
    loadImplementationGuides('fhir-works-on-aws-search-es'),
);
const s3DataService = new S3DataService(dynamoDbDataService, fhirVersion);

const multiTenancyStrategy =
    process.env.MULTI_TENANCY_STRATEGY === '[object Object]' || process.env.MULTI_TENANCY_STRATEGY === undefined
        ? 'None'
        : process.env.MULTI_TENANCY_STRATEGY;

const multiTenancyTokenClaim =
    process.env.MULTI_TENANCY_TOKEN_CLAIM === '[object Object]' || process.env.MULTI_TENANCY_TOKEN_CLAIM === undefined
        ? ''
        : process.env.MULTI_TENANCY_TOKEN_CLAIM;

const multiTenancyTokenValvePrefix =
    process.env.MULTI_TENANCY_TOKEN_CLAIM_VALVE_PREFIX === '[object Object]' ||
    process.env.MULTI_TENANCY_TOKEN_CLAIM_VALVE_PREFIX === undefined
        ? ''
        : process.env.MULTI_TENANCY_TOKEN_CLAIM_VALVE_PREFIX;

const OAuthUrl =
    process.env.OAUTH2_DOMAIN_ENDPOINT === '[object Object]' || process.env.OAUTH2_DOMAIN_ENDPOINT === undefined
        ? 'https://OAUTH2.com'
        : process.env.OAUTH2_DOMAIN_ENDPOINT;

export const fhirConfig: FhirConfig = {
    configVersion: 1.0,
    productInfo: {
        orgName: 'Organization Name',
    },
    auth: {
        authorization: authService,
        // Used in Capability Statement Generation only
        strategy: {
            service: 'OAuth',
            oauthPolicy: {
                authorizationEndpoint: `${OAuthUrl}/authorize`,
                tokenEndpoint: `${OAuthUrl}/token`,
            },
        },
    },
    server: {
        // When running serverless offline, env vars are expressed as '[object Object]'
        // https://github.com/serverless/serverless/issues/7087
        // As of May 14, 2020, this bug has not been fixed and merged in
        // https://github.com/serverless/serverless/pull/7147
        url:
            process.env.API_URL === '[object Object]' || process.env.API_URL === undefined
                ? 'https://API_URL.com'
                : process.env.API_URL,
    },
    tenancyOptions: {
        stratedy: multiTenancyStrategy === 'UrlBased' ? 'UrlBased' : 'None',
        accessControl: multiTenancyTokenClaim !== '' ? 'Token' : 'None',
        tenantClaim: multiTenancyTokenClaim !== '' ? multiTenancyTokenClaim : undefined,
        tenantPrefix: multiTenancyTokenValvePrefix !== '' ? multiTenancyTokenValvePrefix : undefined,
    },
    validators,
    profile: {
        systemOperations: ['transaction'],
        bundle: dynamoDbBundleService,
        compiledImplementationGuides: loadImplementationGuides('fhir-works-on-aws-routing'),
        systemHistory: stubs.history,
        systemSearch: stubs.search,
        bulkDataAccess: dynamoDbDataService,
        fhirVersion,
        genericResource: {
            operations: ['create', 'read', 'update', 'delete', 'vread', 'search-type'],
            fhirVersions: [fhirVersion],
            persistence: dynamoDbDataService,
            typeSearch: esSearch,
            typeHistory: stubs.history,
        },
        resources: {
            Binary: {
                operations: ['create', 'read', 'update', 'delete', 'vread'],
                fhirVersions: [fhirVersion],
                persistence: s3DataService,
                typeSearch: stubs.search,
                typeHistory: stubs.history,
            },
        },
    },
};

export function getCorsOrigins(): string | string[] | undefined {
    const corsOrigins =
        process.env.CORS_ORIGINS === '[object Object]' || process.env.CORS_ORIGINS === undefined
            ? undefined
            : process.env.CORS_ORIGINS;

    // Check, if there are any cors origins set
    if (corsOrigins !== undefined) {
        const corsOriginsArray: string[] = corsOrigins.split(',');
        let cleanCorsOriginsArray: string[] = [];

        // Skip empty array elements, trim whitespaces and transform ALL_ORIGINS to *
        corsOriginsArray.every(origin => {
            const cleanedOrigin = origin.trim();
            if (cleanedOrigin.toUpperCase() === 'ALL_ORIGINS') {
                cleanCorsOriginsArray = [];
                cleanCorsOriginsArray.push('*');
                return false;
            }
            if (cleanedOrigin.length !== 0) {
                cleanCorsOriginsArray.push(cleanedOrigin);
            }
            return true;
        });

        // If there is only a sinple entry, just return the string itself
        if (cleanCorsOriginsArray.length === 1) {
            return cleanCorsOriginsArray[0];
        }

        return cleanCorsOriginsArray;
    }
    return undefined;
}

export const genericResources = baseResources;
