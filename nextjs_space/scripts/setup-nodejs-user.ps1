# Add Node.js to USER PATH (no admin required) and run setup
# This modifies only your user profile, not system-wide

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Add Node.js to User PATH (No Admin)" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Search for Node.js installation
Write-Host "Searching for Node.js..." -ForegroundColor Yellow

$nodePaths = @(
    "C:\Program Files\nodejs",
    "C:\Program Files (x86)\nodejs",
    "$env:LOCALAPPDATA\Programs\nodejs",
    "$env:APPDATA\npm",
    "$env:ProgramFiles\nodejs",
    "${env:ProgramFiles(x86)}\nodejs"
)

$nodeDir = $null
foreach ($path in $nodePaths) {
    $nodeExe = Join-Path $path "node.exe"
    if (Test-Path $nodeExe) {
        $nodeDir = $path
        $nodeVersion = & $nodeExe --version 2>&1
        Write-Host "   Found Node.js at: $path" -ForegroundColor Green
        Write-Host "   Version: $nodeVersion" -ForegroundColor Gray
        break
    }
}

if (-not $nodeDir) {
    Write-Host "`n   ERROR: Node.js not found!" -ForegroundColor Red
    Write-Host "   Please install from: https://nodejs.org/`n" -ForegroundColor Yellow
    Write-Host "   When installing, choose 'Just for me' (doesn't require admin)`n" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

# Get current user PATH
$userPath = [Environment]::GetEnvironmentVariable("Path", "User")

# Check if Node.js is already in user PATH
if ($userPath -like "*$nodeDir*") {
    Write-Host "   Node.js is already in your user PATH" -ForegroundColor Green
} else {
    Write-Host "`nAdding Node.js to your user PATH..." -ForegroundColor Yellow
    
    try {
        if ($userPath) {
            $newPath = $userPath + ";" + $nodeDir
        } else {
            $newPath = $nodeDir
        }
        [Environment]::SetEnvironmentVariable("Path", $newPath, "User")
        Write-Host "   Successfully added to user PATH" -ForegroundColor Green
    } catch {
        Write-Host "   ERROR: Failed to update PATH: $_" -ForegroundColor Red
        Write-Host "`n   No worries! We can still proceed with direct paths.`n" -ForegroundColor Yellow
    }
}

# Update current session PATH
$env:Path = $nodeDir + ";" + [Environment]::GetEnvironmentVariable("Path", "User") + ";" + [Environment]::GetEnvironmentVariable("Path", "Machine")

Write-Host "`nVerifying Node.js access..." -ForegroundColor Yellow

$nodeExePath = Join-Path $nodeDir "node.exe"
$npmExePath = Join-Path $nodeDir "npm.cmd"

try {
    $nodeVersion = & $nodeExePath --version 2>&1
    $npmVersion = & $npmExePath --version 2>&1
    Write-Host "   Node.js: $nodeVersion" -ForegroundColor Green
    Write-Host "   npm: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "   WARNING: Could not verify versions" -ForegroundColor Yellow
}

Write-Host "`n========================================" -ForegroundColor Green
Write-Host "Ready to Run Setup!" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Green

Write-Host "Run the metrics setup now?" -ForegroundColor Yellow
$response = Read-Host "(y/n)"

if ($response -eq "y") {
    Write-Host "`nStarting metrics setup...`n" -ForegroundColor Cyan
    
    # Set environment variables for the setup script to use
    $env:NODE_PATH = $nodeExePath
    $env:NPM_PATH = $npmExePath
    
    $scriptDir = Split-Path -Parent $PSCommandPath
    $setupScript = Join-Path $scriptDir "setup-metrics.ps1"
    
    if (Test-Path $setupScript) {
        & powershell -ExecutionPolicy Bypass -File $setupScript
    } else {
        Write-Host "ERROR: setup-metrics.ps1 not found" -ForegroundColor Red
    }
} else {
    Write-Host "`nYour user PATH has been updated!" -ForegroundColor Green
    Write-Host "`nTo apply changes:" -ForegroundColor Yellow
    Write-Host "  1. Close this PowerShell window" -ForegroundColor White
    Write-Host "  2. Open a new PowerShell window" -ForegroundColor White
    Write-Host "  3. Run: .\scripts\setup-metrics.ps1" -ForegroundColor White
    Write-Host "`nOr just open a new terminal in VS Code`n" -ForegroundColor Gray
}

Read-Host "Press Enter to exit"
