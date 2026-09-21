# Builds the plugin, deploys it to Vortex, and starts Vortex with remote debugging.
# Stops immediately if any step fails so VS Code doesn't try to attach to a non-existent process.

param(
    [string]$WorkspaceFolder = (Split-Path (Split-Path $PSScriptRoot -Parent) -Parent)
)

$ErrorActionPreference = "Stop"

. (Join-Path $PSScriptRoot "build-config.ps1")

# -- Resolve Vortex executable path -------------------------------------------
$vortexExe = Get-VortexExecutablePath

if (-not $vortexExe -or -not (Test-Path $vortexExe)) {
    throw "Vortex executable not found. Configure it in .vscode/build/build-config.ps1."
}

# -- Build ---------------------------------------------------------------------
Write-Host "==> Building..."
Push-Location $WorkspaceFolder
try {
    & npm run build
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Build failed. Aborting."
        exit $LASTEXITCODE
    }
}
finally {
    Pop-Location
}

# -- Deploy --------------------------------------------------------------------
Write-Host ""
Write-Host "==> Deploying..."
Write-Host ""
& (Join-Path $PSScriptRoot "deploy-to-vortex.ps1") -WorkspaceFolder $WorkspaceFolder
if ($LASTEXITCODE -ne 0) {
    Write-Error "Deploy failed. Aborting."
    exit $LASTEXITCODE
}

# -- Start Vortex ---------------------------------------------------------------
Write-Host ""
Write-Host "==> Starting Vortex..."
Write-Host ""
Start-Process -FilePath $vortexExe `
    -ArgumentList (Get-VortexStartArguments) `
    -PassThru
