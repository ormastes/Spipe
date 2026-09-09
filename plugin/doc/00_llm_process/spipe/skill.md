# SPipe Test Writing Skill

SPipe is Simple's BDD testing framework (formerly **SPipe**, renamed 2026-04-26).
`describe`, `it`, `expect` are **built-in** -- no import needed.

## Quick Start

```simple
describe "Calculator":
    context "addition":
        it "adds two numbers":
            expect(2 + 2).to_equal(4)
```

Run: `bin/simple test path/to/spec.spl`

## Matchers (built-in only)

| Matcher | Usage |
|---------|-------|
| `.to_equal(expected)` | Equality check |
| `.to_be(expected)` | Identity/equality |
| `.to_be_nil` | Nil check |
| `.to_contain(item)` | Collection/string contains |
| `.to_start_with(prefix)` | String prefix |
| `.to_end_with(suffix)` | String suffix |
| `.to_be_greater_than(n)` | Numeric comparison |
| `.to_be_less_than(n)` | Numeric comparison |

Use `.to_equal(true)` NOT `.to_be_true()`. Use `.to_equal()` NOT `.to(eq())`.

## Spec File Structure

### 1. Module-Level Docstring (REQUIRED)

```simple
"""
# Feature Name Specification

**Feature IDs:** #100-110
**Category:** Language | Stdlib | Runtime | Testing | Tooling
**Status:** Draft | In Progress | Implemented | Complete
**Requirements:** doc/02_requirements/feature/feature.md (or N/A)

## Overview
What this feature does and why.
"""
```

### 2. Test Groups with Docstrings

```simple
describe "MyFeature":
    """## Basic Usage -- description."""
    context "when condition":
        """### Scenario: specific case."""
        it "does expected behavior":
            expect(actual).to_equal(expected)
```

### 3. Coverage Target (REQUIRED for system tests)

System test files (`test/system/**`) MUST include `# @cover` annotations at the top.

### 4. Template: `cp .claude/templates/spipe_template.spl test/my_spec.spl`

## BDD Syntax

### Hooks

```simple
context "with setup":
    before_each:
        setup()
    after_each:
        cleanup()
    it "preserves prepared state":
        expect(current_state()).to_equal("ready")
```

## Test Types

| Type | Keyword | Behavior |
|------|---------|----------|
| Regular | `it "..."` | Runs by default |
| Slow | `slow_it "..."` | Run with `--only-slow` |
| Skipped | `skip_it "..."` | Skipped in interpreter, runs compiled |
| Pending | `pending "reason"` | Marked pending |

## Doc Generation

```bash
bin/simple doc-gen    # Output: doc/06_spec/generated/
```

## Critical Rules

- NEVER add `#[ignore]` without user approval
- One assertion concept per test
- Clear names: `it "adds two positive numbers":` not `it "works":`
- Use `"""..."""` docstrings (not `#` comments) for generated docs
- Run tests after writing: `bin/simple test test/my_spec.spl`

## Modern SSpec Score ≥ 90 — REQUIRED checklist (measured 2026-09-05)

Every spec this skill produces MUST score **≥ 90**. Agent-authored specs that
miss the score are a **skill defect** — fix this checklist first, then the spec.

### How to score (the only invocation that works on this host)

```bash
/Users/ormastes/simple/src/compiler_rust/target/bootstrap/simple \
  run src/app/sspec_maintain/main.spl scan <spec-path>
```

~6 s per spec, exit 0. **`bin/simple` cannot do this** — it currently resolves to
a bootstrap-only binary with no `run`, `test`, or `sspec-maintain` subcommand
(`bin/simple run x.spl` → `error: unknown command 'run'`). The Jul-25 stage4
binary at `bin/release/aarch64-apple-darwin/simple` also fails, on a *different*
cause: it cannot parse current source. Check `--version`: `simple-bootstrap`
means the wrong binary. See
`doc/08_tracking/bug/stale_deployed_binaries_reject_current_language_sspec_scorer_unrunnable_2026-09-05.md`.

### The budget (know it before you write)

```
raw       = (narrative*15 + structure*15 + oracle*20 + traceability*15
             + evidence*15 + coverage*10 + maintainability*10) / 100
effective = 49 if ANY blocker, else raw
```

