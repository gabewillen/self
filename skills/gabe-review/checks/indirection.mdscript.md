<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Check Indirection

* set `{{layers}}` to every wrapper, forwarder, alias, re-export, adapter, facade, helper, subclass, interface, factory, config hop, or MDScript state the change adds, keeps, or moves
* set `{{examined_layers}}` to an empty list
* if `{{layers}}` is empty
  * [Check Ceremony](#check-ceremony)
* [Test The Layer](#test-the-layer)

## Test The Layer

* set `{{layer}}` to the first entry of `{{layers}}` that is not in `{{examined_layers}}`
* append `{{layer}}` to `{{examined_layers}}`
* run a search for every call site of `{{layer}}` in the current tree and set `{{call_sites}}` to the result
* run a search for every implementer of `{{layer}}` in the current tree and set `{{implementers}}` to the result
* set `{{computes}}` to `true` when `{{layer}}` derives a value, branches, validates, enforces an invariant, converts a type, or absorbs a failure its caller would otherwise handle
* set `{{removes_duplication}}` to `true` when `{{call_sites}}` holds two or more sites that would each repeat the same logic without `{{layer}}`
* if `{{computes}}` is `true`
  * [Next Layer](#next-layer)
* if `{{removes_duplication}}` is `true`
  * [Next Layer](#next-layer)
* [Record Indirection Finding](#record-indirection-finding)

## Record Indirection Finding

* set `{{severity}}` to `P1` when `{{layer}}` hides a failure path, an error, or a control-flow decision from its callers
* set `{{severity}}` to `P2` when it does not
* set `{{direct_call}}` to the call that replaces `{{layer}}` at its call sites
* add a finding with `{{severity}}`, `{{layer}}`, `{{call_sites}}`, and `{{direct_call}}`
* ask the author to name the second call site or the computation when neither is visible in the diff
* reject `for consistency`, `so we can swap it later`, `to keep the API stable`, `for testability`, and `it matches the other module` as the answer
* [Next Layer](#next-layer)

## Next Layer

* if `{{layers}}` holds an entry that is not in `{{examined_layers}}`
  * [Test The Layer](#test-the-layer)
* [Check Ceremony](#check-ceremony)

## Check Ceremony

* add a finding for each shape in the change that computes nothing by construction:
  * a function, method, or module that forwards its arguments unchanged to exactly one callee
  * a rename, alias, or re-export of something already reachable at the call site
  * an interface, protocol, or base class with exactly one implementer
  * a parameter, flag, or config key that holds one value at every call site
  * a variable or constant read once, immediately, at its only use
  * a getter or setter that only returns or assigns a field the caller can reach
  * a constructor, factory, or builder that only assigns its arguments
  * an override that only calls its parent
  * a `try`/`catch` that rethrows unchanged, or an error wrapped with no added context
  * a type that wraps one field and adds no invariant
  * a test that asserts a wrapper forwards rather than asserting behavior
* [Guard Against False Removal](#guard-against-false-removal)

## Guard Against False Removal

* drop any finding whose remediation would copy the same logic to two or more places
* drop any finding against an MDScript state that another agent enters by heading
* [Finish Indirection Check](#finish-indirection-check)

## Finish Indirection Check

* return to the caller
