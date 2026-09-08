# Robust Scripting Benchmark Results

- Executor: `claude-haiku` (neutral; MDScript runs also read the spec)
- Judge: `claude-sonnet` (blind: sees only the produced trace, never the artifact or system name)
- Scenarios: 16 branch-forcing scenarios across 3 cases; REPEATS=2 → 32 runs/system, 128 total
- Primary metric: deterministic checklist coverage (observable behaviors). Secondary: blind judge 1-10.

## Overall

| System | Checklist % (primary) | Checklist sd | Blind judge (secondary) | n |
| --- | ---: | ---: | ---: | ---: |
| mdscript | 100 | 0 | 9.00 | 32 |
| lmql | 100 | 0 | 8.66 | 32 |
| ell | 96.1 | 15.9 | 8.06 | 32 |
| guidance | 95.8 | 18.2 | 8.28 | 32 |

## Checklist % by case

| Case | mdscript | guidance | lmql | ell |
| --- | ---: | ---: | ---: | ---: |
| deploy_branch | 100 | 100 | 100 | 100 |
| release_notes | 100 | 87.5 | 100 | 100 |
| onboard_service | 100 | 96.7 | 100 | 87.7 |

## Checklist failures (the only sub-100% runs)

- **guidance / release_notes / regenerate_once** (repeat 1): 0/2
  - missed: writes the changelog again on regenerate
  - missed: stops after the user declines a second regenerate
- **guidance / onboard_service / kebab_reject_then_fix** (repeat 1): 2/3
  - missed: warns the name must be kebab-case and re-asks
- **ell / onboard_service / ts_k8s_helm_postgres_kafka** (repeat 2): 1/6
  - missed: writes a Dockerfile for Kubernetes
  - missed: writes a k8s deployment manifest
  - missed: adds a database module for PostgreSQL
  - missed: adds a messaging stub for Kafka
  - missed: initializes git when requested
- **ell / onboard_service / rust_lambda_nostack_run** (repeat 2): 3/5
  - missed: writes serverless.yml for Lambda
  - missed: starts the service locally when asked

## Checklist↔judge disagreements (passed behaviors, but judge ≤6 on quality)

Count by system: ell=5, mdscript=1, guidance=5, lmql=4 (total 15).
Concentrated in `onboard_service` for the code systems; MDScript had 1.

