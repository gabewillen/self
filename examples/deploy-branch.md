<!-- mdscript: use the mdscript-exec skill or read [spec.md](../spec.md) -->

## Select Branch

* if `{{branch}}` is empty
  * ask the user for the branch name to deploy
  * [Select Branch](#select-branch)

* if `{{branch}}` is `main`
  * warn that deploying main requires approval
  * ask for confirmation before proceeding

## Run Checks

* run `npm run typecheck`
  * if it fails, stop and report errors

* run `npm run test -- --coverage`
  * if coverage is below 80%, warn the user
  * ask if they want to proceed anyway

## Build Artifact

* run `npm run build`
  * if it fails [Run Checks](#run-checks)

* set `{{artifact}}` to `dist/{{branch}}-{{timestamp}}.tar.gz`

## Deploy

* deploy `{{artifact}}` to `{{environment}}`

* if deployment succeeds
  * notify the team in Slack
  * [Verify Deployment](#verify-deployment)

* if deployment fails
  * rollback to the previous version
  * notify the team
  * [Select Branch](#select-branch)

## Verify Deployment

* run health check against `{{deploy_url}}/health`

* if the health check passes
  * mark the deploy as complete

* if the health check fails after 3 retries
  * trigger rollback
  * [Select Branch](#select-branch)
