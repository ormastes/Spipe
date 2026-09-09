$ErrorActionPreference = "Stop"
$repo = (Resolve-Path (Join-Path $PSScriptRoot "../..")).Path
$fixture = Join-Path ([IO.Path]::GetTempPath()) ("spipe locator " + [guid]::NewGuid())
$common = Join-Path $fixture "common with spaces"
$oldHome = $env:HOME
$oldUserProfile = $env:USERPROFILE
$oldSpipeHome = $env:SPIPE_HOME

try {
  New-Item -ItemType Directory -Force (Join-Path $common "plugin/skills/spipe-research") | Out-Null
  Set-Content -Encoding utf8 (Join-Path $common "package.json") '{"name":"@simple-lang/spipe"}'
  Set-Content -Encoding utf8 (Join-Path $common "plugin/skills/spipe-research/SKILL.md") 'fixture'
  $env:HOME = Join-Path $fixture "home"
  $env:USERPROFILE = $env:HOME
  $env:SPIPE_HOME = $common
  $output = & node (Join-Path $repo "scripts/find-spipe.mjs") --agent-guide
  if ($LASTEXITCODE -ne 0) { throw "locator exited $LASTEXITCODE" }
  if (($output -join "`n") -notmatch [regex]::Escape("SPIPE_HOME=$common")) {
    throw "locator did not preserve the explicit Windows path"
  }
} finally {
  $env:HOME = $oldHome
  $env:USERPROFILE = $oldUserProfile
  $env:SPIPE_HOME = $oldSpipeHome
  Remove-Item -Recurse -Force -ErrorAction SilentlyContinue $fixture
}
