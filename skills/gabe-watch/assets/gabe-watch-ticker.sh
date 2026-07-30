#!/usr/bin/env bash
# Durable gabe-watch ticker.
#
# Owns timekeeping only. It is started detached (setsid + nohup) so agent-turn,
# tool-call, and chat-session cleanup cannot reap it. It exits on its own when
# the owner process dies, when the stop file appears, or when the agent has
# stopped consuming ticks for max_idle seconds.
#
# Usage:
#   gabe-watch-ticker.sh <sentinel> <interval_seconds> <owner_pid> \
#                        <spool> <ticker_heartbeat> <agent_heartbeat> \
#                        <stop_file> <max_idle_seconds> <pid_file> <resume_cmd>
#
# The ticker writes its own PID to <pid_file> and into the spool "armed" record.
# Never take the PID from $! — setsid/nohup return the wrapper, not this process.
set -u

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
