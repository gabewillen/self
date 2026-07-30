# check-patterns

Heuristic scans. Every hit needs human/context confirmation before a finding.

## hsm.go / Go

```bash
# inventory
rg -n 'hsm\.Define\(|hsm\.State\(|hsm\.Initial\(|hsm\.Choice\(' {{scope}}

# timers outside machine-owned API
rg -n 'time\.(Sleep|After|NewTicker|Tick)\(|time\.Now\(' {{scope}}

# sync smells
rg -n 'sync\.(Mutex|RWMutex)|atomic\.' {{scope}}

# completion / error kinds
rg -n 'CompletionEventKind|ErrorEventKind|Kind:\s*hsm\.' {{scope}}

# naming
rg -n 'hsm_[A-Za-z]|_hsm\b|type\s+\w*[Hh]sm\w+' {{scope}}

# defer / after hooks misuse
rg -n 'hsm\.After(Process|Dispatch|Entry|Exit|Executed)\(' {{scope}}

# module pin (grantt)
rg -n 'github.com/stateforward/hsm.go' **/go.mod
```

## sml.cpp / emel

```bash
rg -n 'make_transition_table|sml::sm<|process_event\(' {{scope}}
rg -n 'process_queue|defer_queue' {{scope}}
rg -n 'sml::unexpected_event|event<sml::_>' {{scope}}
# actions/detail branching — confirm file is actions/detail/member path
rg -n '^\s*if\s*\(|^\s*switch\s*\(|\?[^\n]*:' {{scope}}/**/actions.hpp {{scope}}/**/detail.hpp {{scope}}/**/detail.cpp
```

## Finding template

```json
{
  "severity": "P0",
  "rule_id": "G-TIME",
  "dialect": "hsm.go",
  "location": "path/file.go:123",
  "summary": "time.Sleep inside activity",
  "evidence": "time.Sleep(time.Second)",
  "remediation": "Replace with hsm.After/Every on a transition from a real state"
}
```
