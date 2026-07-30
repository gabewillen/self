<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Check Indirection

* for every layer the change adds, keeps, or moves — wrapper, forwarder, alias, re-export, adapter, facade, helper, subclass, interface, factory, config hop, or MDScript state that only runs another — require it to pass one of two tests:
  * **it computes something**: derives a value, branches, validates, enforces an invariant, converts a type, or absorbs a failure the caller would otherwise handle
  * **it removes duplication**: two or more call sites in the current tree would otherwise repeat the same logic

* count call sites and implementers in the current tree, not in the author's stated plan

* add a finding for any layer that passes neither test, naming the layer, every call site, and the direct call that replaces it

* add a finding for each of these, which compute nothing by construction:
  * a function, method, or module that forwards its arguments unchanged to exactly one callee
  * a rename, alias, or re-export of something already reachable at the call site
  * an interface, protocol, or base class with exactly one implementer
  * a parameter, flag, or config key that holds one value at every call site
  * a variable or constant read once, immediately, at its only use

* add a finding for ceremony — structure that exists to look complete rather than to do work:
  * a getter or setter that only returns or assigns a field the caller can reach
  * a constructor, factory, or builder that only assigns its arguments
  * an override that only calls its parent
  * a `try`/`catch` that rethrows unchanged, or an error wrapped with no added context
  * a type that wraps one field and adds no invariant
  * a test that asserts the wrapper forwards, rather than asserting behavior

* reject `for consistency`, `so we can swap it later`, `to keep the API stable`, `for testability`, and `it matches the other module` as justification when the change adds no second implementer and no second call site

* require the author to name the second call site or the computation, and add a finding when they name neither

* grade `P2` by default, and `P1` when the layer hides a failure path, an error, or a control-flow decision from its callers

* do not demand removal when inlining would copy the same logic to two or more places

* do not report an MDScript state that is a documented re-entry point for another agent, even when one state runs one workflow

* return to the caller
