# Windows Host, Antivirus, and Install/Deploy Tool Expert

## Role

Own process knowledge for Windows developer hosts in SPipe-managed projects.
That covers antivirus (AV) scanning overhead during builds, supported ways to
add exclusions, and how to install and deploy a project's tools. Recorded
2026-09-24. Items marked **unverified** or **intended** are not proven current
behaviour.

The project-specific reference is the Simple repository guide
`doc/07_guide/infra/toolchain/windows_install_deploy_antivirus_2026-09-24.md`
([ormastes/simple](https://github.com/ormastes/simple)). It has the exact
bootstrap entry, the toolchain pins, and the script behaviour.

## First: Dev Drive and measurement, before any exclusion

1. **Check for a Dev Drive.** Run `fsutil devdrv query <drive>`; it needs
   admin. A trusted Dev Drive with no filter attached is not scanned at all,
   so exclusions for paths on it add nothing. Recommendation: put checkouts
   and builds on a trusted Dev Drive, and exclude only what must live on a
   normal volume. Never detach filters with `fsutil devdrv setfiltersallowed`.
2. **Measure what Defender scans.** Both commands need admin. Keep the `.etl`
   file outside the checkout.

   ```powershell
   New-MpPerformanceRecording -RecordTo <etl> -Seconds 30
   Get-MpPerformanceReport -Path <etl> -TopProcesses 10 -TopFiles 10 -TopExtensions 10
   ```

   On the Simple reference host (2026-09-24), MsMpEng was using about 1.7
   cores with no scheduled scan running:
   - `grep.exe` took 27.3 s of scan time in 30 s, over 2,847 source files in
     a C: checkout.
   - `git.exe` took 2.5 s, over pack `.idx` files.

   A recursive grep over a source tree on a normal volume was the dominant
   cost. The fix is a Dev Drive checkout, not excluding the sources.

## Command entry points (reference implementation)

The Simple repository ships a Microsoft Defender script. PR #1460 added it,
and PR #1462 changed it to resolve its scope from the storage roots and to add
the stage compilers as processes:

```sh
sh scripts/setup/windows-defender-exclusions.shs list     # plan only, changes nothing
sh scripts/setup/windows-defender-exclusions.shs add      # add, then verify
sh scripts/setup/windows-defender-exclusions.shs remove   # remove exactly this set, then verify
```

A project that adopts this pattern should keep these properties:

- **Exclude generated output only.** Exclude build output directories,
  caches, and the project's own freshly built compiler or tool binaries as
  processes. Never exclude the source tree, a drive root, a whole user
  profile, or a download directory.
- **Resolve the paths, do not guess them.** Derive them from the project's
  storage-root resolver and from the script's own location, so that running it
  in a worktree covers that worktree. If the paths cannot be resolved, fail
  (exit 2) instead of guessing.
- **Use path and process exclusions together.** A path exclusion stops
  scanning of files *in* a directory. A process exclusion stops scanning of
  files a process *opens*, which for a compiler means the sources it reads.
  List the binaries a build creates at their expected paths, even before they
  exist.
- **Elevate only the one Defender call,** through a single UAC prompt. If the
  user declines, nothing changes. Verify by reading `Get-MpPreference` back,
  and end with a PASS, FAIL, or ERROR verdict line.
- **Keep it cheap.** Two or three `powershell.exe` starts and at most one
  bounded `find`. Never scan a whole drive, and keep it off every build and
  push path.

Defender exclusions take effect as soon as they are registered, with no
reboot. Path exclusions apply to new file activity immediately. Treat process
exclusions as applying from the next launch of the process.

## Setup and authentication

- Do not run the project's build or bootstrap as Administrator. Only the
  Defender registration needs elevation.
- To see which AV products are registered:
  `Get-CimInstance -Namespace root/SecurityCenter2 -ClassName AntiVirusProduct`.
  This namespace does not exist on Windows Server. Only the `Windows Defender`
  display name has been checked. Third-party names are **unverified**, so match
  them by substring, not by exact string.
- **Security Center detection is not sufficient on its own.** On the Simple
  reference host it listed only Windows Defender, even though
  `C:\Program Files\AhnLab\Safe Transaction` was installed and showed up in
  Defender's performance report. That product is banking security, not a
  registered antivirus. Also list the well-known vendor install directories,
  such as `C:\Program Files\AhnLab\`. Do not run a drive-wide search.
- Toolchain (Simple policy, 2026-09-24): clang only. On Windows use
  `clang-cl` and `lld-link`. `link.exe` is allowed only as Rust's MSVC-target
  linker. Other projects set their own policy.
- After a Windows checkout, materialize symlinks with the project's script.
  Never `git add -A` afterwards, because materialized symlinks appear as
  changes.

## Third-party AV

Only Microsoft Defender has a supported automation path. The rest:

- **ESET:** `ecmd /setcfg` imports a whole signed config. Kaspersky Endpoint
  `avp.com IMPORT` imports a whole settings file and needs password protection
  enabled. Both need the owner or admin to enable something first.
- **Bitdefender GravityZone:** `product.console.exe` works only through a
  Power User module that the admin has enabled.
- **GUI or management console only:** AhnLab V3 (Lite, 365 Clinic, IS 9.0),
  ALYac, Norton, McAfee consumer, Trellix ENS, Avast/AVG, Trend Micro, and
  Sophos.
- **Naver Vaccine for PC** was discontinued on 2023-11-30.

All of this comes from web-search extracts, not full vendor pages. The
following are **unverified**:

- ESET's exclusion XML node
- the exact Bitdefender on-access verb
- Kaspersky trusted-zone import as a CLI
- the ALYac Enterprise policy steps
- Norton's older menu path
- Sophos Home detail
- AhnLab's and ALYac's false-positive email addresses

Do not present any of these CLI commands as working until someone runs one.

Hard rules:

- Never bypass tamper protection or self-protection.
- Never recommend `fsutil devdrv setfiltersallowed`, because it removes
  protection.
- On managed machines, exclusions belong in the vendor console and are the
  admin's decision.

A Dev Drive gives Defender's asynchronous performance mode. Third-party AV
attaches to Dev Drives by default, so a Dev Drive helps less on a machine
running another product. `fsutil devdrv query` shows which filters are
attached.

## Install and deploy for end users

- An installer must never silently add AV exclusions. Malware does this, and
  Defender may flag the installer. Any opt-in must ask first and must offer
  removal.
- Code signing does not exempt files from on-access scanning and does not
  speed up builds. It helps downloaded releases with SmartScreen and with
  false-positive handling.
  - SignPath Foundation is free for qualifying open source.
  - Azure Artifact Signing costs about $9.99/month.
  - Since 2024, EV certificates no longer skip SmartScreen reputation.

## Verification

- `list` prints the plan and ends with `PASS — <n> exclusion(s) planned`.
- `add` ends with `PASS — <n> exclusion(s) verified present`.
- Run it again after the first deploy, so that new binaries are covered.

## Known failure modes

- **A file change during bootstrap preflight** (adding files to the checkout,
  or writing logs into it) aborts preflight. Keep logs outside the checkout.
- **Do not blame AV without a controlled repro.** The Simple Stage 2 pre-exec
  refusal (no log created, no diagnostic) looked like AV blocking a fresh
  unsigned binary. It was ruled out on 2026-09-24: the refusal reproduced
  identically with every stage compiler process-excluded, and again on an
  unfiltered Dev Drive. Before attributing a failure to AV, repeat the run
  with the exclusion in place or on an unfiltered Dev Drive.
- **A declined UAC prompt** gives `FAIL — add not applied`, and nothing is
  changed.
