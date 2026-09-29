# SPipe home deployment

Authored companion to `test/spipe_home_deployment_spec.spl`.

- REQ-HOME-001: core defaults to `~/.spipe`, private workspace to `~/spipe`,
  and `~/spipe/common` links to core; private config does not alter core.
- REQ-HOME-002: reject an existing core checkout as the private workspace
  before creating links or modifying files.

1. Install hidden core and route a separate private workspace using temporary
   local Git fixtures.
2. Verify private configuration stays out of core, including repeat setup.
3. Reject the legacy core directory before creating private links.
4. Require both selected Node tests to execute successfully. The SSpec asserts
   zero command exit status, `# pass 2`, and `# fail 0`; skipped-only output
   cannot satisfy the pass count.

Execution status: authored SSpec and manual; approved self-hosted Simple runtime
not available in the isolated worktrees. Node fixture execution is recorded
separately by the deployment lane. Do not present this manual as generated
SSpec PASS evidence.

## Portable home placeholders

REQ-HOME-003: quoted `{home}` path arguments and SDN path values expand using
`os.homedir()` before installation and workspace registration. The additional
SSpec scenario selects the real local-Git fixture, requires a zero command exit,
exactly one passing test, and no failures. The fixture also uses a home path with
spaces and checks no literal `{home}` directory was created.

Four new Node scenarios passed locally: leading-token semantics without shell
evaluation, installer/SDN launch and registration, environment-based discovery,
and the legacy user entrypoint. Native PowerShell is covered by the same test's
Windows branch in CI. This is Node evidence, not SSpec execution evidence.
