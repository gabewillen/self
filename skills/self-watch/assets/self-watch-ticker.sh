#!/usr/bin/env bash
# Durable self-watch ticker.
#
# Owns timekeeping only. It SELF-DETACHES on start so agent-turn, tool-call, and
# chat-session cleanup cannot reap it. Callers run it as one plain foreground
# command with no `setsid`, no `nohup`, no `&`, and no `disown`: macOS ships no
# `setsid`, so a shell-side detach line is not portable and silently degraded to
# an ordinary background job that session cleanup killed.
#
# It exits on its own when the owner process dies, when the stop file appears,
# or when the agent has stopped consuming ticks for max_idle seconds.
#
# Usage:
#   self-watch-ticker.sh <sentinel> <interval_seconds> <owner_pid> \
#                        <spool> <ticker_heartbeat> <agent_heartbeat> \
#                        <stop_file> <max_idle_seconds> <pid_file> <resume_cmd>
#
# The ticker writes its own PID to <pid_file> and into the spool "armed" record.
# Never take the PID from $! — the foreground copy is only a launcher and exits
# immediately; $! (or its exit) says nothing about the ticker.
set -u

# --- self-daemonize ---------------------------------------------------------
# The first (foreground) copy re-launches itself detached and exits. The second
# copy carries SELF_WATCH_DETACHED=1 and runs the loop below. Detach mechanism,
# best first:
#   setsid   — Linux/util-linux; real new session, ticker reparents to PID 1.
#   subshell — portable bash: `set -m` gives the background child its own
#              process group, the subshell exits so the child reparents to
#              PID 1. This is the macOS path; no dependencies at all.
#   python3  — last resort if bash job control is unavailable; os.setsid().
# SELF_WATCH_DETACH forces one mechanism (setsid|subshell|python3); default auto.
if [ -z "${SELF_WATCH_DETACHED:-}" ]; then
  case "$0" in
    /*) _gw_self="$0" ;;
    *)  _gw_self="$PWD/$0" ;;
  esac
  _gw_bash="${BASH:-}"
  [ -x "$_gw_bash" ] || _gw_bash="$(command -v bash 2>/dev/null || echo /bin/sh)"

  # Try mechanisms in order and VERIFY each one actually produced a live
  # ticker. `command -v setsid` succeeding does not mean setsid works: a broken
  # binary, a wrapper, or a restricted container makes the launch fail, and
  # without verification arming silently no-ops while returning 0.
  _gw_how="${SELF_WATCH_DETACH:-auto}"
  if [ "$_gw_how" = auto ]; then
    _gw_order="setsid subshell python3"
  else
    _gw_order="$_gw_how"
  fi
  _gw_pidfile="${9:-}"

  # Clear a pid file whose recorded process is gone, so verification below
  # cannot pass on a stale value.
  if [ -n "$_gw_pidfile" ] && [ -s "$_gw_pidfile" ]; then
    _gw_old="$(cat "$_gw_pidfile" 2>/dev/null || echo)"
    if [ -z "$_gw_old" ] || ! kill -0 "$_gw_old" 2>/dev/null; then
      rm -f "$_gw_pidfile"
    fi
  fi

  SELF_WATCH_DETACHED=1
  export SELF_WATCH_DETACHED

  for _gw_try in $_gw_order; do
    case "$_gw_try" in
      setsid)
        command -v setsid >/dev/null 2>&1 || continue
        # `&` first so the launcher returns at once; setsid then makes the child
        # a session leader, and the launcher's exit reparents it to PID 1.
        ( trap '' HUP; setsid "$_gw_bash" "$_gw_self" "$@" \
            </dev/null >/dev/null 2>&1 & ) </dev/null >/dev/null 2>&1
        ;;
      python3)
        command -v python3 >/dev/null 2>&1 || continue
        ( trap '' HUP; python3 -c '
import os, signal, sys
if os.fork() > 0:
    os._exit(0)
os.setsid()
signal.signal(signal.SIGHUP, signal.SIG_IGN)
fd = os.open(os.devnull, os.O_RDWR)
os.dup2(fd, 0); os.dup2(fd, 1); os.dup2(fd, 2)
if fd > 2:
    os.close(fd)
os.execv(sys.argv[1], sys.argv[1:])
' "$_gw_bash" "$_gw_self" "$@" & ) </dev/null >/dev/null 2>&1
        ;;
      subshell)
        # `set -m` puts the background child in its own process group, so a
        # `kill -- -<launcher pgid>` (session cleanup) cannot reach it; the
        # subshell exits immediately and the child reparents to PID 1.
        ( set -m; trap '' HUP; "$_gw_bash" "$_gw_self" "$@" \
            </dev/null >/dev/null 2>&1 & ) </dev/null >/dev/null 2>&1
        ;;
      *)
        continue
        ;;
    esac

    # No pid file argument means nothing to verify against; assume launched.
    [ -n "$_gw_pidfile" ] || exit 0

    _gw_wait=0
    while [ "$_gw_wait" -lt 30 ]; do
      if [ -s "$_gw_pidfile" ]; then
        _gw_new="$(cat "$_gw_pidfile" 2>/dev/null || echo)"
        if [ -n "$_gw_new" ] && kill -0 "$_gw_new" 2>/dev/null; then
          exit 0
        fi
      fi
      sleep 0.1
      _gw_wait=$((_gw_wait + 1))
    done
    # This mechanism did not produce a live ticker; fall through to the next.
  done

  echo "self-watch-ticker: could not detach (tried: $_gw_order)" >&2
  exit 1
fi
unset SELF_WATCH_DETACHED
# --- end self-daemonize -----------------------------------------------------

sentinel="$1"
interval="$2"
owner_pid="$3"
spool="$4"
ticker_heartbeat="$5"
agent_heartbeat="$6"
stop_file="$7"
max_idle="$8"
pid_file="${9:-}"
resume_cmd="${10:-}"

now() { date -u +%Y-%m-%dT%H:%M:%SZ; }

emit() {
  printf '%s %s\n' "$sentinel" "$1" >>"$spool"
}

seq=0
mkdir -p "$(dirname "$spool")"
: >"$ticker_heartbeat"
[ -n "$pid_file" ] && printf '%s\n' "$$" >"$pid_file"
trap '[ -n "$pid_file" ] && rm -f "$pid_file"' EXIT
emit "{\"event\":\"armed\",\"at\":\"$(now)\",\"owner_pid\":$owner_pid,\"pid\":$$}"

while true; do
  sleep "$interval"

  if [ -e "$stop_file" ]; then
    emit "{\"event\":\"exit\",\"reason\":\"stop-file\",\"at\":\"$(now)\"}"
    exit 0
  fi

  # Tied to the parent/owner process, not to the agent turn that armed it.
  if [ "$owner_pid" -gt 0 ] 2>/dev/null && ! kill -0 "$owner_pid" 2>/dev/null; then
    emit "{\"event\":\"exit\",\"reason\":\"owner-gone\",\"at\":\"$(now)\"}"
    exit 0
  fi

  # Self-clean if the agent stopped consuming ticks entirely (orphan guard).
  if [ "$max_idle" -gt 0 ] 2>/dev/null && [ -f "$agent_heartbeat" ]; then
    last=$(date -u -r "$agent_heartbeat" +%s 2>/dev/null || stat -f %m "$agent_heartbeat" 2>/dev/null || echo 0)
    if [ "$last" -gt 0 ] 2>/dev/null; then
      idle=$(( $(date -u +%s) - last ))
      if [ "$idle" -ge "$max_idle" ]; then
        emit "{\"event\":\"exit\",\"reason\":\"agent-idle\",\"idle_seconds\":$idle,\"at\":\"$(now)\"}"
        exit 0
      fi
    fi
  fi

  seq=$((seq + 1))
  printf '%s\n' "$(now)" >"$ticker_heartbeat"
  # The prompt travels with the tick so a woken agent knows what to resume.
  emit "{\"event\":\"tick\",\"seq\":$seq,\"at\":\"$(now)\",\"prompt\":\"$resume_cmd\"}"
done
