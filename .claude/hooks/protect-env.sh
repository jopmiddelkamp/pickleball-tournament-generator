#!/bin/sh
# PreToolUse hook: .env files hold secrets (Google OAuth client secret,
# Supabase service keys) and must never enter Claude's context. Denies any
# tool call that references a .env file, except the committed .env.example
# templates. Covers Read/Edit/Write paths, Glob/Grep patterns, and Bash
# commands. gitignore keeps the secrets out of the repo; this keeps them
# out of the transcript.
input=$(cat)

python3 - "$input" <<'PY'
import json, re, sys

data = json.loads(sys.argv[1])
tool_input = data.get("tool_input") or {}
fields = ("file_path", "path", "pattern", "glob", "command", "notebook_path")
text = " ".join(str(tool_input.get(k, "")) for k in fields)

# A ".env" file token: not preceded by a word character (so process.env and
# next-env.d.ts stay allowed), optionally suffixed (.local, .prod, ...).
hits = re.findall(r"(?<![\w-])\.env[\w.-]*", text)
if any(not hit.startswith(".env.example") for hit in hits):
    print(json.dumps({
        "hookSpecificOutput": {
            "hookEventName": "PreToolUse",
            "permissionDecision": "deny",
            "permissionDecisionReason": ".env files hold secrets and are off-limits to Claude; only .env.example may be read. Ask the user to handle the value themselves.",
        }
    }))
PY
