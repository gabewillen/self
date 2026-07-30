<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Audit Tests And Deps

* prefer tests that prove **graph-owned** outcomes (guards/choice paths) over tests that only assert helper branch tables
* flag missing coverage of mutually exclusive guarded outcomes / choice else as `P2`
* framework module pins (e.g. grantt hsm.go version) only if `grantt` overlay is active — secondary `P1`/`P0` project policy, not UML
* append findings; keep UML vs project-policy severities distinct in summary
* return to the caller
