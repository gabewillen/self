<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Execute Coordinator Work

* make the smallest evidence-led coordination, triage, publication, instruction, or decision change that satisfies `{{objective}}`
* [Enforce Coordinator Boundaries](#enforce-coordinator-boundaries)

## Enforce Coordinator Boundaries

* if you act from the direction of the user, do not personally edit application code from the root coordinator
* do not do code reviews from the root coordinator
* do not spawn code reviewers from the root coordinator
* do not give `/self-review` or the full self-review skill to a worker subagent
* delegate only one top-level skill to workers: `/self-implement`
* give the review lane fanout to the implementer process, or to a main-agent goal/orchestrator that can spawn lanes itself
* never put the review lane fanout below a self-review subagent
* if application-code implementation or code-review ownership is necessary
  * [Create Implementer Lane](create-implementer-lane.mdscript.md#create-implementer-lane)
* prefer optionality, reversible choices, explicit contracts, real proof, and decision-ready questions
* run [Report Status](../../self-common/workflows/report-boundary.mdscript.md#report-status)
