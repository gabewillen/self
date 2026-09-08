<!-- mdscript: use the mdscript-exec skill or read [spec.md](../spec.md) -->

## Name Service

* if `{{service_name}}` is empty
  * ask the user for a name

* if `{{service_name}}` contains spaces or uppercase
  * warn and ask for a kebab-case name
    * [Name Service](#name-service)

* set `{{service_path}}` to `services/{{service_name}}`

## Choose Language

* ask the user for `{{language}}`:
  * 1) Go
  * 2) TypeScript
  * 3) Rust
  * 4) other

* if `{{language}}` is other
  * ask the user to specify a custom runtime

* set `{{language_config}}` based on `{{language}}`

## Pick Stack

* ask the user for `{{database}}`:
  * 1) PostgreSQL
  * 2) SQLite
  * 3) none

* ask the user for `{{messaging}}`:
  * 1) Kafka
  * 2) NATS
  * 3) none

* ask the user for `{{http_framework}}`:
  * 1) use a framework (ask which one)
  * 2) raw server

## Configure Deployment

* ask the user for `{{deploy_target}}`:
  * 1) Kubernetes
  * 2) Lambda
  * 3) Docker Compose

* if `{{deploy_target}}` is Kubernetes
  * ask if they need a `{{helm_chart}}`
  * 1) yes
  * 2) no

* if `{{deploy_target}}` is Lambda
  * ask for `{{memory_size}}` in MB

* ask if the service exposes a `{{health_endpoint}}`
  * 1) yes
  * 2) no

## Scaffold

* create `{{service_path}}/README.md` with a service description
* create a language-specific entrypoint per `{{language_config}}`

* if `{{deploy_target}}` is Kubernetes
  * create a `Dockerfile` and a deployment manifest
* if `{{deploy_target}}` is Lambda
  * create `serverless.yml` with `{{memory_size}}`

* if `{{database}}` is set
  * add a database connection module
* if `{{messaging}}` is set
  * add a message producer/consumer stub

* ask the user if they want to initialize git
  * 1) yes; run `git init`
  * 2) no

## Verify

* ask the user if they want to run `{{service_name}}` locally now
  * 1) yes; start the service in development mode
  * 2) no; print the scaffold summary
