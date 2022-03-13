# cdk_lambda_deployer_js
Library with CDK resources and utilities that help to deploy JavaScript functions to AWS lambda.

This solution is composed of two parts: 
* CDK_LIB
* JS_LIB

CDK_LIB is a set of CDK constructs that will be in charge of hosting the functions and layers source
using Amazon S3 as well as deploying that source to AWS lambda.

JS_LIB is a library that will help build the metadata files needed to deploy the functions source to 
AWS Lambda.

How to the Construct in CDK_LIB

Just add this line on your Stack constructor

```new CDKLambdaDeployerConstruct(this, 'CDKLambdaDeployer')```
