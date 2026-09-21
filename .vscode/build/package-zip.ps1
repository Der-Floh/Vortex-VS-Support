# Packages the contents of .pack/ into a zip file at the workspace root.
# Zip name: $name-$version.zip (from package.json)

param(
    [string]$WorkspaceFolder = (Split-Path (Split-Path $PSScriptRoot -Parent) -Parent)
)

$packageJson = Join-Path $WorkspaceFolder "package.json"
$pkg = Get-Content $packageJson -Raw | ConvertFrom-Json

$name = $pkg.name
$version = $pkg.version
$zipName = "$name-$version.zip"
$zipPath = Join-Path $WorkspaceFolder $zipName
$packDir = Join-Path $WorkspaceFolder ".pack"

if (-not (Test-Path $packDir)) {
    throw ".pack/ directory not found. Run 'npm run build' first."
}

# Remove existing zip if present
if (Test-Path $zipPath) {
    Remove-Item $zipPath -Force
}

Compress-Archive -Path (Join-Path $packDir "*") -DestinationPath $zipPath
Write-Host "Packaged: $zipName"
