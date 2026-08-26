$ErrorActionPreference = "Stop"

$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$SetupScript = Join-Path $RepoRoot "scripts\setup-spipe-links.ps1"
$Scratch = Join-Path ([IO.Path]::GetTempPath()) ("spipe-links-" + [Guid]::NewGuid().ToString("N"))
$HostRoot = Join-Path $Scratch "host"
$OutsideRoot = Join-Path $Scratch "outside"
$SurfaceNames = @("skill_command", "spipe", "template", "project_expert", "domain_expert", "tool_expert")

function Assert-True([bool]$Condition, [string]$Message) {
    if (-not $Condition) { throw $Message }
}

function Assert-Rejected([string]$Name, [scriptblock]$Action) {
    $Rejected = $false
    try {
        & $Action
    } catch {
        $Rejected = $true
    }
    Assert-True $Rejected "$Name was unexpectedly accepted"
}

function Remove-ReparsePoint([string]$Path) {
    if (-not (Test-Path -LiteralPath $Path)) { return }
    $Item = Get-Item -LiteralPath $Path -Force
    if (($Item.Attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0) {
        $Item.Delete()
    }
}

New-Item -ItemType Directory -Path $HostRoot, $OutsideRoot | Out-Null
$ContainedDocReal = New-Item -ItemType Directory -Path (Join-Path $HostRoot "contained-doc-real")
$ContainedDocLink = Join-Path $HostRoot "contained-doc"
$ContainedSourceReal = New-Item -ItemType Directory -Path (Join-Path $HostRoot "contained-source-real")
$ContainedSourceLink = Join-Path $HostRoot "contained-source"
$EscapingDocReal = New-Item -ItemType Directory -Path (Join-Path $OutsideRoot "escaping-doc-real")
$EscapingDocLink = Join-Path $HostRoot "escaping-doc"
$EscapingSourceReal = New-Item -ItemType Directory -Path (Join-Path $OutsideRoot "escaping-source-real")
$EscapingSourceLink = Join-Path $HostRoot "escaping-source"

try {
    New-Item -ItemType Junction -Path $ContainedDocLink -Target $ContainedDocReal.FullName | Out-Null
    & $SetupScript -HostRoot $HostRoot -DocRoot "contained-doc/process" -Force | Out-Null
    $InstalledSurface = Get-Item -LiteralPath (Join-Path $ContainedDocReal.FullName "process\spipe") -Force
    Assert-True (($InstalledSurface.Attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0) "contained junction ancestor did not produce a managed junction"

    New-Item -ItemType SymbolicLink -Path $ContainedSourceLink -Target $ContainedSourceReal.FullName | Out-Null
    New-Item -ItemType Directory -Path (Join-Path $ContainedSourceReal.FullName "child") | Out-Null
    New-Item -ItemType Directory -Path (Join-Path $HostRoot ".spipe") | Out-Null
    $SubprojectConfig = Join-Path $HostRoot ".spipe\subproject_links.sdn"
    Set-Content -LiteralPath $SubprojectConfig -Encoding utf8 -Value "safe-target|contained-source/child"
    $ContainedSourceOutput = @(& $SetupScript -HostRoot $HostRoot -DocRoot "contained-doc/process" -DryRun)
    Assert-True ($ContainedSourceOutput -contains "would_link_subproject safe-target") "contained symbolic-link source ancestor was not accepted"

    New-Item -ItemType Directory -Path (Join-Path $EscapingDocReal.FullName "process\skill_command") | Out-Null
    $Sentinel = Join-Path $EscapingDocReal.FullName "process\skill_command\sentinel.txt"
    Set-Content -LiteralPath $Sentinel -Encoding utf8 -Value "preserve"
    New-Item -ItemType Junction -Path $EscapingDocLink -Target $EscapingDocReal.FullName | Out-Null
    Assert-Rejected "escaping target junction ancestor" {
        & $SetupScript -HostRoot $HostRoot -DocRoot "escaping-doc/process" -Force | Out-Null
    }
    Assert-True (Test-Path -LiteralPath $Sentinel) "forced rejection modified content outside HostRoot"

    New-Item -ItemType SymbolicLink -Path $EscapingSourceLink -Target $EscapingSourceReal.FullName | Out-Null
    New-Item -ItemType Directory -Path (Join-Path $EscapingSourceReal.FullName "child") | Out-Null
    Set-Content -LiteralPath $SubprojectConfig -Encoding utf8 -Value "safe-target|escaping-source/child"
    Assert-Rejected "escaping source symbolic-link ancestor" {
        & $SetupScript -HostRoot $HostRoot -DocRoot "contained-doc/process" -DryRun | Out-Null
    }
} finally {
    foreach ($Name in $SurfaceNames) {
        Remove-ReparsePoint (Join-Path $ContainedDocReal.FullName ("process\" + $Name))
    }
    foreach ($Link in @($ContainedDocLink, $ContainedSourceLink, $EscapingDocLink, $EscapingSourceLink)) {
        Remove-ReparsePoint $Link
    }
    if (Test-Path -LiteralPath $Scratch) {
        Remove-Item -LiteralPath $Scratch -Recurse -Force
    }
}

Write-Output "powershell_setup_containment=pass"
