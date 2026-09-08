<!-- mdscript: use the mdscript-exec skill or read [spec.md](../../../../spec.md) -->
# Deploy Branch

Deploy a branch to an environment after checks, then verify health.

## Select Branch

* if `{{branch}}` is empty
  * ask the user which branch to deploy, set `{{branch}}`
  * [Select Branch](#select-branch)

* if `{{branch}}` is `main`
  * warn that deploying `main` requires approval
  * ask the user to confirm
    * if they decline, stop and report that the deploy was not approved

## Run Checks

* run `npm run typecheck`
  * if it fails, stop and report the type errors

* run `npm run test -- --coverage`
  * if coverage is below 80%
    * warn the user that coverage is low
    * ask whether to proceed anyway
      * if they decline, stop and report that the deploy was cancelled

## Build Artifact

* run `npm run build`
  * if it fails, [Run Checks](#run-checks)

* set `{{artifact}}` to `dist/{{branch}}-{{timestamp}}.tar.gz`, replacing any `/` in `{{branch}}` with `-`

## Deploy

* deploy `{{artifact}}` to `{{environment}}`

* if the deploy succeeds
  * notify the team in Slack
  * [Verify Deployment](#verify-deployment)

* if the deploy fails
  * roll back to the previous version
  * notify the team that the deploy failed and was rolled back
  * [Select Branch](#select-branch)

## Verify Deployment

* run a health check against `{{deploy_url}}/health`, retrying up to 3 times

* if a health check passes
  * mark the deploy complete and report success

* if all 3 health checks fail
  * roll back to the previous version
  * notify the team that verification failed and was rolled back
  * [Select Branch](#select-branch)
