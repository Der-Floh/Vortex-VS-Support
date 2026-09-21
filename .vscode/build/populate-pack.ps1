# Populates the .pack folder with all files needed to run the extension in Vortex.
# - Copies the entire out/ tree to .pack/ (preserving structure)
# - Finds the most top-level gameart image and copies it to .pack/
# - Finds the most top-level info.json and copies it to .pack/
# Excludes: node_modules, .pack, out, .git, .vscode, docs, assets

param(
    [string]$WorkspaceFolder = (Split-Path (Split-Path $PSScriptRoot -Parent) -Parent)
)

$packDir = Join-Path $WorkspaceFolder ".pack"
$outDir = Join-Path $WorkspaceFolder "out"

# Folders to skip when searching for gameart / info.json
$excludedDirs = @("node_modules", ".pack", "out", ".git", ".vscode", "docs", "assets")

# -- Clear and recreate .pack --------------------------------------------------
if (Test-Path $packDir) {
    Remove-Item -Path $packDir -Recurse -Force
}
New-Item -ItemType Directory -Path $packDir -Force | Out-Null

# -- Copy out/ tree into .pack/ ------------------------------------------------
if (-not (Test-Path $outDir)) {
    throw "out/ directory not found. Run 'tsc' first."
}
Copy-Item -Path (Join-Path $outDir "*") -Destination $packDir -Recurse -Force

# -- Helper: collect files not under excluded dirs ----------------------------
function Find-Files {
    param(
        [string]$Root,
        [string[]]$ExcludedDirNames,
        [string]$Filter
    )

    $results = @()
    $queue = [System.Collections.Generic.Queue[string]]::new()
    $queue.Enqueue($Root)

    while ($queue.Count -gt 0) {
        $current = $queue.Dequeue()

        # Enqueue child directories that are not excluded
        foreach ($dir in Get-ChildItem -Path $current -Directory -ErrorAction SilentlyContinue) {
            if ($ExcludedDirNames -notcontains $dir.Name) {
                $queue.Enqueue($dir.FullName)
            }
        }

        # Collect matching files in this directory
        foreach ($file in Get-ChildItem -Path $current -File -Filter $Filter -ErrorAction SilentlyContinue) {
            $results += $file
        }
    }

    return $results
}

# -- Find gameart (most top-level image file) ----------------------------------
$imageExtensions = @(".jpg", ".jpeg", ".png", ".webp", ".gif")

$allImages = @()
foreach ($ext in $imageExtensions) {
    $allImages += Find-Files -Root $WorkspaceFolder -ExcludedDirNames $excludedDirs -Filter "*$ext"
}

if ($allImages.Count -eq 0) {
    throw "No gameart image found in the workspace."
}

# Sort by directory depth (fewest path segments = most top-level), then alphabetically
$gameart = $allImages | Sort-Object {
    ($_.FullName.Split([IO.Path]::DirectorySeparatorChar).Count)
}, Name | Select-Object -First 1

Copy-Item -Path $gameart.FullName -Destination (Join-Path $packDir $gameart.Name) -Force
Write-Host "Gameart: $($gameart.FullName)"

# -- Find info.json (most top-level) ------------------------------------------
$allInfo = Find-Files -Root $WorkspaceFolder -ExcludedDirNames $excludedDirs -Filter "info.json"

if ($allInfo.Count -eq 0) {
    throw "No info.json found in the workspace."
}

$infoFile = $allInfo | Sort-Object {
    ($_.FullName.Split([IO.Path]::DirectorySeparatorChar).Count)
}, Name | Select-Object -First 1

Copy-Item -Path $infoFile.FullName -Destination (Join-Path $packDir "info.json") -Force
Write-Host "info.json: $($infoFile.FullName)"

Write-Host ".pack populated successfully."
