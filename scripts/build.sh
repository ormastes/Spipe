#!/bin/sh
set -eu

ROOT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"
cd "$ROOT_DIR"

required_paths="
README.md
LICENSE
release/version.sdn
doc/00_llm_process/spipe/skill.md
doc/00_llm_process/spipe/llm_finetune.md
doc/00_llm_process/spipe/llm_model_research.md
doc/00_llm_process/spipe/llm_finetune_attempt_template.sdn
doc/00_llm_process/spipe/review_admission.md
doc/00_llm_process/skill_command
doc/00_llm_process/template
doc/00_llm_process/project_expert
doc/00_llm_process/project_expert/subproject_links.example.sdn
doc/00_llm_process/domain_expert
doc/00_llm_process/tool_expert
.claude/skills/spipe.md
.claude/skills/software-release.md
.claude/skills/release.md
.claude/skills/sync.md
.claude/templates/spipe_template.spl
.codex/skills/dev/SKILL.md
.codex/skills/sp_dev/SKILL.md
.codex/skills/software-release/SKILL.md
.codex/skills/release/SKILL.md
.codex/skills/sync/SKILL.md
.gemini/commands/dev.toml
.gemini/commands/sp_dev.toml
.gemini/commands/release.toml
.gemini/commands/sync.toml
.github/workflows/build.yml
package.json
cli/spipe.js
mcp/server.js
src/release/contract.js
src/release/planner.js
src/release/version.js
src/review/contract.js
src/review/admission.js
src/review/broker.js
src/cli/review_commands.js
test/unit/release_policy_test.js
test/unit/review_admission_test.js
test/windows/setup_spipe_links_containment.ps1
plugin/.codex-plugin/plugin.json
plugin/package.json
plugin/LICENSE
plugin/release/version.sdn
plugin/manifest.sdn
plugin/skills/software-release/SKILL.md
plugin/skills/release/SKILL.md
plugin/skills/sync/SKILL.md
plugin/skills/spipe/SKILL.md
plugin/skills/spipe-loop/SKILL.md
plugin/skills/sstack/SKILL.md
plugin/skills/dev/SKILL.md
plugin/skills/sp-dev/SKILL.md
plugin/mcp/server.js
plugin/cli/spipe.js
plugin/scripts/setup-spipe-links.sh
plugin/scripts/setup-spipe-links.ps1
plugin/src/release/contract.js
plugin/src/release/planner.js
plugin/src/release/version.js
plugin/src/review/contract.js
plugin/src/review/admission.js
plugin/src/review/broker.js
plugin/src/cli/review_commands.js
plugin/doc/00_llm_process/spipe/review_admission.md
plugin/doc/00_llm_process/skill_command/command/release.md
plugin/doc/00_llm_process/spipe/skill.md
plugin/doc/00_llm_process/template/feature_skill.md
plugin/doc/00_llm_process/project_expert/README.md
plugin/doc/00_llm_process/domain_expert/README.md
plugin/doc/00_llm_process/tool_expert/README.md
scripts/setup-spipe-links.sh
plugin
mcp
cli
"

missing=0
for path in $required_paths; do
  if [ ! -e "$path" ]; then
    echo "missing $path" >&2
    missing=$((missing + 1))
  fi
done

if [ "$missing" -ne 0 ]; then
  echo "spipe_build_status=fail missing=$missing"
  exit 1
fi

node --check cli/spipe.js >/dev/null
node --check mcp/server.js >/dev/null
canonical_version="$(node cli/spipe.js --version)"
if git -C ../.. rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  git -C ../.. ls-files --stage examples/spipe | grep -q '^100'
  git -C ../.. ls-files --stage .spipe/spipe | grep -q '^160000 .*	.spipe/spipe$'
  diff -qr -x .git ../../examples/spipe ../../.spipe/spipe >/dev/null
