# Deploys the built extension to the Vortex plugins directory.
# The target folder name is derived from the "id" field in .pack/info.json.
# The folder is created automatically on first run, and emptied before each deploy so no stale files remain.

param(
    [string]$WorkspaceFolder = (Split-Path (Split-Path $PSScriptRoot -Parent) -Parent)
)

. (Join-Path $PSScriptRoot "build-config.ps1")

$packDir = Get-PackDir -WorkspaceFolder $WorkspaceFolder
$infoPath = Join-Path $packDir "info.json"
$pluginsDir = Get-VortexPluginsDir

if (-not (Test-Path $packDir)) {
    throw ".pack/ not found. Run 'npm run build' first."
}

$info = Get-Content $infoPath -Raw | ConvertFrom-Json

if (-not $info.id) {
    throw "info.json is missing the required 'id' field."
}

$targetDir = Join-Path $pluginsDir $info.id

if (Test-Path $targetDir) {
    Remove-Item -Path (Join-Path $targetDir "*") -Recurse -Force
}
New-Item -ItemType Directory -Path $targetDir -Force | Out-Null
Copy-Item -Path (Join-Path $packDir "*") -Destination $targetDir -Recurse -Force

Write-Host "Deployed '$($info.name)' v$($info.version) to: $targetDir"
