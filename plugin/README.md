# Plugin

This directory contains plugin metadata for packaging SPipe as a reusable
agent-process module.

- `.codex-plugin/plugin.json` describes the skill, command, and MCP surfaces.
- `manifest.sdn` is a plain process manifest for non-Codex installers.

The canonical version is projected from `../release/version.sdn`. The plugin
includes guarded planning for isolated sessions, read-only main fix discovery,
reviewed beta backports, release-first forward ports, immutable candidates,
promote-without-rebuild, and non-destructive withdrawal. The CLI and MCP
interfaces validate and hash supplied evidence but do not execute Git, builds,
tags, pushes, deletions, overwrites, or publication. Installing the plugin does
not confer protected repository or publication authority.

The plugin also projects non-mutating repo/PR/session/feature review requests
and broker-verified `spipe-review-admission/1` validation. It cannot emit a
PASS status without separately configured dedicated broker authority in an
operator-owned MCP process. CLI receipt checks are shape/time planning only and
always remain non-authoritative.

User-authorized self-review uses `spipe_self_review_privilege_evaluate` and
`spipe_self_review_approve`. Ordinary code/text is default-eligible only after
an authenticated exact-head higher-model PASS with no P0/P1, subject to the
operator JSONL deny/constrain DB and fixed secret/policy-DB restrictions. The
approval-named tool emits `SPipe Self Review Admission` through the pinned
broker; it never submits a provider PR approval.
Both resolution and admission bind session/request IDs, base repository/ref/SHA,
merge base, and diff digest so receipt replay or PR retargeting fails closed.
The broker also binds the protected target repository/ref and ruleset ID and
must attest strict up-to-date required-status enforcement at resolution and
check emission. Providers that cannot prove this contract are denied.
