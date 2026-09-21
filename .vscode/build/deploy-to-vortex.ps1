# Deploys the built extension to the Vortex plugins directory.
# The target folder name is derived from the "id" field in .pack/info.json.
# The folder is created automatically on first run — no manual install via Vortex UI needed.

param(
    [string]$WorkspaceFolder = (Split-Path (Split-Path $PSScriptRoot -Parent) -Parent)
)

$packDir = Join-Path $WorkspaceFolder ".pack"
$infoPath = Join-Path $packDir "info.json"

if ($IsWindows -or $env:OS -eq 'Windows_NT') {
    $pluginsDir = Join-Path $env:APPDATA "Vortex\plugins"
}
elseif ($IsLinux) {
    $pluginsDir = Join-Path $env:HOME ".config/Vortex/plugins"
}
elseif ($IsMacOS) {
    $pluginsDir = Join-Path $env:HOME "Library/Application Support/Vortex/plugins"
}
else {
    throw "Unsupported platform: $([System.Environment]::OSVersion.Platform)"
}

if (-not (Test-Path $packDir)) {
    throw ".pack/ not found. Run 'npm run build' first."
}

$info = Get-Content $infoPath -Raw | ConvertFrom-Json

if (-not $info.id) {
    throw "info.json is missing the required 'id' field."
}

$targetDir = Join-Path $pluginsDir $info.id

New-Item -ItemType Directory -Path $targetDir -Force | Out-Null
Copy-Item -Path (Join-Path $packDir "*") -Destination $targetDir -Recurse -Force

Write-Host "Deployed '$($info.name)' v$($info.version) to: $targetDir"
