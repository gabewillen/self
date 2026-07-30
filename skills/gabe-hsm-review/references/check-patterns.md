# check-patterns (UML-first)

Heuristics only — confirm before filing. Prefer UML rule ids.

## Control-flow smells in behaviors

```bash
# conditionals that often hide graph decisions (confirm in entry/exit/effect/activity/guard)
rg -n 'if\s*\(|else if|switch\s*\(|\?[^\n]*:' {{scope}}

# success/fail dispatch pairs inside behaviors
rg -n 'dispatch|process_event|send\(' {{scope}}
```

## Hierarchy duplication

```bash
# repeated event names — manually cluster by sibling states
rg -n 'On\(|on:|event<|after\(|when\(' {{scope}}
```

## Time / async

```bash
rg -n 'Sleep\(|setTimeout|setInterval|time\.After|time\.Sleep|NewTicker' {{scope}}
```

## Finding template

```json
{
  "severity": "P0",
  "rule_id": "CF-02",
  "dialect": "generic",
  "location": "path:line",
  "summary": "Effect branches success vs failure with if",
  "evidence": "if ok { ... } else { ... }",
  "remediation": "Model outcomes as choice/guarded transitions; keep effect side-effect free",
  "framework_note": "optional local API hint"
}
```
