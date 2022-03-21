# cdk_lambda_deployer_js

Library with CDK resources and utilities that help to deploy JavaScript functions to AWS lambda.

This solution is composed of two parts:

- CLD_BUILD
- CLD_DEPLOY

CLD_BUILD is a library that will help build the metadata files needed to deploy the functions source to AWS Lambda.

CLD_DEPLOY is a set of CDK constructs that will be in charge of hosting the functions and layers source
using Amazon S3 as well as deploying that source to AWS lambda.

# Set up CLD_BUILD

You need to add this configuration to your package.json

```json
{
  "cld": {
    "build": {
      "functionsRelativePath": "src/functions",
      "functionFileName": "function.js",
      "libsRelativePath": "src/libs",
      "entityNames": ["admin", "customer", "deliverer"],
      "libNames": ["db", "util"],
      "outputRelativePath": "output"
    }
  }
}
```

_functionsRelativePath_: This property tells CLD where to find the functions that will be the source of the lambda functions.

_functionFileName_: This property tells cld what file names inside the functionsRelativePath will be considered to be lambda functions source code.
Note: Only one file will be deployed to the lambda function.

_libsRelativePath_: This property tells CLD where the files are located for the lambda layers. You can use this for you project libraries.

_entityNames_: These are the sub-folder names inside the _functionsRelativePath_ that will be scanned for files with name _functionFileName_.
These will be used as function name prefixes as well.

_libNames_: Like the _entityNames_, these are the sub-folder names inside the _libsRelativePath_ that will be scanned for the files to be the source of the layers.

_outputRelativePath_: Is the folder that will be used to create the lambda functions and layers. It is recommended that you ignore
this file in your source code control.

Your _outputRelativePath_ folder will end up with two sub-folders: *functions* and *libs*.
Functions will be the source of the lambda functions.
Libs will be the source of the lambda layers.

Supposing your project looks like this:
- myProject
    - package.json
    - src
        - functions
            - customer
                - order
                    - place
                        - util.js
                        - function.js
            - deliverer
                - offer
                    - publish
                        - function.js
        - libs
            - db
                - connection.js
            - util
                - util.js

And
_functionsRelativePath_ is: "src/functions"

_functionFileName_ is: "function.js"

_libsRelativePath_ is: "src/libs"

_entityNames_ is: ["customer", "deliverer"]

_libNames_ is: ["db", "util"]


Then, your output folder will look like this:
- functions
    - customer
        - order
            - place
                - function.zip
    - deliverer
        - offer
            - publish
                - function.zip
- libs
    - db
        - nodejs.zip
    - util
        - nodejs.zip


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
