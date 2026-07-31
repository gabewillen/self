# check-patterns

Heuristics only — confirm before filing. Graph rules (ST, RC, HI) come from `graph.json`, not from
these scans. Substitute the scope path for `{{scope}}`.

## Actor boundary (AC)

```bash
# machine data touched from outside a behavior; getters over machine-owned fields
rg -n 'func \([a-z]+ \*?[A-Z][A-Za-z]*\) (Get|Current|State|Attributes?)\b' {{scope}}
# locks on a machine type — evidence of out-of-step access
rg -n 'sync\.(Mutex|RWMutex|Map)|std::mutex|lock\(' {{scope}}
# reading another actor's state to decide something
rg -n '(Snapshot|State)\s*\([^)]*\)[^;\n]*(==|switch|if |Contains|HasPrefix)' {{scope}}
```

## Control flow hidden in behaviors (CF)

```bash
rg -n 'if\s*\(|else if|switch\s*\(|\?[^\n]*:' {{scope}}
rg -n 'dispatch|process_event|send\(' {{scope}}   # branch → dispatch pairs
```

## Time and async (TM, BH)

```bash
rg -n 'Sleep\(|setTimeout|setInterval|time\.After|NewTicker|AfterFunc|std::this_thread::sleep' {{scope}}
```

## Concurrency (CN)

```bash
rg -n 'orthogonal|parallel region|Region\(|Parallel\(' {{scope}}
```

## Finding template

```json
{
  "severity": "P0",
  "rule_id": "AC-02",
  "overlay_id": "optional project rule id",
  "location": "path:line",
  "summary": "Router reads the conversation actor's state to pick the next event",
  "evidence": "if snap.State == \"/awaiting\" { dispatch(next) }",
  "remediation": "Request the decision with an event; let the machine own the branch",
  "binding_note": "optional API hint, version-checked"
}
```