fi
node -e 'const p=require("./package.json"); if (p.bin.spipe !== "cli/spipe.js" || p.bin["spipe-mcp"] !== "mcp/server.js") process.exit(1)'
node -e 'const p=require("./plugin/.codex-plugin/plugin.json"); if (p.skills !== "./skills/" || Object.hasOwn(p, "commands")) process.exit(1)'
grep -q 'unix: scripts/setup-spipe-links.sh$' plugin/manifest.sdn
cmp mcp/server.js plugin/mcp/server.js
cmp cli/spipe.js plugin/cli/spipe.js
cmp src/cli/release_commands.js plugin/src/cli/release_commands.js
cmp src/cli/review_commands.js plugin/src/cli/review_commands.js
cmp scripts/setup-spipe-links.sh plugin/scripts/setup-spipe-links.sh
cmp scripts/setup-spipe-links.ps1 plugin/scripts/setup-spipe-links.ps1
cmp mcp/protocol/errors.js plugin/mcp/protocol/errors.js
cmp mcp/protocol/initialize.js plugin/mcp/protocol/initialize.js
cmp mcp/protocol/resources.js plugin/mcp/protocol/resources.js
cmp mcp/protocol/router.js plugin/mcp/protocol/router.js
cmp mcp/protocol/tools.js plugin/mcp/protocol/tools.js
cmp mcp/transport/stdio.js plugin/mcp/transport/stdio.js
cmp src/format/stable.js plugin/src/format/stable.js
cmp src/release/contract.js plugin/src/release/contract.js
cmp src/release/planner.js plugin/src/release/planner.js
cmp src/release/version.js plugin/src/release/version.js
cmp src/review/contract.js plugin/src/review/contract.js
cmp src/review/admission.js plugin/src/review/admission.js
cmp src/review/broker.js plugin/src/review/broker.js
cmp doc/00_llm_process/spipe/review_admission.md plugin/doc/00_llm_process/spipe/review_admission.md
cmp doc/00_llm_process/skill_command/command/release.md plugin/doc/00_llm_process/skill_command/command/release.md
printf '%s\n' '{"jsonrpc":"2.0","id":5,"method":"tools/list","params":{}}' | node plugin/mcp/server.js | grep -q "spipe_release_promotion_plan"
printf '%s\n' '{"jsonrpc":"2.0","id":51,"method":"tools/list","params":{}}' | node plugin/mcp/server.js | grep -q "spipe_release_withdrawal_plan"
printf '%s\n' '{"jsonrpc":"2.0","id":52,"method":"tools/list","params":{}}' | node plugin/mcp/server.js | grep -q "spipe_review_admission_validate"
printf '%s\n' '{"jsonrpc":"2.0","id":6,"method":"resources/read","params":{"uri":"spipe://skill"}}' | node plugin/mcp/server.js | grep -q "SPipe"
printf '%s\n' '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' | node mcp/server.js | grep -q "spipe_fine_tune_guide"
printf '%s\n' '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"spipe_fine_tune_template","arguments":{}}}' | node mcp/server.js | grep -q "attempt_id"
node cli/spipe.js info >/dev/null
node cli/spipe.js experts >/dev/null
node cli/spipe.js doc-root ../.. >/dev/null
node cli/spipe.js fine-tune-guide >/dev/null
node cli/spipe.js fine-tune-model-guide >/dev/null
node cli/spipe.js fine-tune-template >/dev/null
node cli/spipe.js release-guide >/dev/null
node cli/spipe.js release-capabilities | grep -q "capability.immutable_release_candidates=true"
node cli/spipe.js release-capabilities | grep -q "capability.non_destructive_withdrawal_planning=true"
node cli/spipe.js release-capabilities | grep -q "capability.external_release_mutation=false"
node cli/spipe.js review-capabilities | grep -q "capability.broker_verified_review_admission=true"
node cli/spipe.js release-version-check | grep -q '"valid": true'
node plugin/cli/spipe.js release-version-check | grep -q '"valid": true'
test "$(node plugin/cli/spipe.js --version)" = "$canonical_version"
withdrawal_json='{"version":"1.2.0","tag":"v1.2.0","published_commit_sha":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa","artifact_manifest_sha256":"bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb","withdrawal_reason":"critical defect","advisory_uri":"https://example.invalid/advisories/SP-1","replacement_version":"1.2.1","published_tag_preserved":true,"published_assets_preserved":true,"history_preserved":true,"replacement_is_new_version":true,"withdrawal_authority_approved":true}'
node cli/spipe.js release-withdrawal-plan "$withdrawal_json" | grep -q '"operation": "withdrawal"'
node plugin/cli/spipe.js release-withdrawal-plan "$withdrawal_json" | grep -q '"operation": "withdrawal"'
printf '%s\n' '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"spipe_release_capabilities","arguments":{}}}' | node mcp/server.js | grep -q "immutable_release_candidates=true"
printf '%s\n' '{"jsonrpc":"2.0","id":4,"method":"tools/list","params":{}}' | node mcp/server.js | grep -q "spipe_release_main_fix_discovery_plan"
printf '%s\n' '{"jsonrpc":"2.0","id":41,"method":"tools/call","params":{"name":"spipe_release_version_check","arguments":{}}}' | node plugin/mcp/server.js | grep -q '\\"valid\\": true'

