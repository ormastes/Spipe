param(
    [switch]$Force,
    [switch]$DryRun,
    [string]$HostRoot = "",
    [string]$SubprojectLinks = "",
    [string]$DocRoot = ""
)

$ErrorActionPreference = "Stop"

$ModuleRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
if ($HostRoot -eq "") {
    $HostRoot = (Resolve-Path (Join-Path $ModuleRoot "..\..")).Path
}

function Test-PathWithin([string]$Root, [string]$Candidate) {
    $RootPath = [IO.Path]::GetFullPath($Root).TrimEnd([IO.Path]::DirectorySeparatorChar, [IO.Path]::AltDirectorySeparatorChar)
    $CandidatePath = [IO.Path]::GetFullPath($Candidate).TrimEnd([IO.Path]::DirectorySeparatorChar, [IO.Path]::AltDirectorySeparatorChar)
    if ($CandidatePath.Equals($RootPath, [StringComparison]::OrdinalIgnoreCase)) { return $true }
    return $CandidatePath.StartsWith("$RootPath$([IO.Path]::DirectorySeparatorChar)", [StringComparison]::OrdinalIgnoreCase)
}

function Resolve-CanonicalDirectory([string]$Path, [int]$Depth = 0) {
    if ($Depth -gt 40) { throw "too many junction or symbolic-link levels: $Path" }
    $FullPath = [IO.Path]::GetFullPath($Path)
    if (-not (Test-Path -LiteralPath $FullPath -PathType Container)) {
        throw "path is not an existing directory: $Path"
    }

    $PathRoot = [IO.Path]::GetPathRoot($FullPath)
    $Current = $PathRoot
    foreach ($Segment in ($FullPath.Substring($PathRoot.Length) -split '[\\/]' | Where-Object { $_ -ne "" })) {
        $Current = Join-Path $Current $Segment
        $Item = Get-Item -LiteralPath $Current -Force
        if (($Item.Attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0) {
            $TargetValue = @($Item.Target)[0]
            if ([string]::IsNullOrWhiteSpace($TargetValue)) {
                throw "cannot resolve junction or symbolic link: $Current"
            }
            if (-not [IO.Path]::IsPathRooted($TargetValue)) {
                $TargetValue = Join-Path $Item.Parent.FullName $TargetValue
            }
            $Current = Resolve-CanonicalDirectory $TargetValue ($Depth + 1)
        }
    }
    return [IO.Path]::GetFullPath($Current)
}

function Resolve-CanonicalPath([string]$Path, [int]$Depth = 0) {
    if ($Depth -gt 40) { throw "too many junction or symbolic-link levels: $Path" }
    $Item = Get-Item -LiteralPath ([IO.Path]::GetFullPath($Path)) -Force
    if ($Item.PSIsContainer) { return Resolve-CanonicalDirectory $Item.FullName $Depth }
    if (($Item.Attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0) {
        $TargetValue = @($Item.Target)[0]
        if ([string]::IsNullOrWhiteSpace($TargetValue)) {
            throw "cannot resolve junction or symbolic link: $Path"
        }
        if (-not [IO.Path]::IsPathRooted($TargetValue)) {
            $TargetValue = Join-Path $Item.Parent.FullName $TargetValue
        }
        return Resolve-CanonicalPath $TargetValue ($Depth + 1)
    }
    $CanonicalParent = Resolve-CanonicalDirectory $Item.Parent.FullName $Depth
    return Join-Path $CanonicalParent $Item.Name
}

$HostRoot = [IO.Path]::GetFullPath($HostRoot)
if (-not (Test-Path -LiteralPath $HostRoot -PathType Container)) {
    throw "host repository does not exist: $HostRoot"
}
$NormalizedHostRoot = $HostRoot
$CanonicalHostRoot = Resolve-CanonicalDirectory $HostRoot

function Test-SafeRelativePath([string]$Value) {
    if ([string]::IsNullOrWhiteSpace($Value) -or [IO.Path]::IsPathRooted($Value) -or $Value -match '^[A-Za-z]:' -or $Value.EndsWith("/") -or $Value.EndsWith("\")) { return $false }
    $Segments = $Value -split '[\\/]'
    return -not ($Segments | Where-Object { $_ -eq "" -or $_ -eq "." -or $_ -eq ".." })
}

function Assert-SafeTargetParent([string]$Target) {
    $FullTarget = [IO.Path]::GetFullPath($Target)
    if (-not (Test-PathWithin $NormalizedHostRoot $FullTarget)) {
        throw "target path escapes the host repository: $Target"
    }

    $Cursor = Split-Path $FullTarget -Parent
    while (-not (Test-Path -LiteralPath $Cursor)) {
        $Next = Split-Path $Cursor -Parent
        if ($Next -eq $Cursor -or $Next -eq "") { throw "cannot resolve target parent: $Target" }
        $Cursor = $Next
    }
    if (-not (Test-Path -LiteralPath $Cursor -PathType Container)) {
        throw "target parent is not a directory: $Cursor"
    }
    $CanonicalParent = Resolve-CanonicalDirectory $Cursor
    if (-not (Test-PathWithin $CanonicalHostRoot $CanonicalParent)) {
        throw "target parent escapes the host repository through a junction or symbolic link: $Target"
    }
}

function Assert-SafeSource([string]$Source) {
    $CanonicalSource = Resolve-CanonicalPath $Source
    if (-not (Test-PathWithin $CanonicalHostRoot $CanonicalSource)) {
        throw "subproject source escapes the host repository through a junction or symbolic link: $Source"
    }
}

function Remove-SafeTarget([string]$Target) {
    Assert-SafeTargetParent $Target
    $Item = Get-Item -LiteralPath $Target -Force
    if (($Item.Attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0) {
        Remove-Item -LiteralPath $Target -Force
    } else {
        Remove-Item -LiteralPath $Target -Recurse -Force
    }
}

$SurfaceNames = @(
    "skill_command",
    "spipe",
    "template",
    "project_expert",
    "domain_expert",
    "tool_expert"
)

if ($DocRoot -eq "") {
    $EnvDocRoot = [Environment]::GetEnvironmentVariable("SPIPE_DOC_ROOT")
    if ($EnvDocRoot -ne $null -and $EnvDocRoot -ne "") {
        $DocRoot = $EnvDocRoot
    }
}

if ($DocRoot -eq "") {
    $ConfigPath = Join-Path $HostRoot ".spipe\config.sdn"
    if (Test-Path $ConfigPath) {
        foreach ($Line in Get-Content $ConfigPath) {
            if ($Line -match '^\s*host_process_doc:\s*([^\s#]+)') {
                $DocRoot = $Matches[1]
                break
            }
        }
    }
}

if ($DocRoot -eq "") {
    $DocRoot = "doc/llm_process"
}
if (-not (Test-SafeRelativePath $DocRoot)) {
    throw "doc root must stay inside the host repository: $DocRoot"
}

foreach ($Name in $SurfaceNames) {
    $Source = Join-Path $ModuleRoot "doc\00_llm_process\$Name"
    $Target = Join-Path $HostRoot (Join-Path $DocRoot $Name)
    $Rel = "$DocRoot/$Name"

    if (-not (Test-Path $Source)) {
        Write-Error "missing_source doc/00_llm_process/$Name"
    }

    $Parent = Split-Path $Target -Parent
    Assert-SafeTargetParent $Target
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

        Remove-SafeTarget $Target
    }

    if ($DryRun) {
        Write-Output "would_link $Rel"
        continue
    }

    Assert-SafeTargetParent $Target
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
    if (-not (Test-SafeRelativePath $TargetRel) -or -not (Test-SafeRelativePath $SourceRel)) {
        throw "subproject link paths must stay inside the host repository"
    }
    $Source = Join-Path $HostRoot $SourceRel
    $Target = Join-Path $HostRoot $TargetRel

    if (-not (Test-Path $Source)) {
        Write-Output "skip_missing_subproject_source $TargetRel"
        return
    }

    Assert-SafeSource $Source
    $Parent = Split-Path $Target -Parent
    Assert-SafeTargetParent $Target
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
        Remove-SafeTarget $Target
    }

    if ($DryRun) {
        Write-Output "would_link_subproject $TargetRel"
        return
    }

    Assert-SafeTargetParent $Target
    New-Item -ItemType Junction -Path $Target -Target $Source | Out-Null
    Write-Output "linked_subproject $TargetRel"
}
