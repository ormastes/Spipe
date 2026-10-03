# Simple native test binaries

Simple already has a compiled test runner. A request for test executables
"like GoogleTest" describes the workflow; it does not select a foreign test
framework. Research the existing runner, generated entries and CLI before
adding a framework, registry or listing protocol.

## Existing workflow

Read the Simple project's maintained
[native test binary guide](https://github.com/ormastes/simple/blob/release/1.0/doc/07_guide/infra/testing/native_test_binary_workflow.md)
for commands and runtime/producer requirements. Source-confirmed behavior at
Simple revision `d865e086eae9a0a9d92e51691b86f30721d39c9e`:

- `--native-backend=llvm` and `--native-backend=cranelift` select explicit AOT
  execution through the existing Simple test runner. Native/binary mode names
  alone do not establish machine-code execution; the ordinary Native route can
  compile an SMF artifact.
- The inspected AOT path preprocesses each spec using Simple's result-bearing
  wrapper, invokes `native-build`, executes the output directly and collects
  real Simple assertion results. An explicit AOT failure remains a failure.
- `--keep-artifacts` and `--verbose` preserve generated outputs and invocation
  evidence. The project's `scripts/bootstrap/run-native-aot-suite.shs` binds
  producer/runtime inputs and validates native evidence. Use the matching
  source revision and actual self-hosted runner/producer artifacts.
- The existing runner `--list` scans source test declarations. It is useful
  discovery evidence, but is not a count queried from the compiled executable.

For an aggregate executable, trace the existing aggregation entry and its
supported list/count options, then query that artifact before execution. The
per-spec route above does not establish whole-subsystem aggregation or a
binary-owned listing interface. An unresolved search is a research gap, not
proof that the feature is absent. Do not guess flags such as `--list-json` or
`--gtest_list_tests` from another framework.

## Evidence and scope

Record discovered cases, built executables, executed cases, pass/fail/skip
counts and blocked work separately. Source files, source assertions and compiler
modules are not interchangeable with executed test cases. Preserve generated
artifact paths, source/producer identities, raw exits and result logs. A
backend option is not proof of a dynamically loaded backend provider; retain
actual provider identity separately when dynamic loading is requested.

Follow the [build/debug continuation guide](build_debug_continuation.md) for
independent failures and bounded repairs. Project-specific suite matrices,
machine paths, current build status and receipts belong in the project or
authorized runtime scope. This common page describes source-confirmed behavior;
it does not certify a particular binary or suite as built or passing.

Implementation evidence is indexed in the Simple project's
[dated workflow research](https://github.com/ormastes/simple/blob/release/1.0/doc/01_research/local/simple_native_test_binary_workflow_2026-10-03.md).
Recheck changed runner behavior against the selected source revision.
