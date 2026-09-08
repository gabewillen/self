"""Collect commits in a range, categorize them, and write CHANGELOG.md.

Idiomatic ell: the model boundary is a small Language Model Program (`confirm`);
the git, categorization, and file work is ordinary Python.
"""

import subprocess

import ell


@ell.simple(model="gpt-4o")
def confirm(question: str) -> str:
    """Answer strictly 'yes' or 'no'."""
    return question


def sh(cmd):
    return subprocess.run(cmd, shell=True, text=True, capture_output=True)


def generate_release_notes(git_range=""):
    while True:
        # Gather Changes
        if not git_range:
            last_tag = sh("git describe --tags --abbrev=0").stdout.strip()
            git_range = f"{last_tag}..HEAD"
        subjects = sh(f"git log --pretty=%s {git_range}").stdout.splitlines()

        # Categorize Commits
        features, fixes, chores = [], [], []
        for s in subjects:
            if s.startswith(("feat:", "feature:")):
                features.append(s)
            elif s.startswith(("fix:", "bug:")):
                fixes.append(s)
            else:
                chores.append(s)

        # Generate Notes (only nonempty sections)
        doc = []
        for title, items in (("Features", features), ("Bug Fixes", fixes), ("Maintenance", chores)):
            if items:
                doc.append(f"## {title}\n" + "\n".join(f"- {i}" for i in items))
        with open("CHANGELOG.md", "w") as f:
            f.write("\n\n".join(doc) + "\n")

        if confirm("Regenerate the changelog?").strip().lower().startswith("n"):
            return "CHANGELOG.md written"
        git_range = ""  # recompute the range on regenerate
