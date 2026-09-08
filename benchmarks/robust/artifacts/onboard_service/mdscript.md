<!-- mdscript: use the mdscript-exec skill or read [spec.md](../../../../spec.md) -->
# Onboard Service

Interactively scaffold a new service from language, stack, and deployment choices.

## Name Service

* if `{{service_name}}` is empty
  * ask the user for a service name, set `{{service_name}}`

* if `{{service_name}}` contains spaces or uppercase letters
  * warn that the name must be kebab-case
  * ask for a kebab-case name and set `{{service_name}}`
  * [Name Service](#name-service)

* set `{{service_path}}` to `services/{{service_name}}`

## Choose Language

* ask the user for a language: Go, TypeScript, Rust, or other
  * if other, ask for a custom runtime

* set `{{language_config}}` from the chosen language or custom runtime

## Pick Stack

* ask for a database: PostgreSQL, SQLite, or none, and set `{{database}}`
* ask for messaging: Kafka, NATS, or none, and set `{{messaging}}`
* ask whether to use an HTTP framework or a raw server

## Configure Deployment

* ask for a deployment target: Kubernetes, Lambda, or Docker Compose, and set `{{deploy_target}}`

* if `{{deploy_target}}` is Kubernetes, ask whether a Helm chart is needed
* if `{{deploy_target}}` is Lambda, ask for `{{memory_size}}` in MB

* ask whether the service exposes a health endpoint

## Scaffold

* create `{{service_path}}/README.md` describing the service
* create a language-specific entrypoint from `{{language_config}}`

* if `{{deploy_target}}` is Kubernetes, create a Dockerfile and a deployment manifest
* if `{{deploy_target}}` is Lambda, create `serverless.yml` using `{{memory_size}}`
* if `{{deploy_target}}` is Docker Compose, create `docker-compose.yml`

* if `{{database}}` is not none, add a database connection module
* if `{{messaging}}` is not none, add a producer/consumer stub

* ask whether to initialize git
  * if yes, run `git init` in `{{service_path}}`

## Verify

* ask whether to run the service locally now
  * if yes, start the service in development mode
  * if no, print a summary of the scaffold
