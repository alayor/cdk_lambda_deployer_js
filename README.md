# cdk_lambda_deployer_js
Library with CDK resources and utilities that help to deploy JavaScript functions to AWS lambda.

This solution is composed of two parts: 
* CLD_BUILD
* CLD_DEPLOY

CLD_BUILD is a library that will help build the metadata files needed to deploy the functions source to AWS Lambda.

CLD_DEPLOY is a set of CDK constructs that will be in charge of hosting the functions and layers source
using Amazon S3 as well as deploying that source to AWS lambda.

# Set up CLD_DEPLOY

You have two options to add the CLD_DEPLOY resources to your CDK project.

1. You can add it as a Constructor on your Stack.
```
new CDKLambdaDeployerConstruct(
      this,
      'CDKLambdaDeployer',
      {
        vpc: myVpc,
        githubRepoOwner: 'repo_owner',
        githubRepoName: 'repo_name',
        githubRepoBranch: 'master',
        githubTokenSecretId: 'github_token_secret_id'
      },
    )
```

2. You can add it as a new stack

``` 
new cld_deploy.CDKLambdaDeployerStack(app, 'CDKLambdaDeployer', {
    env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
    vpcId: 'vpc-xxxx',
    githubRepoOwner: 'repo_owner',
    githubRepoName: 'repo_name',
    githubRepoBranch: 'master',
    githubTokenSecretId: 'github_token_secret_id'
})
```

# Set up CLD_BUILD
