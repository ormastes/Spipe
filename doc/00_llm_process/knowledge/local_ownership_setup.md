# Local knowledge ownership and setup

## Available setup

For a first user workspace, run `node scripts/setup-spipe-workspace.mjs init
--interactive` from common. It prints a plan without writing; repeat with
`--apply` after review. The default layout keeps common at `~/spipe` and private
company, organization, project-registration, user, host, and runtime state under
`~/.spipe`.

After cloning a Simple host project, run its `scripts/setup-spipe-local.shs`. It
prefers `.spipe/common` routed to canonical `~/spipe`. Recorded `.spipe/spipe`
layouts remain supported fallbacks until an explicit migration is reviewed.
On Windows, use `scripts/setup-spipe-local.ps1`; first-user setup uses the
common checkout's `scripts/setup-local-knowledge.ps1`.

The portable Node bootstrap and distribution scripts accept external common
routes while retaining verified legacy pins. They scaffold schema-2 workspace
state and registrations; enterprise authorization and transactional document
migration remain separate integration work.

## Workspace revision target

The preferred new global arrangement is `~/spipe` for common and `~/.spipe` for
private configuration, with `~/.spipe/common` pointing to that checkout. Existing
`.spipe`, `.spipe/spipe`, and clone-as-`common/` installations preserve their
physical location and reviewed Git pin. A project-required common revision is
resolved explicitly; installing a global checkout does not upgrade a project.

Simple's preferred project route is `<simple>/.spipe/common`, pointing or resolving
to `~/spipe`. `.spipe/spipe` and `.spipe/spipe_project` follow as legacy compatibility
candidates. A mismatched global checkout
produces a version diagnostic; it cannot silently replace a recorded dependency.

```text
~/.spipe/
├── common -> ~/spipe
├── companies/<company>/
│   └── organizations/<organization>/
├── projects/<project>/                       registration; project stays external
├── users/<user>/
│   └── hosts/<host>/                        private mounts and preferences
├── hosts/
│   ├── defaults.json
│   ├── profiles/<profile>/
│   └── machines/<host>/
└── runtime/<user>/<host>/
    ├── cache/
    ├── state/
    ├── run/
    └── tmp/
```

Company is an owner in its own right. Departments inherit applicable company
restrictions, while sibling department documents require separate access.
Use independently permissioned repositories for restricted material. Workspace
registration identifies a location; it does not authenticate the supplied user
or enroll anyone into a company. Scaffolds carry unconfigured authority.

Projects retain canonical documents and skills in their own repositories.
Machine-specific paths belong to the private user-host registry; portable
project manifests carry logical dependencies and reviewed pins. When a project's
`.spipe` is common itself, project configuration must live outside that submodule.

Knowledge-owning scopes expose `index.md` and `raw/`, `wiki/`, `doc/`, `skills/`
indexes when those surfaces exist. Directories may be created lazily. Namespace
containers and external project registrations do not require duplicate knowledge
trees. See [scope resolution](llm_wiki_scope_resolution.md).

## Acquisition and compatibility

The shipped scripts support Internet installation, an approved intranet mirror, and
direct use through Simple's `.spipe/common` route, with recorded legacy dependencies
retained during transition. `install-spipe.mjs` and `sync-spipe-mirror.mjs`
plan by default and require `--apply`; mirror publication additionally requires
`--dedicated`. Mirror publication is a separate authorized operation;
mirror ref synchronization can delete destination refs and requires a dedicated
mirror repository. Developer updates must preserve dirty worktrees and use only
approved fast-forward global updates. Ordinary project setup uses the gitlink's
recorded commit, without `--remote`.

Use the shared locator advertised by the installed plugin version. The next
revision centralizes discovery and scope context behind `locate_common()`,
`resolve_workspace()`, `resolve_active_scopes()`, `compile_research_context()`,
and `explain_resolution()`. Prompts must not develop independent resolvers.
Missing common reports the three acquisition choices; optional unavailable
scopes are diagnosed without probing unauthorized roots.

## Authoring and retention

Write reusable public knowledge to common, company policy to company, department
knowledge to organization, project architecture/tests/incidents to project,
personal authored knowledge to user, and durable machine facts to host. Desired
host profiles are configuration; only fresh trusted probes establish capability.
Preferences cannot relax mandatory policy.

`runtime/<user>/<host>/cache/` is reconstructible; `state/` retains research runs,
history, manifests, and receipts; `run/` holds live locks/sockets; `tmp/` has bounded
lifetime. Do not erase retained state during cache cleanup. Runtime reuse checks
source revisions, authorization domain, and provider compatibility before use.

Update the owner's canonical artifact, then refresh only dependent indexes and
summaries. Rebalancing is proposal-only by default. Promotion to common creates
a sanitized artifact and requires owner approval.

Classify an existing `local/` using the [migration guide](local_migration.md).
Do not rename mixed content wholesale or dual-write old and new registries.
