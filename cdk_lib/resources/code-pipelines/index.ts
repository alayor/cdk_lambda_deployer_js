import * as cdk from 'aws-cdk-lib'
import MainConstruct, { MainConstructProps } from 'cdk_lib/context/main-construct'
import { Construct } from 'constructs'
import * as codepipeline from 'aws-cdk-lib/aws-codepipeline'
import * as codepipeline_actions from 'aws-cdk-lib/aws-codepipeline-actions'
import { CodeBuildProjectType } from 'cdk_lib/context/resource-types'

export type CodePipelinesConstructProps = MainConstructProps & {
  githubRepoOwner: string
  githubRepoName: string
  githubRepoBranch?: string
  githubTokenSecretId: string
}

export class CodePipelinesConstruct extends MainConstruct {
  constructor(scope: Construct, id: string, props: CodePipelinesConstructProps) {
    super(scope, id, props)
    const { context } = props
    const { githubTokenSecretId, githubRepoOwner, githubRepoName, githubRepoBranch } = props
    const codeBuildProject = context.getCodeBuildProject(CodeBuildProjectType.DEPLOY)

    const pipeline = new codepipeline.Pipeline(this, 'Pipeline', {
      pipelineName: 'cld-pipeline',
      crossAccountKeys: false,
    })

    const oauth = cdk.SecretValue.secretsManager(githubTokenSecretId)

    const sourceAction = new codepipeline_actions.GitHubSourceAction({
      actionName: 'Source',
      owner: githubRepoOwner,
      repo: githubRepoName,
      branch: githubRepoBranch || 'main',
      oauthToken: oauth,
      output: codepipeline.Artifact.artifact('SourceArtifact'),
    })

    const buildAction = new codepipeline_actions.CodeBuildAction({
      actionName: 'Build',
      input: codepipeline.Artifact.artifact('SourceArtifact'),
      project: codeBuildProject,
    })

    pipeline.addStage({
      stageName: 'Source',
      actions: [sourceAction],
    })

    pipeline.addStage({
      stageName: 'Build',
      actions: [buildAction],
    })
  }
}
