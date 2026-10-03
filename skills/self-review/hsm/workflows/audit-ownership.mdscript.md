<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Audit Ownership

## The three questions

* for each changed component in the scope, ask these questions, also if the component is not a machine:
  * does it need a mutex, atomics, or a different synchronization primitive?
  * is it an actor: does it own a lifecycle, background work, or a long-lived identity?
  * does it receive or send messages?
* if one or more answers are yes and the component is **not** a machine, record `OW-05`
  * write in the finding that a machine must replace the primitive
  * write in the finding that the primitive must not stay below a machine
* if all answers are no and the component **is** a machine, record `OW-03`
* set `{{ownership_verdict}}` for each component
* write `{{ownership_verdict}}` to `{{out_dir}}/ownership.json`

## Boundary

* for each machine, find its named durable owner
  * find in that owner the lifecycle, the owned data, the accepted events, and the status that the machine shows
* if a machine has no named durable owner, record `OW-01`
* for each machine whose boundary is not a long-lived actor
  * if the boundary is a route, subject, handler, step, gate, or fixture, record `OW-02`
* for two or more machines in the same lifecycle
  * find the stated reason that they are not nested states or a submachine of one actor
  * if there is no stated reason, record `OW-04`
* in each finding, name the parts that stay plain code, and why, to prove the boundary from the two sides
* append the findings to `{{findings_log}}`
* return to the caller
