# CDK Lambda Deployer JS (CLD)

Library with CDK resources and utilities that help to deploy JavaScript functions to AWS lambda.

This solution is composed of two parts:

- CLD_BUILD
- CLD_DEPLOY

CLD_BUILD is a library that will help build the metadata files needed to deploy the functions source to AWS Lambda.

CLD_DEPLOY is a set of CDK constructs that will be in charge of hosting the functions and layers source
using Amazon S3 as well as deploying that source to AWS lambda.

You will generally want to use the CLD_BUILD in your main project; whilst the CLD_DEPLOY is meant to be used in
a CDK infrastructure project. Those projects can be in different or the same repository.

## Set up CLD_BUILD

`npm i --dev cdk_lambda_deployer_js`

You need to add this configuration to your package.json

```json
{
  "cld": {
    "build": {
      "functionsRelativePath": "src/functions",
      "functionFileName": "function.js",
      "libsRelativePath": "src/libs",
      "functionGroups": ["admin", "customer", "deliverer"],
      "libs": ["db", "util"],
      "functionGroupLibs": {
        "customer": ["util", "db"],
        "deliverer": ["util", "db"]
      },
      "outputRelativePath": "build/cld"
    }
  }
}
```

- _functionsRelativePath_: This property tells CLD where to find the functions that will be the source of the lambda functions.

- _functionFileName_: Default: 'function.js'. This property tells cld what file names inside the functionsRelativePath will be considered to be lambda functions source code.
  Note: Only one file will be deployed to the lambda function.

- _libsRelativePath_: This property tells CLD where the files are located for the lambda layers. You can use this for you project libraries.

- _functionGroups_: These are the sub-folder names inside the _functionsRelativePath_ that will be scanned for files with name _functionFileName_.
  These will be used as function name prefixes as well.

- _libs_: Like the _entityNames_, these are the sub-folder names inside the _libsRelativePath_ that will be scanned for the files to be the source of the layers.

- _functionGroupLibs_: It determines a function groups to libs mapping. It will help to define the layers that will get attached to the lambda functions.

- _outputRelativePath_: Default: 'build/cld'. This folder will be used to save the generated the lambda functions and layers source files. We recommend that you ignore
  this file in your source code control.

Your _outputRelativePath_ folder will end up with two sub-folders: _functions_ and _libs_.
Functions will be the source of the lambda functions.
Libs will be the source of the lambda layers.

Supposing your project looks like this:

```text
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
```

And

- _functionsRelativePath_ is: "src/functions"

- _functionFileName_ is: "function.js"

- _libsRelativePath_ is: "src/libs"

- _functionGroups_ is: ["customer", "deliverer"]

- _libs_ is: ["db", "util"]

- _functionGroupLibs_: {"customer": ["util", "db"], "deliverer": ["util", "db"]}

- _outputRelativePath_ is: "build/cld"

Then, a new "build/cld" folder will be created with this structure:

```text
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
```

In order to manually generate the output, you can run the command `cld_build`.
Note: this output will be used by the CLD_DEPLOY project on its CI workflow.

## Set up CLD_DEPLOY

`npm i --dev cdk_lambda_deployer_js`

You have two options to add the CLD_DEPLOY resources to your CDK project.

1. You can add it as a Constructor on your Stack.

```
new CDKLambdaDeployerConstruct(
      this,
      'CDKLambdaDeployer',
      {
        githubRepoOwner: 'repo_owner',
        githubRepoName: 'repo_name',
        githubRepoCldOutputFolder: 'build/cld',
        githubRepoBranch: 'master',
        githubTokenSecretId: 'github_token_secret_id'
      },
    )
```

2. You can add it as a new stack

```
new cld_deploy.CDKLambdaDeployerStack(app, 'CDKLambdaDeployer', {
    env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
    githubRepoOwner: 'repo_owner',
    githubRepoName: 'repo_name',
    githubRepoCldOutputFolder: 'build/cld',
    githubRepoBranch: 'master',
    githubTokenSecretId: 'github_token_secret_id'
})
```

This CLD_DEPLOY project has a CodeBuild resource that will use the GitHub repo info to build the lambda and layers
based on the zip files and metadata generated by the CLD_BUILD library.
