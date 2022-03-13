# cdk_lambda_deployer_js
Library with CDK resources and utilities that help to deploy JavaScript functions to AWS lambda.

This solution is composed of two parts: 
* CDK_LIB
* JS_LIB

CDK_LIB is a set of CDK constructs that will be in charge of hosting the functions and layers source
using Amazon S3 as well as deploying that source to AWS lambda.

JS_LIB is a library that will help build the metadata files needed to deploy the functions source to 
AWS Lambda.

# Set up CDK_LIB

You have two options to add the CDK_LIB resources to your CDK project.

1. You can add it as a Constructor on your Stack.
```
new CDKLambdaDeployerConstruct(
      this as unknown as CDKLambdaDeployerConstructType,
      'CDKLambdaDeployer',
      {
        vpc: myVpc as unknown as CDKLambdaDeployerVpcType,
      },
    )
```

2. You can add it as a new stack

``` 
new CDKLambdaDeployerStack(app, 'CDKLambdaDeployerStack', {
  vpc: mainStack.vpc as unknown as CDKLambdaDeployerVpc,
}) 
```

# Set up JS_LIB
