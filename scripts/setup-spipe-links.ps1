param(
    [switch]$Force,
    [switch]$DryRun,
    [string]$HostRoot = ""
)

$ErrorActionPreference = "Stop"

$ModuleRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
if ($HostRoot -eq "") {
    $HostRoot = (Resolve-Path (Join-Path $ModuleRoot "..\..")).Path
}

$Links = @(
    "doc/00_llm_process/skill_command",
    "doc/00_llm_process/spipe",
    "doc/00_llm_process/template",
    "doc/00_llm_process/project_expert",
    "doc/00_llm_process/domain_expert",
    "doc/00_llm_process/tool_expert"
)

foreach ($Rel in $Links) {
    $Source = Join-Path $ModuleRoot $Rel
    $Target = Join-Path $HostRoot $Rel

    if (-not (Test-Path $Source)) {
        Write-Error "missing_source $Rel"
    }

    $Parent = Split-Path $Target -Parent
    if (-not (Test-Path $Parent)) {
        if ($DryRun) {
            Write-Output "would_mkdir $Parent"
        } else {
            New-Item -ItemType Directory -Path $Parent -Force | Out-Null
        }
    }

    if (Test-Path $Target) {
        $Item = Get-Item $Target -Force
        if ($Item.LinkType -and $Item.Target -eq $Source) {
            Write-Output "ok $Rel"
            continue
        }

        if (-not $Force) {
            Write-Output "skip_existing $Rel"
            continue
        }

        if ($DryRun) {
            Write-Output "would_replace $Rel"
            continue
        }

        Remove-Item $Target -Recurse -Force
    }

    if ($DryRun) {
        Write-Output "would_link $Rel"
        continue
    }

    New-Item -ItemType Junction -Path $Target -Target $Source | Out-Null
    Write-Output "linked $Rel"
}
