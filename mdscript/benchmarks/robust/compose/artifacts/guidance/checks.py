"""Reusable check gate (shared module)."""

import subprocess

import guidance
from guidance import models, select

lm = models.OpenAI("gpt-4o")


@guidance
def confirm(lm, question):
    lm += f"{question} (yes/no): " + select(["yes", "no"], name="answer")
    return lm


def sh(cmd):
    return subprocess.run(cmd, shell=True, text=True, capture_output=True)


def run_checks(state):
    if sh("npm run typecheck").returncode:
        state["checks_ok"] = False
        state["reason"] = "type errors"
        return state
    cov = read_coverage(sh("npm run test -- --coverage").stdout)
    if cov < 80 and (lm + confirm(f"Coverage {cov}% is below 80%. Proceed?"))["answer"] == "no":
        state["checks_ok"] = False
        state["reason"] = "checks did not pass"
        return state
    state["coverage"] = cov
    state["checks_ok"] = True
    return state
