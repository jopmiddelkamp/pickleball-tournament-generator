#!/bin/sh
# PreToolUse hook: the SPEC files are frozen during algorithm tuning (see CLAUDE.md, "Source of truth").
# CLAUDE.md is context, not enforcement, so this hook makes the rule deterministic.
input=$(cat)

if command -v jq >/dev/null 2>&1; then
  path=$(printf '%s' "$input" | jq -r '.tool_input.file_path // empty')
else
  path=$(printf '%s' "$input" | sed -nE 's/.*"file_path"[[:space:]]*:[[:space:]]*"([^"]*)".*/\1/p' | head -n 1)
fi

case "$path" in
  */docs/SPEC-*.md|docs/SPEC-*.md)
    echo "The SPEC files are frozen; they change only between tuning cycles with a written reason. Describe the change you think is needed to the user instead of editing $path." >&2
    exit 2
    ;;
esac
exit 0
