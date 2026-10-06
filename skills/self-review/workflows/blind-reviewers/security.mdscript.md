<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Security Blind Review

* set `{{reviewer_lane}}` to `security`
* run [Open Lane Signoff](../triple-adversarial-blind-review.mdscript.md#open-lane-signoff)
* threat-model the changed surface:
  * authentication, authorization, input validation, injection, SSRF, path traversal, deserialization
  * secrets exposure, insecure defaults, privilege boundaries, tenant isolation
  * third-party package risk, unsafe shell or eval, secrets in logs, CSRF and CORS, bad crypto, dependency risk
* run or analyze hostile inputs, missing auth checks, confused-deputy paths, and failures that become security bugs
* look for hardcoded credentials, tokens, keys, unredacted personal data, and too-broad permissions
* make sure that the security proof exercises the dangerous path; unit-only green is not proof for a runtime claim
* set `contract` to the threat or control, and `rules_reviewed` to the security standards that you used
* run [Write Lane Signoff](../triple-adversarial-blind-review.mdscript.md#write-lane-signoff)