tmp_plugin="$(mktemp -d)"
cp -R plugin/. "$tmp_plugin/"
(cd "$tmp_plugin" && node cli/spipe.js --version | grep -qx "$canonical_version")
printf '%s\n' '{"jsonrpc":"2.0","id":42,"method":"tools/list","params":{}}' |
  (cd "$tmp_plugin" && node mcp/server.js) | grep -q 'spipe_release_version_check'
rm -rf "$tmp_plugin"

tmp_pack="$(mktemp -d)"
tmp_install="$(mktemp -d)"
npm pack --ignore-scripts --silent --pack-destination "$tmp_pack" >/dev/null
package_tgz="$tmp_pack/simple-lang-spipe-$canonical_version.tgz"
test -f "$package_tgz"
npm install --ignore-scripts --no-audit --no-fund --silent --prefix "$tmp_install" "$package_tgz"
installed_package="$tmp_install/node_modules/@simple-lang/spipe"
test -f "$installed_package/release/version.sdn"
npm --prefix "$tmp_install" exec --offline -- spipe --version | grep -qx "$canonical_version"
printf '%s\n' '{"jsonrpc":"2.0","id":43,"method":"initialize","params":{}}' |
  npm --prefix "$tmp_install" exec --offline -- spipe-mcp | grep -q "\"version\":\"$canonical_version\""
printf '%s\n' '{"jsonrpc":"2.0","id":44,"method":"tools/list","params":{}}' |
  npm --prefix "$tmp_install" exec --offline -- spipe-mcp | grep -q "spipe_review_request_create"
rm -rf "$tmp_pack" "$tmp_install"

node --test test/unit/release_policy_test.js
node --test test/unit/review_admission_test.js

tmp_host="$(mktemp -d)"
trap 'rm -rf "$tmp_host"' EXIT
case "$(uname -s)" in
MINGW*|MSYS*|CYGWIN*) ;;
*)
tmp_link_host="$(mktemp -d)"
tmp_link_outside="$(mktemp -d)"
trap 'rm -rf "$tmp_host" "$tmp_link_host" "$tmp_link_outside"' EXIT
SPIPE_HOST_ROOT="$tmp_link_host" sh scripts/setup-spipe-links.sh --dry-run | grep -q "doc/llm_process/spipe"
test ! -e "$tmp_link_host/doc"
if SPIPE_HOST_ROOT="$tmp_link_host" sh scripts/setup-spipe-links.sh --dry-run --force --doc-root ../escape >/dev/null 2>&1; then
  echo "setup accepted an escaping doc root" >&2
  exit 1
fi
for unsafe_doc_root in ./doc/llm_process doc/llm_process/; do
  if SPIPE_HOST_ROOT="$tmp_link_host" sh scripts/setup-spipe-links.sh --dry-run --doc-root "$unsafe_doc_root" >/dev/null 2>&1; then
    echo "setup accepted a dot-segment or trailing-slash doc root: $unsafe_doc_root" >&2
    exit 1
  fi
