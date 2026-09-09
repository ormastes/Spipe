# Plugin

This directory contains plugin metadata for packaging SPipe as a reusable
agent-process module.

- `.codex-plugin/plugin.json` describes the skill, command, and MCP surfaces.
- `manifest.sdn` is a plain process manifest for non-Codex installers.
- `skills/spipe-research/SKILL.md` defines scope-aware wiki research and
  owner-correct writeback.

The research skill composes authorized wiki scopes in the order common,
company, organization(s), project(s), user, then host. It distinguishes raw
evidence (`raw/`), synthesized knowledge (`wiki/`), normative artifacts (`doc/`),
and procedures (`skills/`). `runtime/<user>/<host>/` contains reconstructible
`cache/`, retained `state/`, live coordination `run/`, and bounded `tmp/`.
Retained research history is not disposable cache; runtime is never canonical
knowledge.

`~/spipe` is the canonical common checkout. Simple uses project-owned
`.spipe/common` to route to it; the workspace uses `~/.spipe/common -> ~/spipe`.
Discovery follows explicit `SPIPE_HOME`, project `.spipe/common`,
`~/spipe`, `~/.spipe/common`, and an identified direct checkout. Existing
`.spipe/spipe`, `.spipe/spipe_project`, and legacy `~/.spipe` package checkouts
are migration fallbacks. Validate project revision requirements and diagnose
incompatibility without silently upgrading or relocating a recorded dependency.
Missing or invalid required common is a setup error. Acquisition choices are
Internet, intranet mirror, and Simple's route to the common checkout (or an
explicitly retained legacy pin). Discovery grants no private-scope authority.

See [agent/bootstrap guidance](../docs/PLUGIN_AGENT_BOOTSTRAP.md) and
[distribution design](../docs/INTRANET_MIRROR_AND_DISCOVERY.md). Shared
`locate_common`, `resolve_workspace`, `resolve_active_scopes`,
`compile_research_context`, and `explain_resolution` APIs remain an integration
target until corresponding exports exist. The `find-spipe.mjs`,
`install-spipe.mjs`, and `sync-spipe-mirror.mjs` entrypoints are proposed adapters,
not commands shipped by this documentation change. Plugin installation alone
does not establish a trusted scope resolver.

The canonical version is projected from `../release/version.sdn`. The plugin
includes guarded token-owned local sessions, read-only main fix discovery,
reviewed beta backports, release-first forward ports, immutable candidates,
promote-without-rebuild, and non-destructive withdrawal. The CLI and MCP
interfaces can fetch, create a local worktree/branch, and rebase only the clean
owned session after exact-state checks. They do not cherry-pick fixes or execute
builds, tags, protected-ref pushes, deletions, overwrites, or publication.
Installing the plugin does not confer protected repository or publication
authority.

The shipped CLI/MCP beta-backport planners accept only exact patch-equivalent
cherry-picks. Adapted backports fail closed as unsupported until an
authenticated adaptation-review broker is configured and exposed publicly.

The plugin also projects non-mutating repo/PR/session/feature review requests
and broker-verified `spipe-review-admission/1` validation. It cannot emit a
PASS status without separately configured dedicated broker authority in an
operator-owned MCP process. CLI receipt checks are shape/time planning only and
always remain non-authoritative.

GitHub forbids a pull-request author from submitting an `APPROVED` review on
their own PR. User-authorized self-review therefore uses
`spipe_self_review_privilege_evaluate` and the compatibility-named
`spipe_self_review_approve`. The request must include current explicit user
authorization evidence authenticated by the broker. Ordinary code/text is
default-eligible only after an exact-head higher-model PASS with no P0/P1,
subject to operator deny/constrain and fixed authority restrictions. The
approval-named tool emits `SPipe Self Review Admission` through the pinned
broker; it never submits a provider PR approval.
Both resolution and admission bind session/request IDs, base repository/ref/SHA,
merge base, and diff digest so receipt replay or PR retargeting fails closed.
The broker also binds the protected target repository/ref and ruleset ID and
must attest strict up-to-date required-status enforcement at resolution and
check emission. Providers that cannot prove this contract are denied. New
head/base/diff, retarget, ruleset/policy/review/authorization receipt change, or
expiry invalidates the result; the broker must register fail-closed status
invalidation. Denied decisions expose the exact reason, affected policy/path,
and remediation.
