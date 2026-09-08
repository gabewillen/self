<!-- mdscript: use the mdscript-exec skill or read [spec.md](../spec.md) -->

## Generate Product

* if `{{product_name}}` is empty
  * infer `{{product_name}}` from the input

* set `{{product_path}}` to `.cursor/products/{{product_name}}`

## Setup Product Path

* if `{{product_path}}` doesn't exist
  * get `{{product_path}}` from [Generate Product](../.cursor/commands/generate-product.md)
  * [Setup Feature Name](#setup-feature-name)

* ask the user if they want to add the feature to `{{product_path}}`
  * if yes [Setup Feature Name](#setup-feature-name)
  * if no, ask the user to provide the product name
    * [Setup Product Path](#setup-product-path)

## Setup Feature Name

* if `{{feature_name}}` is empty
  * infer `{{feature_name}}` from the input

* set `{{feature_path}}` to `{{product_path}}/features/{{feature_name}}`

* if `{{feature_path}}` already exists
  * ask the user to provide a different feature name
    * [Setup Feature Name](#setup-feature-name)

* create `{{feature_path}}` directory

## Create Feature File

* create `{{feature_name}}.feature.md` in `{{feature_path}}`
  adhering to [Feature Template](../.cursor/templates/feature.template.md)
