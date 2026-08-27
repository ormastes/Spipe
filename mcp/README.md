# MCP

`server.js` is a dependency-free stdio JSON-RPC MCP server for SPipe docs and
experts.

Tools:

- `spipe_info`
- `spipe_experts`
- `spipe_read_doc`
- `spipe_fine_tune_guide`
- `spipe_fine_tune_model_guide`
- `spipe_fine_tune_template`
- `spipe_release_guide`
- `spipe_release_capabilities`
- `spipe_release_version_check`
- `spipe_release_session_plan`
- `spipe_release_main_fix_discovery_plan`
- `spipe_release_beta_backport_plan`
- `spipe_release_forward_port_plan`
- `spipe_release_candidate_plan`
- `spipe_release_promotion_plan`
- `spipe_release_withdrawal_plan`
- `spipe_review_request_create`
- `spipe_review_admission_validate`
- `spipe_review_capabilities`

The release tools are read-only inspection surfaces. They report the packaged
policy and schema capabilities; they do not grant authority to update a
protected ref, sign a tag, or publish a release.
Main-fix discovery consumes an immutable caller-supplied snapshot, reports
reviewed bug-fix candidates, and still requires the caller to select an exact
commit. Forward-port validation produces an isolated-main integration plan for
approved release-first fixes; it never pushes `main`.
Withdrawal planning preserves published tags, assets, artifacts, and history;
corrections always use a distinct replacement version.

Review request creation is also non-mutating and never accepts caller head
authority. Review admission requires a configured dedicated broker, pinned
integration identity, live provider head/check resolution, and an unexpired
audit receipt. Without that authority the admission tool fails closed.
The MCP process and its broker environment must be launched and owned by the
operator; exposing broker command or integration-ID environment configuration
to request callers invalidates this trust boundary. The CLI never consumes
those environment values as admission authority.

Resource:

- `spipe://skill`