done
if ln -s "$tmp_link_outside" "$tmp_link_host/linked-outside" 2>/dev/null && [ -L "$tmp_link_host/linked-outside" ]; then
  if SPIPE_HOST_ROOT="$tmp_link_host" sh scripts/setup-spipe-links.sh --force --doc-root linked-outside/process >/dev/null 2>&1; then
    echo "setup accepted a doc root beneath an escaping symbolic-link ancestor" >&2
    exit 1
  fi
  test ! -e "$tmp_link_outside/process"
fi
rm -rf "$tmp_link_host/linked-outside"
mkdir -p "$tmp_link_host/.spipe"
if ln -s "$tmp_link_outside" "$tmp_link_host/linked-source" 2>/dev/null && [ -L "$tmp_link_host/linked-source" ]; then
  printf 'safe-target|linked-source\n' > "$tmp_link_host/.spipe/subproject_links.sdn"
  if SPIPE_HOST_ROOT="$tmp_link_host" sh scripts/setup-spipe-links.sh --dry-run >/dev/null 2>&1; then
    echo "setup accepted a subproject source beneath an escaping symbolic-link ancestor" >&2
    exit 1
  fi
  rm -f "$tmp_link_host/.spipe/subproject_links.sdn" "$tmp_link_host/linked-source"
fi
node cli/spipe.js doc-root "$tmp_link_host" | grep -q "^doc/llm_process$"
mkdir -p "$tmp_link_host/.spipe"
printf 'docs:\n  host_process_doc: doc/00_llm_process\n' > "$tmp_link_host/.spipe/config.sdn"
SPIPE_HOST_ROOT="$tmp_link_host" sh scripts/setup-spipe-links.sh --dry-run | grep -q "doc/00_llm_process/spipe"
node cli/spipe.js doc-root "$tmp_link_host" | grep -q "^doc/00_llm_process$"
node cli/spipe.js link-plan "$tmp_link_host" | grep -q "target=${tmp_link_host}/doc/00_llm_process/spipe"
;;
esac
(cd "$tmp_host" && node "$ROOT_DIR/cli/spipe.js" fine-tune-init >/dev/null)
test -f "$tmp_host/.spipe/llm-finetune-process/attempts/template.sdn"
mkdir -p "$tmp_host/doc/02_requirements/feature" "$tmp_host/doc/02_requirements/nfr"
cat > "$tmp_host/doc/02_requirements/feature/spipe_llm_finetune_process_options.md" <<'FEATURE_OPTIONS'
# SPipe LLM Fine-Tune Process Requirement Options

## Option A: Fine-Tune Process Scaffold

Requirements:
- Record fine-tune process evidence.

Pros: Auditable.
Cons: Scaffold only.
Effort: Medium.

## Option B: Local QLoRA-First Tuning Pipeline

Requirements:
- Record local QLoRA training evidence.

Pros: Local ownership.
Cons: Hardware dependent.
Effort: High.
FEATURE_OPTIONS
cat > "$tmp_host/doc/02_requirements/nfr/spipe_llm_finetune_process_options.md" <<'NFR_OPTIONS'
# SPipe LLM Fine-Tune Process NFR Options

## Option A: Auditability First

Targets:
- Durable attempt records.

Pros: Traceable.
Cons: Does not ensure speed.
Effort: Medium.

## Option B: Reproducibility First

Targets:
- Deterministic records and checksums.

