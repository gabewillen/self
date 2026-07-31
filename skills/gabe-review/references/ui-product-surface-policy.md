# UI and product surface policy

Apply when the artifact changes or claims a UI, frontend, dashboard, widget, or other user-visible product surface.

## Require

- a current visual snapshot from the real browser or device target for each changed or claimed feature
- inspection of each snapshot connected to the feature claim

## Treat as claims

Every visible button, table, graph, widget, workflow, empty state, breakpoint, CLI command, and target selector is a claim that needs per-feature proof.

## Reject as per-feature UI proof

- a single broad screenshot covering many features
- DOM-only assertion
- unique-selector test without visual evidence
- uninspected snapshot
- stale snapshot
- mock-backed route presented as final UI proof
