param(
    [switch]$Force,
    [switch]$DryRun,
    [string]$HostRoot = "",
    [string]$SubprojectLinks = ""
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

if ($SubprojectLinks -eq "") {
    $SubprojectLinks = Join-Path $HostRoot ".spipe\subproject_links.sdn"
}

if (-not (Test-Path $SubprojectLinks)) {
    Write-Output "subproject_links_config=missing"
    exit 0
}

Get-Content $SubprojectLinks | ForEach-Object {
    $Line = $_.Trim()
    if ($Line -eq "" -or $Line.StartsWith("#")) {
        return
    }

    $Parts = $Line.Split("|", 2)
    if ($Parts.Count -ne 2 -or $Parts[0] -eq "" -or $Parts[1] -eq "") {
        Write-Output "skip_invalid_subproject_link $Line"
        return
    }

    $TargetRel = $Parts[0]
    $SourceRel = $Parts[1]
    $Source = Join-Path $HostRoot $SourceRel
    $Target = Join-Path $HostRoot $TargetRel

    if (-not (Test-Path $Source)) {
        Write-Output "skip_missing_subproject_source $TargetRel"
        return
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
        if (-not $Force) {
            Write-Output "skip_existing_subproject $TargetRel"
            return
        }
        if ($DryRun) {
            Write-Output "would_replace_subproject $TargetRel"
            return
        }
        Remove-Item $Target -Recurse -Force
    }

    if ($DryRun) {
        Write-Output "would_link_subproject $TargetRel"
        return
    }

    New-Item -ItemType Junction -Path $Target -Target $Source | Out-Null
    Write-Output "linked_subproject $TargetRel"
}
