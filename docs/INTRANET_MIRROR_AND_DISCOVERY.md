# SPipe intranet mirror and global discovery design

Status: proposed shared implementation and reference-script contract. This
documentation change does not ship `find-spipe.mjs`, `install-spipe.mjs`, or
`sync-spipe-mirror.mjs`, provision a server, or synchronize any remote.

## Common and private workspace

The preferred new global layout is `~/spipe` for common and `~/.spipe` for private
workspace/configuration, with `~/.spipe/common -> ~/spipe`. Private company,
project-registration, user, host, and runtime roots stay in the workspace.
Simple uses project-owned `.spipe/common` to route to `~/spipe`. Existing nested common
clones/submodules remain migration fallbacks with their exact pins. A dependency
requirement incompatible with global common produces a diagnostic; adopting the
route does not silently upgrade or physically relocate the old dependency.

Common exposes `raw/`, `wiki/`, `doc/`, and `skills/` alongside its source/tooling.
`doc/00_llm_process/knowledge/` continues to document the knowledge system.
Private scope data and runtime state are excluded from common publication.

## Three acquisition modes

| Mode | Contract |
|---|---|
| Internet | Clone the public `ormastes/Spipe` repository into the chosen common location. |
| Intranet | Consume a preconfigured dedicated SPipe Git mirror with ordinary read credentials. |
| Simple direct | Route project `.spipe/common` to canonical `~/spipe`; retain a recorded legacy dependency only through an explicit migration-compatible route. |

Ordinary pinned bootstrap uses checkout-style submodule initialization, without
`--remote`. Validate the actual recorded gitlink and trusted source first. No
new global clone is needed when canonical common already exists. A retained
legacy project pin can serve compatibility during reviewed migration.

The future global updater accepts `--source mirror|internet|auto`. Mirror mode
uses only the mirror; Internet mode uses only upstream; auto prefers mirror and
permits public fallback only under the configured network/export policy. An
existing checkout must identify as SPipe, be clean, use the configured branch,
and accept a fast-forward. A project dependency is never upgraded by this flow.

## Distribution configuration

The proposed `config.sdn` lookup order is explicit `--config`, `SPIPE_CONFIG`,
`config.sdn` in the current identified SPipe checkout, then
`~/.spipe/config.sdn`. Fields are `spipe.upstream`, `spipe.mirror`,
`spipe.branch`, `spipe.checkout`, and `spipe.workspace`. Define and test the
actual SDN grammar in the implementation; these field names do not establish a
parser. Credentials stay in the Git credential/SSH mechanism.

## Dedicated mirror publication

Mirror publication is separate from developer installation and requires explicit
authority for the destination. A filesystem/network-share destination may be
created as a bare mirror when absent; an existing destination must be verified
as the dedicated bare mirror before refresh/prune. SSH/HTTPS hosting must first
provision its repository through the service's administrative workflow.

The proposed publisher stages an upstream bare mirror and synchronizes mirror
refs. Mirror updates can delete destination refs; use a dedicated destination,
provide a dry-run/ref plan, and validate the exact configured source/destination
before applying it. Do not use a repository containing human-authored branches.
Publisher credentials are distinct from ordinary developer read credentials.
No credentials are stored in SDN or in clone URLs.

## Locator and research integration

Use the canonical order and failure behavior in
[Plugin/agent bootstrap](PLUGIN_AGENT_BOOTSTRAP.md): explicit `SPIPE_HOME`,
project `.spipe/common`, `~/spipe`, `~/.spipe/common`, an identified
direct package, then legacy project `.spipe/spipe`, `.spipe/spipe_project`, or
legacy `~/.spipe` package roots. Fail explicitly
for invalid required selections or missing common. Discovery and mirror origin
confer no private-scope authorization.

After common is located, resolve the active workspace and authorized scope
wikis. Enter indexes, select relevant leaves, validate reusable research state,
and follow raw/doc references as needed. Runtime retention separates rebuildable
`cache/`, retained `state/`, active `run/`, and bounded `tmp/`; runtime is not
mirrored as common knowledge.

Implement this through one shared locator/distribution library with thin script,
CLI, MCP and plugin adapters. Test canonical-common routing, legacy pin preservation, incompatible override
diagnostics, direct/global parity, missing mirror behavior, fast-forward refusal,
and dry-run non-mutation before advertising commands as available.
