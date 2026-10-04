# Configured variants and compiler evidence

Use this programming guide when a project has configurable implementations behind stable interfaces, multiple compiler generations, or aggregate/runtime ABI repairs. Project-owned design and source remain authoritative; common guidance does not choose a GC, concurrency, backend, or platform profile for the user.

## Selection and ownership

Preserve the configured implementation and the importing module's family. A candidate fallback list is a lookup mechanism, not permission to overwrite an explicit selection. Compare discovery, frozen export selection, and HIR owner resolution: a fix in one stage does not prove parity in another. A deliberate physical leaf binding should preserve the public API and explain its boundary rather than globally pinning every import to one family.

Simple's original design keeps stable interfaces with configurable GC/no-GC and sync/async implementations. Rust/Pure-Simple resolver parity is active work; do not report it fixed based only on source review. The maintained project guide is [configured variants and aggregate validation](https://github.com/ormastes/simple/blob/release/1.0/doc/07_guide/compiler/configured_variants_and_aggregate_validation.md).

## Actual evidence

Record the producer executable, source revision, backend, runtime/linked-provider identity, relevant configuration and cache scope. Source repairs can remain invisible to an older producer. Classify those repeated failures as pending rebuilt-producer validation rather than manufacturing new leaf workarounds or borrowing another compiler's PASS.

For arrays and tuples, assert contents, destructuring, cross-module/generic returns, copy/mutation and lifetime boundaries, plus negative contracts. Include fresh/warm cache comparisons when relevant. A module count, file count, parser-only success, or archive export list is not an executed semantic result or selected-provider proof.

Use the project's existing test binaries and inventory/listing facilities; enumerate registered cases before running where supported, then retain actual pass/fail/skip and zero-case results. Do not invent an external framework or silently count sources instead of registered tests.

## Maintained versus generated guidance

This file is an authored common programming guide linked from the common wiki and skills indexes. `doc/00_llm_process/skill_command/skills/codex/coding/skill.md` is a managed generated artifact named `codex_coding_skill`; its body must not be edited as an independent source. The Simple manifest maps that record to `.codex/skills/coding/SKILL.md`. Update the canonical source and use the owning generation/validation contract when refreshing that output.

This change regenerates the managed body from [canonical Simple coding source at 3af5e46e0b4](https://github.com/ormastes/simple/blob/3af5e46e0b4/.codex/skills/coding/SKILL.md), using the owning generator's raw passthrough and SHA256 marker rule. The source/body digest is `eb4eb44046b04476ea47c24cbb51de597e57f441163c254c99f7d08d33826574`. Narrow offline regeneration validates the previous managed body before replacement. It does not claim that the self-hosted generator or compiler/runtime tests ran.

The user's robust array/tuple authored plan is still unidentified. Historical plans and research options are not an approved redesign by implication. Narrow confirmed bugs and evidence collection can proceed while that exact scope is located.
