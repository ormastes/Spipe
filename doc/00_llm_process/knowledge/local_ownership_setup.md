# Local knowledge ownership and setup

For a first user repository, run `setup-local-knowledge.sh --mode user`. The
outer repository is user-owned; its `.spipe` child is the pinned common SPipe
submodule. `organization/` and `projects/` contain user-owned registrations or
content, while `local/` is ignored machine state.

After cloning a project, run `scripts/setup-spipe-local.shs`. It initializes the
recorded `.spipe` gitlink without changing its pin. Legacy `.spipe/spipe`
layouts are supported and preserved until an explicit migration is reviewed.
On Windows, use `scripts/setup-spipe-local.ps1`; first-user setup uses the
common checkout's `scripts/setup-local-knowledge.ps1`.

Research composes authorized wiki scopes as common, company, explicitly ordered
organizations, explicitly ordered projects, user, then host. Company and
organization are distinct owners. Put reusable public procedures in common,
company-owned policy in company, organization decisions in organization,
architecture/tests/incidents in project, authored personal knowledge in user,
and machine-specific authored knowledge in host. Preferences remain local
configuration.

Each knowledge-owning scope has root, `raw`, `wiki`, `doc`, and `skills`
`index.md` files. `runtime/<user>/<host>/` is derived, disposable research state,
not canonical knowledge. Clearing it must preserve correctness.

Update the owner's canonical artifact, then refresh only dependent indexes and
summaries. Rebalancing is proposal-only by default. Promotion to common creates
a sanitized artifact and requires owner approval.
