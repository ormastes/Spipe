param(
    [ValidateSet("user", "project")][string]$Mode = "",
    [string]$Destination = "",
    [string]$CommonUrl = "https://github.com/ormastes/Spipe.git",
    [string]$Organization = "",
    [string]$Project = "",
    [switch]$Yes
)

$ErrorActionPreference = "Stop"
if ($Mode -eq "") { $Mode = Read-Host "Setup mode (user/project) [user]"; if ($Mode -eq "") { $Mode = "user" } }
if ($Destination -eq "") {
    if ($Mode -eq "user") { $Destination = Join-Path $HOME ".spipe" }
    else { $Destination = (& git rev-parse --show-toplevel).Trim() }
}
$Destination = [IO.Path]::GetFullPath($Destination)
if ($Destination -eq [IO.Path]::GetPathRoot($Destination)) { throw "Refusing filesystem root" }
foreach ($Entry in @(@("organization", $Organization), @("project", $Project))) {
    if ($Entry[1] -match '[|\r\n]') { throw "$($Entry[0]) UID contains a registry delimiter" }
}

if ($Mode -eq "user") {
    New-Item -ItemType Directory -Force -Path $Destination | Out-Null
    if (-not (Test-Path (Join-Path $Destination ".git"))) { & git -C $Destination init | Out-Null }
    foreach ($Name in @("organization", "projects", "local")) {
        New-Item -ItemType Directory -Force -Path (Join-Path $Destination $Name) | Out-Null
    }
    $Ignore = Join-Path $Destination ".gitignore"
    if (-not (Test-Path $Ignore)) { Set-Content -NoNewline:$false $Ignore "local/" }
    elseif (-not (Select-String -Quiet -SimpleMatch "local/" $Ignore)) { Add-Content $Ignore "`nlocal/" }
    $CommonPath = Join-Path $Destination ".spipe"
    $Gitlink = (& git -C $Destination ls-files --stage -- .spipe) -join "`n"
    if (-not (Test-Path $CommonPath)) { & git -C $Destination submodule add -- $CommonUrl .spipe }
    elseif (-not $Gitlink.StartsWith("160000 ")) { throw "Occupied non-submodule target: $CommonPath" }
} elseif ($Mode -eq "project") {
    & git -C $Destination rev-parse --git-dir | Out-Null
    $Direct = ((& git -C $Destination ls-files --stage -- .spipe) -join "`n").StartsWith("160000 ")
    $Legacy = ((& git -C $Destination ls-files --stage -- .spipe/spipe) -join "`n").StartsWith("160000 ")
    if ($Direct) { & git -C $Destination submodule update --init -- .spipe }
    elseif ($Legacy) {
        & git -C $Destination submodule update --init -- .spipe/spipe
        Write-Output "legacy_layout=.spipe/spipe (preserved; migration requires a reviewed plan)"
    } else { throw "Project has no recorded .spipe submodule" }
} else { throw "Mode must be user or project" }

if ($Mode -eq "user") { $Registry = Join-Path $Destination "local/scopes.sdn" }
else {
    $ConfigHome = if ($env:XDG_CONFIG_HOME) { $env:XDG_CONFIG_HOME } else { Join-Path $HOME ".config" }
    $Registry = Join-Path $ConfigHome "spipe/scopes.sdn"
}
New-Item -ItemType Directory -Force -Path (Split-Path $Registry -Parent) | Out-Null
if (-not (Test-Path $Registry)) { Set-Content $Registry "# machine-local SPipe scope mounts" }
$Lines = @(Get-Content $Registry)
if ($Organization -ne "" -and -not ($Lines -match "^organization:$([regex]::Escape($Organization))\|")) {
    Add-Content $Registry "organization:$Organization|$(Join-Path $Destination "organization/$Organization")"
}
if ($Project -ne "" -and -not ($Lines -match "^project:$([regex]::Escape($Project))\|")) {
    Add-Content $Registry "project:$Project|$Destination"
}
Write-Output "mode=$Mode"
Write-Output "destination=$Destination"
Write-Output "registry=$Registry"
Write-Output "status=ready"