Each dimension starts at 100 and loses each finding's deduction. So one
dimension point costs **0.20** aggregate in oracle, **0.15** in
narrative/structure/traceability/evidence, **0.10** in coverage/maintainability.

**The ceiling on a bootstrap host is exactly 90/100, not 100.** Five findings are
mirror-only and cannot be cleared without `spipe-docgen`, which needs a full CLI:
MNT-002 (−25 mnt), MNT-005 (−10 mnt), MNT-008 (−20 mnt), EVD-002 (−15 evd),
EVD-003 (−15 evd).

This was measured two independent ways on 2026-09-05, and both landed on the
same number with the *same five* residual findings:

- a minimal synthetic spec built from this checklist → **90/100**;
- the existing in-tree spec `test/01_unit/app/sspec_maintain/scorer_loopholes_spec.spl`
  → **90/100**, residual findings exactly
  `EVD-002 EVD-003 MNT-002 MNT-005 MNT-008`.

So **90 is both the target and the practical ceiling on the `scan` surface
today.** A spec scoring 88 is missing something real and cheap; a spec at 90 has
hit the wall. Do not burn hours chasing 95 on this surface.

**Caveat — that wall is partly a scorer defect, filed 2026-09-05.** `scan`
applies the manual-content rules (MNT-005, MNT-008, EVD-002, EVD-003) even when
**no mirror file exists at all**, penalising one missing mirror five times on top
of MNT-002. Proven: scanning a spec with no mirror emits EVD-002/MNT-008 findings
citing a `doc/06_spec/....md` path that is not on disk. The documented contract
(`.claude/skills/spipe.md`, SCAN row) says those four rules apply "only when a
mirror exists", and the independent lane
`scripts/check/sspec-score-seed-lane.shs` implements it that way — it scores the
same mirror-less spec **97**, not 90. Until that is resolved, treat 90 as the
target because it is what the gate measures, but do not read it as a statement
about spec quality.

### How 90 is actually reached — the one sentence that matters

**Clear every finding except the five mirror-only ones, and you land on exactly
90.** The five you cannot clear on this host are `MNT-002`, `MNT-005`,
`MNT-008`, `EVD-002`, `EVD-003`. **Every other rule ID is source-fixable and must
be driven to zero** — including `EVD-001` and `MNT-001/003/004/006/007/009`,
which live in the evidence and maintainability dimensions and are easy to mistake
for mirror problems because they share a dimension with them.

The arithmetic, using the real exemplar:

```
mnt = 100 −25(MNT-002) −10(MNT-005) −20(MNT-008) = 45
evd = 100 −15(EVD-002) −15(EVD-003)              = 70
raw = (100*15 + 100*15 + 100*20 + 100*15 + 70*15 + 100*10 + 45*10)/100 = 90
```

So **every single point you lose on the source side puts 90 out of reach.** There
is no slack to spend. A worker that reaches 84 and concludes "the mirror rules
make 90 impossible" has misread the situation — it has ~6 points of *source-side*
loss it did not fix. Measured 2026-09-05: a low-effort worker without this
paragraph stalled at 84/78/78 and reported 90 as unreachable, while
`scorer_loopholes_spec.spl` sits at 90 with all five mirror findings present.

Worked example of the trap, measured on `test/01_unit/app/spipe/balance_score_spec.spl`:
it has **zero** NAR/BEH/ORA/TRC/COV findings and still scores **84**, because
`EVD-001` fires three times (−30 evd) and `MNT-001` once (−15 mnt). Both are
source-fixable. Clearing them takes it to exactly 90. A worker that filtered for
"source dimensions" and saw none would have wrongly declared it finished.

Practically: list the findings, delete the five mirror-only IDs from that list,
and fix **every remaining one**. Do not stop early, and never treat the mirror
findings as evidence that you are done.

### Where the points actually go (measured, not guessed)

`sh scripts/check/sspec-train.shs <dir>` scores a tree and prints a per-rule
histogram. Measured over `test/01_unit/app/sspec_maintain/` (7 specs), the
point-loss ranking was:

