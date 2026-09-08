<!-- mdscript: use the mdscript-exec skill or read [spec.md](../../../../../spec.md) -->
# Ship Feature

## Select Branch

* if `{{branch}}` is empty
  * ask which feature branch to deploy, set `{{branch}}`

## Checks

* run [Run Checks](./checks.md)
  * if checks did not pass, stop and report

## Build

* run `npm run build`
  * if it fails, stop and report the build error
* set `{{artifact}}` to `dist/{{branch}}-{{timestamp}}.tar.gz`

## Deploy

* set `{{environment}}` to `staging`
* run [Deploy](./deploy.md)
