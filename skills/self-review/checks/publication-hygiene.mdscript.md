<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Check Publication Hygiene

* read [Publication Hygiene Policy](../references/publication-hygiene-policy.md)
* if the artifact is not public text, documentation, issue/MR/PR text, release notes, dashboard text, or a decision record
  * return to the caller
* examine the artifact for portable, sanitized content
* if local filesystem paths are present
  * add a finding with the consequence and an evidence pointer
* if private endpoints are present
  * add a finding with the consequence and an evidence pointer
* if secrets are present
  * add a finding with the consequence and an evidence pointer
* if unredacted customer data is present
  * add a finding with the consequence and an evidence pointer
* if raw transcript dumps are present
  * add a finding with the consequence and an evidence pointer
* if command-log prose is present
  * add a finding with the consequence and an evidence pointer
* if the artifact hides the actions of the author in the third person
  * add a finding with the consequence and an evidence pointer
* examine the metadata contract of the publication surface
* for each necessary metadata field that the artifact does not have
  * add a finding that names the surface contract and the missing field
* return to the caller