| rule | fired | points lost | source-side fixable? |
|---|---:|---:|---|
| MNT-002 stale mirror | 7 | 175 | no — needs `spipe-docgen` |
| **EVD-001 no capture in stepped scenario** | **12** | **120** | **yes — biggest win available** |
| EVD-002 steps absent from manual | 6 | 90 | no — mirror |
| MNT-008 incomplete manual | 4 | 80 | no — mirror |
| ORA-002 pseudo-oracle | 1 | 50 | yes — blocker |
| NAR-001 / ORA-003 | 2 / 2 | 40 / 40 | yes |
| MNT-009 fabricated lifecycle path | 3 | 30 | yes |

A second run over the 7 spipe specs in `test/01_unit/std/` + `test/02_integration/app/`
gave a **different** source-side profile — BEH-001 (13 fires, 130 pts),
NAR-001 (6, 120), TRC-001 (4, 80), MNT-001 (5, 75), MNT-007 (5, 50) — none of
them the EVD-001 that dominated the other tree. Those seven scored 74–87 with
**zero blockers**, i.e. they are all within cheap reach of 90.

Read the two runs together as: **the mirror rules always dominate and you can
never fix them here, so ignore them; past that, which cheap rule bites depends on
the tree, so satisfy all of them rather than optimising for one histogram.**
Rerun the histogram after a batch to see which rule this checklist is still
failing to convey — a rule that keeps firing across batches is a defect in *this
file*, not in the specs.

### Blockers — any one caps the file at 49/100

- **`SSDOC-TRC-003`** — a `REQ-…` token that appears **outside an `it` body**.
  **This is the single most expensive mistake and the easiest to make.**
  Measured on two files differing by one line: `# @req REQ-X-001` placed above
  the `it` line scored **49**; the identical spec with that comment moved
  *inside* the `it` body scored **87**. Put every REQ id inside the scenario
  body. A header may name a REQ id only inside the `"""` docstring.
- `SSDOC-ORA-001` — no real executed assertion, or a `pending` / `pass_todo` /
  `pass_do_nothing` / `pass_dn` / `skip(` statement survives in any scenario.
  An in-development spec goes RED through a real failing assertion, never a
  pending marker.
- `SSDOC-ORA-002` — pseudo-oracle: asserting source-file text, or asserting a
  value the scenario itself just constructed. Assert what the product returned.
  A source-contract scenario (asserting a property of shipped source that HAS no
  runtime API) is legitimate, but only when the local is genuinely named for the
  contract (`val keeps_reverse_helper = source.contains(...)`) — never rename a
  local just to slip a tautology past the detector; if the scenario asserts a
  value it just constructed, replace it with a real product call.
- `SSDOC-TRC-002` — a REQ line carrying the word `planned` or `selected` whose
  id is never bound in an `it` body. Never write those words on a REQ line.

### The rest, in the order that buys the most score

1. **`SSDOC-MNT-007` (−10 mnt) needs ALL FOUR lifecycle kinds**, not "some".
   The file must contain the substrings `doc/01_research/`, `doc/03_plan/`,
   `doc/04_architecture/` **and** `doc/05_design/`. Measured: three of the four
   still takes the full −10; adding the missing `doc/03_plan/` line moved a spec
   89 → **90**.
2. **`SSDOC-MNT-009` (−10 mnt per path)** — every lifecycle path you write must
   **exist on disk**. `ls` it before writing it. A fabricated path costs more
   than the omission it was meant to fix.
3. `SSDOC-ORA-003` (−10 ora = −2 each, cap −30) — every numeric expected literal
   needs a `# oracle:` or `# explained:` marker **as a TRAILING comment on the
   very same line as the `expect(...)` call**. This is the single most-repeated
   worker mistake — two separate workers put the marker on its own line, saw the
   finding survive, and concluded the scorer "does not recognise `# oracle:`
   comments" and that 90 was unreachable. It does; the placement was wrong.

   ```simple
   # WRONG — own line. ORA-003 still fires.
   # oracle: the plan lists four groups
   expect(total).to_equal(4)

   # RIGHT — trailing, same line.
   expect(total).to_equal(4)  # oracle: the plan lists four groups
   ```

   The scorer matches per line, so a marker on the preceding line is invisible to
   it. If ORA-003 survives your edit, check placement before concluding anything
   about the scorer. The marker excuses ORA-003 only — it does **not** excuse an
   ORA-002 tautology.
