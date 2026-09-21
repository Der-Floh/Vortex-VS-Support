# Packages the contents of .pack/ into dist/$name-$version.zip (name and version from package.json).
# Fails if package.json and info.json disagree on the version.

param(
    [string]$WorkspaceFolder = (Split-Path (Split-Path $PSScriptRoot -Parent) -Parent)
)

. (Join-Path $PSScriptRoot "build-config.ps1")

$packageJson = Join-Path $WorkspaceFolder "package.json"
$pkg = Get-Content $packageJson -Raw | ConvertFrom-Json

$packDir = Get-PackDir -WorkspaceFolder $WorkspaceFolder
$distDir = Get-DistDir -WorkspaceFolder $WorkspaceFolder

if (-not (Test-Path $packDir)) {
    throw ".pack/ directory not found. Run 'npm run build' first."
}

$info = Get-Content (Join-Path $packDir "info.json") -Raw | ConvertFrom-Json
if ($info.version -ne $pkg.version) {
    throw "Version mismatch: package.json has $($pkg.version) but info.json has $($info.version)."
}

$zipName = "$($pkg.name)-$($pkg.version).zip"
$zipPath = Join-Path $distDir $zipName

New-Item -ItemType Directory -Path $distDir -Force | Out-Null
if (Test-Path $zipPath) {
    Remove-Item $zipPath -Force
}

Compress-Archive -Path (Join-Path $packDir "*") -DestinationPath $zipPath
Write-Host "Packaged: dist/$zipName"
