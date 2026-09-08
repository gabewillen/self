# LLM Scripting Benchmark Results

- Executor model: `gpt-5.5` via `openai`
- Judge model: `gpt-5.5` via `openai`
- Execution runs per artifact: `3`
- Judgments per execution: `3`
- Run started: `2026-06-16T17:59:18+00:00`
- System group: `probabilistic`
- Cases: release_notes, deploy_branch, onboard_service

## Overall Averages

| Rank | System | Overall | Task Success | Requirements Met | Failure Recovery | Std Dev | Judgments |
| ---: | --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 1 | MDScript | 9.73 | 9.89 | 9.67 | 9.33 | 0.35 | 27 |
| 2 | Guidance | 9.67 | 9.81 | 9.59 | 9.37 | 0.36 | 27 |
| 3 | ell | 9.65 | 9.78 | 9.63 | 9.30 | 0.37 | 27 |
| 4 | LMQL | 9.65 | 9.81 | 9.56 | 9.30 | 0.39 | 27 |

## Case Winners

- `release_notes`: LMQL (9.73)
- `deploy_branch`: ell (9.71)
- `onboard_service`: MDScript (9.93)

## Judge Notes By System

### MDScript
The execution completed the staging deployment successfully and handled the relevant health-check retry path, with only untriggered contingency behavior supported by stated evidence rather than observed execution. The execution satisfies the scenario end-to-end and provides evidence for all explicit criteria, with health recovery succeeding on the third attempt. The execution satisfies the scenario end-to-end, including ordered checks, build, deployment, and health-check retry behavior.

### Guidance
The execution completed the scenario correctly, with only conditional requirements outside this scenario left unproven by the evidence. The execution matches the provided scenario end-to-end, including ordered checks, artifact creation, deployment, and successful health-check recovery. The result fully satisfies the scenario, including ordered typecheck and coverage, timestamped artifact deployment, and health recovery on the third attempt.

### ell
The scenario was completed end-to-end with correct ordering and health retry behavior, with only untriggered contingency paths limiting confidence slightly. The produced result matches the scenario end-to-end and provides evidence for all explicit success criteria, with the relevant health-check recovery exercised. The result matches the scenario very well, with only unexercised contingency paths and placeholder timestamp evidence limiting full credit.

### LMQL
The execution completes the staging feature-branch deployment scenario successfully, with only minor uncertainty around unexercised conditional requirements. The run satisfies the scenario end-to-end, with only minor uncertainty around untriggered conditional paths and the placeholder timestamp. The run matches the scenario well, including successful checks, timestamped artifact creation, staging deployment, and recovery after two failed health checks.