4. `SSDOC-EVD-001` (−10 evd **per stepped scenario**, cap −30) — each scenario
   with a `step(` needs a capture in its body. Use the literal form
   `# @capture(<kind>): <what is retained>` (kinds: `tui_grid`, `gui_image`,
   `protocol_json`, `protocol_binary`, `bit_table`, `statistics`), or a real
   capture call. Prose like `# evidence(...)` does **not** score.
   **Trade-off, measured:** adding captures replaces the per-scenario EVD-001
   with a single EVD-003 (−15 evd). With 2+ stepped scenarios captures win
   (2×−10 → −15); with exactly one scenario they lose. Add captures when the
   spec has two or more stepped scenarios.
5. `SSDOC-BEH-001` (−10 str per scenario, cap −40) — every `it` body calls
   `step("Imperative sentence")` at least once.
6. `SSDOC-NAR-001` (−20 nar) — a top-of-file `"""` docstring whose first heading
   is `## Purpose and audience`.
7. `SSDOC-TRC-001` (−20 trc) — at least one `# @req REQ-*`, bound inside a body
   (see TRC-003 above).
8. `SSDOC-COV-001` (−20 cov) — name one adverse path. An `it` name must contain
   one of: negative, boundary, reject, invalid, recover, unsupported, ambigu,
   error. e.g. `it "rejects a negative amount as out of range"`.
9. `SSDOC-BEH-002` (−5 str per scenario) — outcome names, not `works` / `test` /
   `passes` / `should work`.
10. `SSDOC-MNT-001` (−15 mnt) — one `# @manual_section: <name>` above the
    `describe` when the file has more than one scenario.
11. `SSDOC-NAR-002` (−20 nar) — no `todo: describe`, `todo: author`,
    `description of this block`, `lorem ipsum` anywhere.
12. `SSDOC-NAR-003` (−15 nar) — never repeat an identical narrative comment line
    three or more times. One header block, not one per scenario.
13. `SSDOC-MNT-003` (−10) no bare line-start `@step `; `SSDOC-MNT-004` (−10) no
    `@internal` / `@qa-only` / `@execution-only`; `SSDOC-MNT-006` (−10) name a
    repeated setup helper `fn setup_<domain>()`.

### Never raise the score by weakening a test

Deleting an assertion, softening a matcher, or removing a scenario to clear a
finding is a failure, not a pass. If a rule can only be satisfied by damaging
the test, report the rule instead — that is a scorer defect, not a spec defect.

### Working exemplars in-tree (copy these, they are measured at 90/100)

`test/01_unit/app/sspec_maintain/scorer_loopholes_spec.spl` and
`scorer_loopholes_adjacent_spec.spl` both score **90/100** today. Read one before
writing a new spec — a real passing file beats any template. Note their
**four-heading docstring**; the four headings are what feed MNT-005 and MNT-008:

```
## Purpose and audience
## Operator workflow
## Compatibility and limitations
## Verification guidance and troubleshooting
```

### Measured 90/100 template (scored, not estimated)

```simple
"""
## Purpose and audience
<What this covers and for whom. Not a restatement of the test names.>
## Operator workflow
<The one command an operator runs.>
## Compatibility and limitations
<Where this does not run, and why.>
## Verification guidance and troubleshooting
<How an operator reruns this and what a failure means.>
"""
# Lifecycle: doc/01_research/<existing>.md ;
# doc/03_plan/<existing>.md ;
# doc/04_architecture/<existing>.md ;
# doc/05_design/<existing>.md
# @manual_section: <group-name>

use std.spec.{describe, it, expect}

describe "<subject>":
    it "<states the product outcome>":
        # @req REQ-<AREA>-001
        # @capture(bit_table): <what is retained for review>
        step("<Imperative action>")
        val total = <call the product>
        expect(total).to_equal(4)  # oracle: <why this value is authoritative>

    it "rejects <the adverse case>":
        # @req REQ-<AREA>-002
        # @capture(bit_table): <what is retained>
        step("<Imperative adverse action>")
        expect(<product verdict>).to_equal(false)
```

**Multi-line booleans:** continue naturally after a trailing `and`/`or` — do NOT
add `(...)` for line continuation (user directive 2026-09-05; see
`.claude/rules/language.md`).