Pros: Repeatable.
Cons: More setup.
Effort: High.
NFR_OPTIONS
(cd "$tmp_host" && node "$ROOT_DIR/cli/spipe.js" fine-tune-options | grep -q "A: Fine-Tune Process Scaffold")
(cd "$tmp_host" && node "$ROOT_DIR/cli/spipe.js" fine-tune-select-requirements select_check A,B A,B tester "build check" >/dev/null)
test -f "$tmp_host/doc/02_requirements/feature/spipe_llm_finetune_process.md"
test -f "$tmp_host/doc/02_requirements/nfr/spipe_llm_finetune_process.md"
grep -q "Selected option: Option A: Fine-Tune Process Scaffold -> Option B: Local QLoRA-First Tuning Pipeline" "$tmp_host/doc/02_requirements/feature/spipe_llm_finetune_process.md"
grep -q "Selected option: Option A: Auditability First -> Option B: Reproducibility First" "$tmp_host/doc/02_requirements/nfr/spipe_llm_finetune_process.md"
test ! -f "$tmp_host/doc/02_requirements/feature/spipe_llm_finetune_process_options.md"
test ! -f "$tmp_host/doc/02_requirements/nfr/spipe_llm_finetune_process_options.md"
(cd "$tmp_host" && node "$ROOT_DIR/cli/spipe.js" fine-tune-record-data build_check sample https://example.invalid/data.txt not-applicable "echo no-download" .spipe/cache/sample none >/dev/null)
(cd "$tmp_host" && node "$ROOT_DIR/cli/spipe.js" fine-tune-record-data-check build_check sample .spipe/cache/sample skipped none "build check" >/dev/null)
(cd "$tmp_host" && node "$ROOT_DIR/cli/spipe.js" fine-tune-scaffold-process-docs process_scaffold process_scaffold "Process Scaffold" >/dev/null)
test -f "$tmp_host/doc/01_research/local/process_scaffold.md"
test -f "$tmp_host/doc/03_plan/agent_tasks/process_scaffold.md"
(cd "$tmp_host" && node "$ROOT_DIR/cli/spipe.js" fine-tune-record-process build_check research.md req.md nfr.md plan.md arch.md design.md >/dev/null)
(cd "$tmp_host" && node "$ROOT_DIR/cli/spipe.js" fine-tune-record-requirements build_check option-a nfr-a user req.md "build check" >/dev/null)
(cd "$tmp_host" && node "$ROOT_DIR/cli/spipe.js" fine-tune-record-model-research build_check candidate mit 8192 code-fit local-ok selected >/dev/null)
(cd "$tmp_host" && node "$ROOT_DIR/cli/spipe.js" fine-tune-record-model-arch build_check arch.md adapter data-strategy train-strategy local fallback >/dev/null)
(cd "$tmp_host" && node "$ROOT_DIR/cli/spipe.js" fine-tune-scaffold-model-arch build_check doc/04_architecture/build_check_model.md adapter data-strategy train-strategy local fallback >/dev/null)
test -f "$tmp_host/doc/04_architecture/build_check_model.md"
(cd "$tmp_host" && node "$ROOT_DIR/cli/spipe.js" fine-tune-record-method build_check provider-fine-tune "build check" try-other-way user >/dev/null)
(cd "$tmp_host" && node "$ROOT_DIR/cli/spipe.js" fine-tune-record-model build_check not-selected none "build check" none >/dev/null)
(cd "$tmp_host" && node "$ROOT_DIR/cli/spipe.js" fine-tune-scaffold-training build_check provider-fine-tune .spipe/llm-finetune-process/scripts/build_check_train.sh not-created >/dev/null)
test -x "$tmp_host/.spipe/llm-finetune-process/scripts/build_check_train.sh"
(cd "$tmp_host" && node "$ROOT_DIR/cli/spipe.js" fine-tune-record-training build_check dry-run provider-managed "echo train" model://dry-run >/dev/null)
(cd "$tmp_host" && node "$ROOT_DIR/cli/spipe.js" fine-tune-record-eval build_check "echo eval" "accuracy=1" "accuracy>=1" pass >/dev/null)
(cd "$tmp_host" && node "$ROOT_DIR/cli/spipe.js" fine-tune-record-decision build_check try-other-way requirements-selection next "build check" >/dev/null)
(cd "$tmp_host" && node "$ROOT_DIR/cli/spipe.js" fine-tune-create-retry build_check build_retry "retry build check" app >/dev/null)
test -f "$tmp_host/.spipe/llm-finetune-process/attempts/build_retry.sdn"
grep -q 'next_attempt: "build_retry"' "$tmp_host/.spipe/llm-finetune-process/retune_requests.sdn"
(cd "$tmp_host" && node "$ROOT_DIR/cli/spipe.js" fine-tune-new-attempt verify_loop_source "verify loop source" app >/dev/null)
(cd "$tmp_host" && node "$ROOT_DIR/cli/spipe.js" fine-tune-record-verify-loop verify_loop_source "echo eval" "score=0" "score>=1" fail retry-tuning-method tuning-method verify_loop_retry "build check" >/dev/null)
test -f "$tmp_host/.spipe/llm-finetune-process/attempts/verify_loop_retry.sdn"
grep -q 'next_attempt: "verify_loop_retry"' "$tmp_host/.spipe/llm-finetune-process/retune_requests.sdn"
(cd "$tmp_host" && node "$ROOT_DIR/cli/spipe.js" fine-tune-new-attempt build_check "build check" app >/dev/null)
(cd "$tmp_host" && node "$ROOT_DIR/cli/spipe.js" fine-tune-record-app build_check app runtime doc.md >/dev/null)
(cd "$tmp_host" && node "$ROOT_DIR/cli/spipe.js" fine-tune-record-retune build_check eval-failed eval.md next requirements-selection >/dev/null)
(cd "$tmp_host" && node "$ROOT_DIR/cli/spipe.js" fine-tune-app-handoff build_check | grep -q "SPipe LLM App/Server Handoff")
(cd "$tmp_host" && node "$ROOT_DIR/cli/spipe.js" fine-tune-status build_check >/dev/null)
(cd "$tmp_host" && node "$ROOT_DIR/cli/spipe.js" fine-tune-doctor build_check | grep -q "STATUS: WARN llm-finetune-doctor")
(cd "$tmp_host" && node "$ROOT_DIR/cli/spipe.js" fine-tune-data-plan build_check | grep -q "data_checks")
(cd "$tmp_host" && node "$ROOT_DIR/cli/spipe.js" fine-tune-next missing_check | grep -q "next_action=create-attempt")
(cd "$tmp_host" && node "$ROOT_DIR/cli/spipe.js" fine-tune-next build_check | grep -q "next_action=base-model-selection")
(cd "$tmp_host" && node "$ROOT_DIR/cli/spipe.js" fine-tune-new-attempt registry_ready "registry ready check" app >/dev/null)
(cd "$tmp_host" && node "$ROOT_DIR/cli/spipe.js" fine-tune-record-requirements registry_ready option-a nfr-a user req.md "build check" >/dev/null)
(cd "$tmp_host" && node "$ROOT_DIR/cli/spipe.js" fine-tune-record-model-research registry_ready candidate mit 8192 code-fit local-ok selected >/dev/null)
(cd "$tmp_host" && node "$ROOT_DIR/cli/spipe.js" fine-tune-model-method-options registry_ready | grep -q "provider-fine-tune")
(cd "$tmp_host" && node "$ROOT_DIR/cli/spipe.js" fine-tune-select-model-method registry_ready base-model rev1 local provider-fine-tune user retry-base-model "build check" >/dev/null)
(cd "$tmp_host" && node "$ROOT_DIR/cli/spipe.js" fine-tune-record-training registry_ready provider-fine-tune provider-managed "provider train" model://registry-ready >/dev/null)
(cd "$tmp_host" && node "$ROOT_DIR/cli/spipe.js" fine-tune-record-decision registry_ready accepted none none "build check" >/dev/null)
(cd "$tmp_host" && node "$ROOT_DIR/cli/spipe.js" fine-tune-ready registry_ready >/dev/null)
(cd "$tmp_host" && node "$ROOT_DIR/cli/spipe.js" fine-tune-doctor registry_ready | grep -q "STATUS: PASS llm-finetune-doctor")
cat > "$tmp_host/.spipe/llm-finetune-process/attempts/ready_check.sdn" <<'READY'
attempt:
  attempt_id: "ready_check"
  goal: "ready check"
research:
  research_doc: "research.md"
model:
  base_model: "base-model"
  base_model_reason: "build check"
tuning:
  method: "provider-fine-tune"
  training_script: "provider-managed"
  training_command: "provider train"
  model_artifact: "model://ready"
evaluation:
  eval_command: "echo eval"
  metrics: "accuracy=1"
  target: "accuracy>=1"
  result: "pass"
decision:
  status: "accepted"
READY
(cd "$tmp_host" && node "$ROOT_DIR/cli/spipe.js" fine-tune-record-requirements ready_check option-a nfr-a user req.md "build check" >/dev/null)
(cd "$tmp_host" && node "$ROOT_DIR/cli/spipe.js" fine-tune-ready ready_check >/dev/null)
(cd "$tmp_host" && node "$ROOT_DIR/cli/spipe.js" fine-tune-next ready_check | grep -q "next_action=ready")
cat > "$tmp_host/.spipe/llm-finetune-process/attempts/full_verify.sdn" <<'VERIFY'
attempt:
  attempt_id: "full_verify"
  goal: "full verify"
  app_or_server_target: "app"
research:
  research_doc: "doc/01_research/local/full_verify.md"
  data_sources:
    - name: "sample"
      source: "https://example.invalid/data.txt"
      license: "not-applicable"
      download_command: "echo no-download"
      checksum: "none"
      cache_path: ".spipe/cache/sample"
requirements:
  feature_option: "A"
  nfr_option: "A"
  selected_by: "build"
  selection_doc: "doc/02_requirements/feature/full_verify.md"
process_docs:
  requirements_doc: "doc/02_requirements/feature/full_verify.md"
  nfr_doc: "doc/02_requirements/nfr/full_verify.md"
  plan_doc: "doc/03_plan/agent_tasks/full_verify.md"
  architecture_doc: "doc/04_architecture/full_verify.md"
  design_doc: "doc/05_design/full_verify.md"
model_research:
  research_doc: "doc/01_research/domain/full_verify_model.md"
  candidate_model: "base-model"
  license: "test"
  context_length: "8192"
  fit: "build check"
  constraints: "none"
  decision: "selected"
model:
  base_model: "base-model"
  base_model_revision: "rev1"
  base_model_reason: "build check"
  deployment_target: "local"
tuning:
  method: "provider-fine-tune"
  training_script: "provider-managed"
  training_command: "provider train"
  model_artifact: "model://full-verify"
evaluation:
  eval_command: "echo eval"
  metrics: "accuracy=1"
  target: "accuracy>=1"
  result: "pass"
decision:
  status: "accepted"
  retry_target: "none"
  next_attempt: "none"
  notes: "build check"
app_handoff:
  app_target: "app"
  usage: "runtime"
  handoff_doc: "doc/05_design/full_verify_app.md"
VERIFY
(cd "$tmp_host" && node "$ROOT_DIR/cli/spipe.js" fine-tune-verify .spipe/llm-finetune-process/attempts/full_verify.sdn | grep -q "STATUS: PASS llm-finetune-attempt-record")
(cd "$tmp_host" && node "$ROOT_DIR/cli/spipe.js" fine-tune-report build_check | grep -q "SPipe Fine-Tune Attempt Report")
test -f "$tmp_host/.spipe/llm-finetune-process/data_downloads.sdn"
test -f "$tmp_host/.spipe/llm-finetune-process/data_checks.sdn"
test -f "$tmp_host/.spipe/llm-finetune-process/process_docs.sdn"
test -f "$tmp_host/.spipe/llm-finetune-process/requirements_selection.sdn"
test -f "$tmp_host/.spipe/llm-finetune-process/model_research.sdn"
test -f "$tmp_host/.spipe/llm-finetune-process/model_architecture.sdn"
test -f "$tmp_host/.spipe/llm-finetune-process/tuning_methods.sdn"
test -f "$tmp_host/.spipe/llm-finetune-process/models.sdn"
test -f "$tmp_host/.spipe/llm-finetune-process/training_scripts.sdn"
test -f "$tmp_host/.spipe/llm-finetune-process/eval_results.sdn"
test -f "$tmp_host/.spipe/llm-finetune-process/decisions.sdn"
test -f "$tmp_host/.spipe/llm-finetune-process/app_handoffs.sdn"
test -f "$tmp_host/.spipe/llm-finetune-process/retune_requests.sdn"

echo "spipe_build_status=pass"
