<!-- mdscript: use the mdscript-exec skill or read [spec.md](../../../../../spec.md) -->
# Hotfix

## Confirm

* warn that this deploys a hotfix straight to production
* ask the user to confirm
  * if they decline, stop and report that the hotfix was cancelled

## Checks

* run [Run Checks](./checks.md)
  * if checks did not pass, stop and report

## Build

* run `npm run build`
  * if it fails, stop and report the build error
* set `{{artifact}}` to `dist/{{branch}}-hotfix-{{timestamp}}.tar.gz`

## Deploy

* set `{{environment}}` to `production`
* run [Deploy](./deploy.md)
