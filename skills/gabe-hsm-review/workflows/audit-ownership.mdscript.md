<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Audit Ownership

The gate that precedes design. Cheap, and it runs before any graph work, because a machine that
should not exist does not need its structure reviewed — and a component that should be a machine
will not appear in `{{machine_inventory}}` at all.

### The three questions

* for each changed component in scope, machine or not, ask:
  * does it need a mutex, atomics, or any synchronization primitive?
  * is it an actor — does it own a lifecycle, background work, or a long-lived identity?
  * does it consume or produce messages?
* if any answer is yes and it is **not** a machine, record `OW-05`; the synchronization primitive
  should have been replaced by the machine, not layered under one
* if every answer is no and it **is** a machine, record `OW-03`
* set `{{ownership_verdict}}` per component and write it to `{{out_dir}}/ownership.json`

### Boundary

* for each machine, require a named durable owner: its lifecycle, the data it owns, the events it
  accepts, the status it exposes. If absent, record `OW-01`
* for a machine whose boundary is a route, subject, handler, step, gate, or fixture rather than a
  long-lived actor, record `OW-02`
* for two or more machines in the same lifecycle, require a stated reason they are not nested
  states or a submachine of one actor; if absent, record `OW-04`
* name in each finding what stays plain code and why, so the boundary is proved from both sides
* append findings to `{{findings_log}}`
* return to the caller
