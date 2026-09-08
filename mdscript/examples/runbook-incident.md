<!-- mdscript: use the mdscript-exec skill or read [spec.md](../spec.md) -->

## Triage

* if `{{incident_description}}` is empty
  * ask for a description of the problem

* classify severity `{{severity}}`:
  * SEV1: users are blocked or data is lost
  * SEV2: a feature is degraded
  * SEV3: cosmetic or minor issue

* if `{{severity}}` is SEV1
  * page the on-call engineer
  * [Create Incident Channel](#create-incident-channel)

## Create Incident Channel

* create a Slack channel `#inc-{{timestamp}}`
* post `{{incident_description}}` and `{{severity}}`

* invite `{{on_call_engineer}}` and `{{team}}`

* [Gather Evidence](#gather-evidence)

## Gather Evidence

* collect recent deploy logs from `{{deploy_service}}`

* check `{{monitoring_dashboard}}` for anomalies in the last hour

* check `{{error_tracker}}` for new errors matching the description

* [Identify Root Cause](#identify-root-cause)

## Identify Root Cause

* analyze evidence to determine `{{root_cause}}`

* if `{{root_cause}}` is unknown after 15 minutes
  * escalate to `{{senior_engineer}}`
  * [Escalate](#escalate)

* if `{{root_cause}}` is known
  * propose `{{fix_plan}}`
  * ask the incident commander to approve
    * if approved [Apply Fix](#apply-fix)
    * if rejected [Identify Root Cause](#identify-root-cause)

## Apply Fix

* implement `{{fix_plan}}`

* verify the fix resolves the issue

* update the incident channel with the resolution

## Escalate

* hand off to `{{senior_engineer}}`
* provide all evidence collected so far
* [Gather Evidence](#gather-evidence) on handoff

## Postmortem

* after the incident is resolved
  * write a postmortem at `docs/postmortems/{{timestamp}}-{{incident_slug}}.md`
  * schedule a review meeting with `{{team}}`
