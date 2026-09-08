<!-- mdscript: use the mdscript-exec skill or read [spec.md](../../../../../spec.md) -->
# Deploy

A reusable deploy + verify step. Expects `{{artifact}}`, `{{environment}}`, and
`{{deploy_url}}` to be set. Run it directly, or link to it from another workflow.

* deploy `{{artifact}}` to `{{environment}}`

* if the deploy succeeds
  * notify the team
  * run a health check against `{{deploy_url}}/health`, retrying up to 3 times
    * if a health check passes, mark the deploy complete and report success
    * if all 3 health checks fail, roll back and notify the team

* if the deploy fails
  * roll back to the previous version
  * notify the team that the deploy failed
