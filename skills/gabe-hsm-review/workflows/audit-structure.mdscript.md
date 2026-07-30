<!-- mdscript: use the mdscript-exec skill or read [spec.md](https://raw.githubusercontent.com/gabewillen/mdscript/main/spec.md) -->

## Audit Structure

* for each machine in `{{machine_inventory}}`
  * check each region that should auto-enter has an **initial** pseudostate / initial transition (`ST-01`) — `P0` if missing
  * check **choice** nodes have outs and an unguarded else when guards are not exhaustive (`ST-02`) — `P0`/`P1`
  * check **final** vertices are absorbing (`ST-03`) — `P1`
  * check **history** only in composites with default when needed (`ST-04`) — `P1`
  * check transition ends reference existing vertices when statically knowable (`ST-05`) — `P1`
  * inventory events handled on multiple sibling leaves with duplicated transitions
    * flag hierarchy factoring debt (`HI-01`..`04`) — `P0` if exact duplicates, else `P1`/`P2`
  * check shared handlers already live on composite parents where appropriate (positive note, no finding)
  * if orthogonal/parallel regions appear
    * apply `OR-01`; if project overlay bans them, `OR-02` as `P1`
* do **not** require framework-specific naming, file layout, or module versions in this audit
* append findings with UML rule ids first
* return to the caller
