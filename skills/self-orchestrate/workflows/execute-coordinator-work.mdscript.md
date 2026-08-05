<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Execute Coordinator Work

* make the smallest evidence-led coordination, triage, publication, instruction, or decision change that satisfies `{{objective}}`
* [Enforce Coordinator Boundaries](#enforce-coordinator-boundaries)

## Enforce Coordinator Boundaries

* do not personally edit application code from the root coordinator when acting from the user's direction
* do not perform code reviews or spawn code reviewers from the root coordinator
* do not hand `/self-review` or the full self-review skill to a worker subagent; the only top-level skill delegated to workers is `/self-implement`
* review lane fanout is owned by the implementer process (or a main-agent goal/orchestrator that itself can spawn), never nested under a self-review subagent
* if application-code implementation or code-review ownership is required
  * [Create Implementer Lane](create-implementer-lane.mdscript.md#create-implementer-lane)
* prefer optionality, reversible choices, explicit contracts, real proof, and decision-ready questions
* run [Report Status](../../self-common/workflows/report-boundary.mdscript.md#report-status)
