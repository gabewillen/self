<!-- mdscript: use the mdscript-exec skill or read [spec.md](../spec.md) -->

## Setup Service Name

* if `{{service_name}}` is empty
  * infer `{{service_name}}` from the input

* set `{{service_path}}` to `src/services/{{service_name}}`

* if `{{service_path}}` already exists
  * ask the user to provide a different name
    * [Setup Service Name](#setup-service-name)

## Create Interface

* create `{{service_path}}.ts`
* define an interface `{{service_name}}Service` with:
  * a `create` method
  * a `get` method
  * a `list` method

## Implement Service

* create `{{service_path}}-impl.ts`
* implement `{{service_name}}Service` following [Service Template](../templates/service.template.md)

* create `{{service_path}}-test.ts`
  * write unit tests for each method
  * mock the data layer

## Register Service

* add the service to the dependency injection container in `src/di/index.ts`

* verify `npm run typecheck` passes
  * if not [Implement Service](#implement-service)
