# Builds the plugin, deploys it to Vortex, and starts Vortex with remote debugging.
# Stops immediately if any step fails so VS Code doesn't try to attach to a non-existent process.

param(
    [string]$WorkspaceFolder = (Split-Path (Split-Path $PSScriptRoot -Parent) -Parent)
)

$ErrorActionPreference = "Stop"

# -- Resolve Vortex executable path -------------------------------------------
if ($IsWindows -or $env:OS -eq 'Windows_NT') {
    $vortexExe = "C:\Program Files\Black Tree Gaming Ltd\Vortex\Vortex.exe"
}
elseif ($IsLinux) {
    # Try well-known Linux locations
    $vortexCmd = Get-Command vortex -ErrorAction SilentlyContinue
    $vortexExe = @(
        $(if ($vortexCmd) { $vortexCmd.Source }),
        (Join-Path $env:HOME ".local/bin/Vortex")
    ) | Where-Object { $_ -and (Test-Path $_) } | Select-Object -First 1
}
else {
    throw "Unsupported platform: $([System.Environment]::OSVersion.Platform)"
}

if (-not $vortexExe -or -not (Test-Path $vortexExe)) {
    throw "Vortex executable not found. Set the path manually in build-deploy-start.ps1."
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
    -ArgumentList "--remote-debugging-port=9222", "--remote-allow-origins=*", "--inspect=9229" ` # "--inspector"
    -PassThru
