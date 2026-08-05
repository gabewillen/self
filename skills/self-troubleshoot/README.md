# self-troubleshoot

Troubleshooting skill. `SKILL.md` is the entry the harness lists; the body is the linked MDScript.

Entry: `/self-troubleshoot`, or `self-troubleshoot.mdscript.md` directly, or via the `self` router.

```text
/mdscript-exec {{skills_root}}/self-troubleshoot/self-troubleshoot.mdscript.md#troubleshoot-reported-issue
```

The loop:

1. **Reproduce with a red test** against the closest *safe* production-like
   surface — live or staging first, then local real services; nothing inside the
   suspect scope may be mocked. A mutating run against a shared or production
   target needs an explicit grant, a test tenant, and a test principal. Defects in
   non-running artifacts (docs, MDScript, config) reproduce with an executable
   artifact check. No reproduction, no fix.
2. **Root-cause analysis** — trace to the earliest wrong point, name the causal
   mechanism, and verify it with a prediction before touching code.
3. **Fix the cause** through `self-implement`, inside the named fix scope, with
   the reproduction test untouched.
4. **Rerun the same reproduction** in the same environment. Green ends the loop;
   red returns to step 2, and repeated red returns to reassessing the
   reproduction itself.

Workflows: [choose-environment.mdscript.md](workflows/choose-environment.mdscript.md) (safe target,
test isolation, fidelity), [reproduce-red-test.mdscript.md](workflows/reproduce-red-test.mdscript.md),
[root-cause-analysis.mdscript.md](workflows/root-cause-analysis.mdscript.md),
[apply-fix-and-rerun.mdscript.md](workflows/apply-fix-and-rerun.mdscript.md).
