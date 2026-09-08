"""Interactively scaffold a new service from language, stack, and deployment choices.

Idiomatic ell: the interactive choices go through small Language Model Programs
(`pick`, `ask`); deterministic scaffolding is plain Python.
"""

import os
import re
import subprocess

import ell


@ell.simple(model="gpt-4o")
def pick(question: str, options: list[str]) -> str:
    """Answer with exactly one of the given options."""
    return f"{question} Options: {', '.join(options)}"


@ell.simple(model="gpt-4o")
def ask(question: str) -> str:
    """Answer concisely with just the value."""
    return question


def write(path, body):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w") as f:
        f.write(body)


def onboard_service(service_name=""):
    # Name Service
    while not service_name or re.search(r"[A-Z ]", service_name):
        if service_name:
            print("Service name must be kebab-case.")
        service_name = ask("Service name?").strip()
    service_path = f"services/{service_name}"

    # Choose Language
    language = pick("Language?", ["Go", "TypeScript", "Rust", "other"]).strip()
    language_config = ask("Custom runtime?").strip() if language == "other" else language

    # Pick Stack
    database = pick("Database?", ["PostgreSQL", "SQLite", "none"]).strip()
    messaging = pick("Messaging?", ["Kafka", "NATS", "none"]).strip()
    http = pick("HTTP layer?", ["framework", "raw server"]).strip()

    # Configure Deployment
    deploy_target = pick("Deploy target?", ["Kubernetes", "Lambda", "Docker Compose"]).strip()
    helm = deploy_target == "Kubernetes" and pick("Helm chart?", ["yes", "no"]).strip() == "yes"
    memory_size = ask("Lambda memory (MB)?").strip() if deploy_target == "Lambda" else None
    health = pick("Expose a health endpoint?", ["yes", "no"]).strip() == "yes"

    # Scaffold
    write(f"{service_path}/README.md", f"# {service_name}\n\nRuntime: {language_config}\n")
    write(f"{service_path}/{entrypoint_name(language_config)}", entrypoint_body(language_config, health))
    if deploy_target == "Kubernetes":
        write(f"{service_path}/Dockerfile", dockerfile(language_config))
        write(f"{service_path}/k8s/deployment.yaml", k8s_manifest(service_name, helm))
    elif deploy_target == "Lambda":
        write(f"{service_path}/serverless.yml", serverless_yml(service_name, memory_size))
    elif deploy_target == "Docker Compose":
        write(f"{service_path}/docker-compose.yml", compose_yml(service_name))
    if database != "none":
        write(f"{service_path}/db.py", db_module(database))
    if messaging != "none":
        write(f"{service_path}/messaging.py", messaging_stub(messaging))

    if pick("Initialize git?", ["yes", "no"]).strip() == "yes":
        subprocess.run(["git", "init"], cwd=service_path)

    # Verify
    if pick("Run the service locally now?", ["yes", "no"]).strip() == "yes":
        subprocess.run(dev_command(language_config), cwd=service_path, shell=True)
        return "running in development mode"
    return f"scaffolded {service_path}: {language_config}, db={database}, mq={messaging}, deploy={deploy_target}"
