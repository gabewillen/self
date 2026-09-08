"""Interactively scaffold a new service from language, stack, and deployment choices.

Idiomatic Guidance: the model drives the interactive choices through `select`
and `gen`; deterministic file scaffolding is plain Python.
"""

import os
import re
import subprocess

import guidance
from guidance import models, gen, select

lm = models.OpenAI("gpt-4o")


@guidance
def pick(lm, question, options):
    lm += f"{question} " + select(options, name="choice")
    return lm


@guidance
def ask(lm, question):
    lm += f"{question} " + gen("answer", stop="\n")
    return lm


def write(path, body):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w") as f:
        f.write(body)


def onboard_service(service_name=""):
    # Name Service
    while not service_name or re.search(r"[A-Z ]", service_name):
        if service_name:
            print("Service name must be kebab-case.")
        service_name = (lm + ask("Service name?"))["answer"].strip()
    service_path = f"services/{service_name}"

    # Choose Language
    language = (lm + pick("Language?", ["Go", "TypeScript", "Rust", "other"]))["choice"]
    language_config = language
    if language == "other":
        language_config = (lm + ask("Custom runtime?"))["answer"].strip()

    # Pick Stack
    database = (lm + pick("Database?", ["PostgreSQL", "SQLite", "none"]))["choice"]
    messaging = (lm + pick("Messaging?", ["Kafka", "NATS", "none"]))["choice"]
    http = (lm + pick("HTTP layer?", ["framework", "raw server"]))["choice"]

    # Configure Deployment
    deploy_target = (lm + pick("Deploy target?", ["Kubernetes", "Lambda", "Docker Compose"]))["choice"]
    helm = deploy_target == "Kubernetes" and (lm + pick("Helm chart?", ["yes", "no"]))["choice"] == "yes"
    memory_size = (lm + ask("Lambda memory (MB)?"))["answer"].strip() if deploy_target == "Lambda" else None
    health = (lm + pick("Expose a health endpoint?", ["yes", "no"]))["choice"] == "yes"

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

    if (lm + pick("Initialize git?", ["yes", "no"]))["choice"] == "yes":
        subprocess.run(["git", "init"], cwd=service_path)

    # Verify
    if (lm + pick("Run the service locally now?", ["yes", "no"]))["choice"] == "yes":
        subprocess.run(dev_command(language_config), cwd=service_path, shell=True)
        return "running in development mode"
    return f"scaffolded {service_path}: {language_config}, db={database}, mq={messaging}, deploy={deploy_target}"
