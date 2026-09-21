# Centralized build/deploy configuration for local scripts.
# Keep environment-specific paths here so callers stay clean.

$script:BuildConfig = @{
    Vortex = @{
        WindowsExePaths = @(
            "C:\Program Files\Black Tree Gaming Ltd\Vortex\Vortex.exe"
            "C:\Program Files\Vortex\Vortex.exe"
        )
        RemoteDebugArguments = @(
            "--remote-debugging-port=9222"
            "--remote-allow-origins=*"
            "--inspect=9229"
            "--inspector"
        )
    }
    Packaging = @{
        ExcludedDirs = @("node_modules", ".pack", "out", ".git", ".vscode", "docs", "assets", "dist", "src", "Vortex")
    }
}

function Get-BuildConfig {
    return $script:BuildConfig
}

function Get-PackDir {
    param(
        [Parameter(Mandatory = $true)]
        [string]$WorkspaceFolder
    )

    return (Join-Path $WorkspaceFolder ".pack")
}

function Get-OutDir {
    param(
        [Parameter(Mandatory = $true)]
        [string]$WorkspaceFolder
    )

    return (Join-Path $WorkspaceFolder "out")
}

function Get-DistDir {
    param(
        [Parameter(Mandatory = $true)]
        [string]$WorkspaceFolder
    )

    return (Join-Path $WorkspaceFolder "dist")
}

function Get-PackagingExcludedDirs {
    return (Get-BuildConfig).Packaging.ExcludedDirs
}

function Get-VortexPluginsDir {
    if ($IsWindows -or $env:OS -eq 'Windows_NT') {
        return (Join-Path $env:APPDATA "Vortex\plugins")
    }

    if ($IsLinux) {
        return (Join-Path $env:HOME ".config/Vortex/plugins")
    }

    if ($IsMacOS) {
        return (Join-Path $env:HOME "Library/Application Support/Vortex/plugins")
    }

    throw "Unsupported platform: $([System.Environment]::OSVersion.Platform)"
}

function Get-VortexExecutablePath {
    if ($IsWindows -or $env:OS -eq 'Windows_NT') {
        $candidatePaths = (Get-BuildConfig).Vortex.WindowsExePaths
        return ($candidatePaths | Where-Object { $_ -and (Test-Path $_) } | Select-Object -First 1)
    }

    if ($IsLinux) {
        $vortexCmd = Get-Command vortex -ErrorAction SilentlyContinue
        $candidatePaths = @(
            $(if ($vortexCmd) { $vortexCmd.Source }),
            (Join-Path $env:HOME ".local/bin/Vortex")
        )

        return ($candidatePaths | Where-Object { $_ -and (Test-Path $_) } | Select-Object -First 1)
    }

    throw "Unsupported platform: $([System.Environment]::OSVersion.Platform)"
}

function Get-VortexStartArguments {
    return (Get-BuildConfig).Vortex.RemoteDebugArguments
}
