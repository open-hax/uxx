---
status: incubating
created: 2026-11-02T01:05:00Z
source-session: /home/err (cwd fallback — OPENCODE_SESSION_ID not readable without a shell tool)
source-task: uxx firefox style-cache: 3-round spec PASS, chunk D impl, adversarial APPROVE, 255/255 gates, clean .xpi swap + verified Firefox activation
p-efficiency: 0.7
p-friction: 0.62
p-skill-candidate: 0.72
promoted-to: ""
rejected-reason: ""
---

## Problem

At the final step of an otherwise green turn I called `tools.shell.command` from
inside the Code Mode `execute` runtime, because earlier turns in the same
session had used a shell tool. It failed: `Unknown tool 'shell.command'`. There
was no top-level `shell` in my tool list either. Two toolsets existed in play —
my top-level tool list and the code-mode catalog — and neither contained shell,
despite conversation history showing shell calls succeeding minutes earlier.

The real cost was not the error; it was the risk around it. The natural wrong
responses were (a) retrying guessed tool names, (b) drifting into
`emergency-confusion-reset` without knowing the actual cause, or (c) worst of
all, using `write`/`edit` to narrate a command result I never ran. The turn was
already fully green at that point, so a fabricated "installed ✅" would have
been indistinguishable from truth to a reader.

## Pattern

**Tool availability is a per-turn fact, not a per-session fact.** Conversation
history records what was callable *then*, not what is callable now. Two things
make this recur:

1. Harnesses change the exposed toolset between turns (plugins loaded, code-mode
   catalog scoped differently, permissions refreshed).
2. Long sessions accumulate history that *looks* like proof of a capability.

There is also a discoverable answer rather than a guess: inside `execute`, a
`search({ query })` function returns the callable tool paths *with their exact
signatures*. That is the only authoritative source in-code. When the capability
is genuinely absent (shell, process control, binary file surgery), the routing
answer is a subagent — not stalling, and not improvising with the file tools.

## Candidate skill outline

- **Name suggestion**: `toolset-discovery-capability-routing`
- **Trigger phrases**: "run a command", "use shell", a tool error reading
  `Unknown tool` / `is not a function`, "restart the service", or any moment a
  required capability seems to be missing mid-task.
- **Key steps or rules**:
  1. Never infer current tool availability from earlier successful calls in the
     same session. The tool list is per-turn.
  2. On a tool error, stop and *discover* — do not retry, do not invent names,
     do not narrate. Inside Code Mode, `search({query})` returns callable paths
     and signatures; consult it before forming a second attempt.
  3. Classify the failure: `Unknown tool X.command` is usually a wrong shape for
     a real namespace; an empty `search` result for `shell` means the capability
     is genuinely absent this turn.
  4. Route real capability gaps to a subagent with an explicit safety spec:
     exact ordered steps, a backup before any destructive overwrite, escalation
     limits (graceful quit → SIGTERM → SIGKILL last), a hard verification gate,
     and a named rollback artifact.
  5. If verification cannot be run, say so. A skipped check must be recorded as
     skipped, never as passed.
- **Anti-patterns to avoid**:
  - Retrying a guessed tool name after a `Unknown tool` error.
  - Treating session history as a tool catalog.
  - Using `write`/`edit`/`read` to *simulate* the outcome of a shell command.
  - Swapping a file under a running process (Firefox was running while I first
    considered overwriting its `.xpi` — that order risks the process writing a
    corrupted state at shutdown; the correct order is backup → clean quit →
    swap → relaunch → verify).
  - Claiming an install, build, or restart succeeded without pasting the
    machine's own evidence.

## Better path

Before executing: if the next step needs command execution, verify it in one
cheap call rather than assuming. On failure: `search()` the real catalog, then
either use the correct shape or state plainly that the capability is absent this
turn and delegate the mechanical work to a subagent — carrying the backup,
ordering, escalation, verification-gate and rollback constraints with it. Close
by reporting exactly what was verified and what could not be.

## Receipt refs
- 2026-11-02T00:47:03.000Z
