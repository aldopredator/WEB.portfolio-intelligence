# Automatically find and add Node.js to PATH, then run setup
# This script requires Administrator privileges

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Add Node.js to PATH & Run Setup" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Check if running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "Administrator privileges required to modify PATH.`n" -ForegroundColor Yellow
    Write-Host "Restarting with elevated privileges..." -ForegroundColor Yellow
    
    $scriptPath = $MyInvocation.MyCommand.Path
    Start-Process powershell -ArgumentList "-ExecutionPolicy Bypass -File `"$scriptPath`"" -Verb RunAs
    exit
}

# Search for Node.js installation
Write-Host "Searching for Node.js installation..." -ForegroundColor Yellow

$nodePaths = @(
    "C:\Program Files\nodejs",
    "C:\Program Files (x86)\nodejs",
    "$env:LOCALAPPDATA\Programs\nodejs",
    "$env:ProgramFiles\nodejs",
    "${env:ProgramFiles(x86)}\nodejs"
)

$nodeDir = $null
foreach ($path in $nodePaths) {
    if (Test-Path (Join-Path $path "node.exe")) {
        $nodeDir = $path
        Write-Host "   Found Node.js at: $path" -ForegroundColor Green
        break
    }
}

if (-not $nodeDir) {
    Write-Host "`n   ERROR: Node.js not found in common locations!" -ForegroundColor Red
    Write-Host "   Please install Node.js from: https://nodejs.org/`n" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

# Get current system PATH
$currentPath = [Environment]::GetEnvironmentVariable("Path", "Machine")

# Check if Node.js is already in PATH
if ($currentPath -like "*$nodeDir*") {
    Write-Host "   Node.js is already in system PATH" -ForegroundColor Green
} else {
    Write-Host "`nAdding Node.js to system PATH..." -ForegroundColor Yellow
    
    try {
        $newPath = $currentPath + ";" + $nodeDir
        [Environment]::SetEnvironmentVariable("Path", $newPath, "Machine")
        Write-Host "   Successfully added to system PATH" -ForegroundColor Green
    } catch {
        Write-Host "   ERROR: Failed to update PATH: $_" -ForegroundColor Red
        Read-Host "Press Enter to exit"
        exit 1
    }
}

# Update current session PATH
$env:Path = [Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [Environment]::GetEnvironmentVariable("Path", "User")

Write-Host "`nVerifying Node.js is accessible..." -ForegroundColor Yellow

try {
    $nodeVersion = & node --version 2>&1
    $npmVersion = & npm --version 2>&1
    Write-Host "   Node.js version: $nodeVersion" -ForegroundColor Green
    Write-Host "   npm version: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "   WARNING: Node.js not immediately accessible" -ForegroundColor Yellow
    Write-Host "   You may need to restart PowerShell" -ForegroundColor Yellow
}

Write-Host "`n========================================" -ForegroundColor Green
Write-Host "PATH Updated Successfully!" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Green

# Ask if user wants to run setup now
Write-Host "Run the metrics setup now?" -ForegroundColor Yellow
$response = Read-Host "(y/n)"

if ($response -eq "y") {
    Write-Host "`nStarting metrics setup...`n" -ForegroundColor Cyan
    
    $scriptDir = Split-Path -Parent $PSCommandPath
    $setupScript = Join-Path $scriptDir "setup-metrics.ps1"
    
    if (Test-Path $setupScript) {
        & powershell -ExecutionPolicy Bypass -File $setupScript
    } else {
        Write-Host "ERROR: setup-metrics.ps1 not found" -ForegroundColor Red
    }
} else {
    Write-Host "`nPATH has been updated. To apply changes:" -ForegroundColor Yellow
    Write-Host "  1. Close this PowerShell window" -ForegroundColor White
    Write-Host "  2. Open a new PowerShell window" -ForegroundColor White
    Write-Host "  3. Run: .\scripts\setup-metrics.ps1`n" -ForegroundColor White
}

Read-Host "Press Enter to exit"
