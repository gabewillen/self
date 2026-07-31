<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Check Publication Hygiene

* read [Publication Hygiene Policy](../references/publication-hygiene-policy.md)
* if the artifact is not public writing, documentation, issue/MR/PR text, release notes, dashboard text, or a decision record
  * return to the caller
* inspect the artifact for portable, sanitized content
* if local filesystem paths are present
  * add a finding with consequence and evidence pointer
* if private endpoints are present
  * add a finding with consequence and evidence pointer
* if secrets are present
  * add a finding with consequence and evidence pointer
* if unredacted customer data is present
  * add a finding with consequence and evidence pointer
* if raw transcript dumps are present
  * add a finding with consequence and evidence pointer
* if command-log prose is present
  * add a finding with consequence and evidence pointer
* if the author's own actions are masked in third person
  * add a finding with consequence and evidence pointer
* inspect the publication surface's own metadata contract
* for each required metadata field the artifact is missing
  * add a finding naming the surface contract and the missing field
* return to the caller
