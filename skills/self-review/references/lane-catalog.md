# Review lane catalog

[select-review-lanes.mdscript.md](../workflows/select-review-lanes.mdscript.md) selects lanes from the changed paths of the diff, never from the request narrative. Each selected lane names the path or packet signal that selected it.

| Lane | Entry under `workflows/blind-reviewers/` | Select when |
| --- | --- | --- |
| `rules` | `rules.mdscript.md#rules-blind-review` | Always: repository and agent instruction files |
| `security` | `security.mdscript.md#security-blind-review` | Always |
| `completeness` | `completeness.mdscript.md#completeness-blind-review` | Always: the literal goal |
| `mdscript` | `mdscript.mdscript.md#mdscript-blind-review` | A `SKILL.md` or `*.mdscript.md` is in scope |
| `eng-core` | `eng-core.mdscript.md#eng-core-blind-review` | Executable source changed (alone for a data-only change) |
| `eng-<pack>` | `engineering-rules.mdscript.md#engineering-rules-blind-review` with `{{reviewer_lane}}` set to `eng-<pack>` and `{{rules_pack}}` set to `<pack>` | The pack's "Select when" in the [rule pack catalog](../../self-implement/references/implementation-rules-catalog.md) matches; needs executable source |
| `hsm` | `hsm.mdscript.md#hsm-blind-review` | A state machine is in scope: the deep UML audit of the `hsm/` pack, beside `eng-hsm` |

MDScript heading-and-link control flow alone does not select the HSM lanes. Callers can add lanes with `{{forced_lanes}}` and remove them with `{{excluded_lanes}}`.
