$ErrorActionPreference = "Stop"

$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$SetupScript = Join-Path $RepoRoot "scripts\setup-local-knowledge.ps1"
$Scratch = Join-Path ([IO.Path]::GetTempPath()) ("spipe-common-" + [Guid]::NewGuid().ToString("N"))
$Project = Join-Path $Scratch "project"
$Config = Join-Path $Scratch "config"
$CommonRoute = Join-Path $Project ".spipe\common"

function Assert-True([bool]$Condition, [string]$Message) {
    if (-not $Condition) { throw $Message }
}

New-Item -ItemType Directory -Path $Project, (Join-Path $Project ".spipe"), $Config | Out-Null
try {
    & git -C $Project init --quiet
    if ($LASTEXITCODE -ne 0) { throw "git init failed" }
    New-Item -ItemType Junction -Path $CommonRoute -Target $RepoRoot | Out-Null
    $env:XDG_CONFIG_HOME = $Config
    & $SetupScript -Mode project -Destination $Project -Project windows-fixture -Yes | Out-Null
    $Registry = Join-Path $Config "spipe\scopes.sdn"
    Assert-True (Test-Path -LiteralPath $Registry) "machine-local registry was not created"
    $Rows = Get-Content -LiteralPath $Registry
    Assert-True ($Rows -contains "project:windows-fixture|$Project") "project route was not registered exactly"
    Assert-True ((Get-ChildItem -LiteralPath $Project -Force | Where-Object Name -ne ".spipe").Count -eq 1) "setup mutated project content"
} finally {
    Remove-Item Env:XDG_CONFIG_HOME -ErrorAction SilentlyContinue
    if (Test-Path -LiteralPath $CommonRoute) { (Get-Item -LiteralPath $CommonRoute -Force).Delete() }
    if (Test-Path -LiteralPath $Scratch) { Remove-Item -LiteralPath $Scratch -Recurse -Force }
}

Write-Output "powershell_external_common_setup=pass"
