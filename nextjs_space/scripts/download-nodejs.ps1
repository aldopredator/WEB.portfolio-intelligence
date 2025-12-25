# Automated Portable Node.js Setup (No Admin Required)
# Downloads Node.js, extracts it, and runs the metrics setup

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Portable Node.js Setup (No Admin)" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$nodeVersion = "v20.11.0"
$nodeFolder = "node-$nodeVersion-win-x64"
$downloadUrl = "https://nodejs.org/dist/$nodeVersion/$nodeFolder.zip"
$downloadPath = "$env:USERPROFILE\Downloads\nodejs-portable.zip"
$extractPath = "$env:USERPROFILE\nodejs-portable"
$nodePath = Join-Path $extractPath $nodeFolder

# Check if already installed
if (Test-Path (Join-Path $nodePath "node.exe")) {
    Write-Host "Node.js portable already exists at: $nodePath" -ForegroundColor Green
    Write-Host "Using existing installation...`n" -ForegroundColor Gray
} else {
    # Step 1: Download Node.js
    Write-Host "[1/4] Downloading Node.js $nodeVersion..." -ForegroundColor Yellow
    Write-Host "   URL: $downloadUrl" -ForegroundColor Gray
    Write-Host "   This may take a few minutes (30 MB download)..." -ForegroundColor Gray

    try {
        Invoke-WebRequest -Uri $downloadUrl -OutFile $downloadPath -UseBasicParsing
        Write-Host "   Download complete!" -ForegroundColor Green
    } catch {
        Write-Host "`n   ERROR: Download failed: $_" -ForegroundColor Red
        Write-Host "`n   Please check your internet connection and try again.`n" -ForegroundColor Yellow
        Read-Host "Press Enter to exit"
        exit 1
    }

    Write-Host ""

    # Step 2: Extract Node.js
    Write-Host "[2/4] Extracting Node.js..." -ForegroundColor Yellow
    Write-Host "   Destination: $extractPath" -ForegroundColor Gray

    try {
        # Create directory if it doesn't exist
        if (-not (Test-Path $extractPath)) {
            New-Item -ItemType Directory -Path $extractPath -Force | Out-Null
        }

        # Extract the zip file
        Expand-Archive -Path $downloadPath -DestinationPath $extractPath -Force
        Write-Host "   Extraction complete!" -ForegroundColor Green

        # Clean up download
        Remove-Item $downloadPath -Force
    } catch {
        Write-Host "`n   ERROR: Extraction failed: $_" -ForegroundColor Red
        Read-Host "Press Enter to exit"
        exit 1
    }

    Write-Host ""
}

# Step 3: Verify Node.js
Write-Host "[3/4] Verifying Node.js installation..." -ForegroundColor Yellow

$nodeExe = Join-Path $nodePath "node.exe"
$npmCmd = Join-Path $nodePath "npm.cmd"

if (-not (Test-Path $nodeExe)) {
    Write-Host "`n   ERROR: node.exe not found at: $nodeExe" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

try {
    $nodeVersionCheck = & $nodeExe --version 2>&1
    $npmVersionCheck = & $npmCmd --version 2>&1
    Write-Host "   Node.js: $nodeVersionCheck" -ForegroundColor Green
    Write-Host "   npm: $npmVersionCheck" -ForegroundColor Green
} catch {
    Write-Host "`n   ERROR: Failed to verify Node.js: $_" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""

# Step 4: Add to user PATH permanently
Write-Host "[4/4] Adding Node.js to your PATH..." -ForegroundColor Yellow

try {
    $userPath = [Environment]::GetEnvironmentVariable("Path", "User")
    
    if ($userPath -notlike "*$nodePath*") {
        if ($userPath) {
            $newPath = $userPath + ";" + $nodePath
        } else {
            $newPath = $nodePath
        }
        [Environment]::SetEnvironmentVariable("Path", $newPath, "User")
        Write-Host "   Added to PATH successfully!" -ForegroundColor Green
        Write-Host "   (Will be available in new terminals)" -ForegroundColor Gray
    } else {
        Write-Host "   Already in PATH" -ForegroundColor Green
    }
} catch {
    Write-Host "   WARNING: Could not update PATH: $_" -ForegroundColor Yellow
    Write-Host "   Continuing with temporary PATH..." -ForegroundColor Gray
}

# Update current session PATH
$env:Path = $nodePath + ";" + $env:Path

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "Node.js Ready!" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Green

# Ask if user wants to run metrics setup now
Write-Host "Run the metrics historization setup now?" -ForegroundColor Yellow
$response = Read-Host "(y/n)"

if ($response -eq "y") {
    Write-Host "`nStarting metrics setup...`n" -ForegroundColor Cyan
    
    # Set environment variables for setup script
    $env:NODE_PATH = $nodeExe
    $env:NPM_PATH = $npmCmd
    
    $scriptDir = Split-Path -Parent $PSCommandPath
    $setupScript = Join-Path $scriptDir "setup-metrics.ps1"
    
    if (Test-Path $setupScript) {
        & powershell -ExecutionPolicy Bypass -File $setupScript
    } else {
        Write-Host "ERROR: setup-metrics.ps1 not found at: $setupScript" -ForegroundColor Red
        Write-Host "`nYou can run it manually from the scripts folder" -ForegroundColor Yellow
    }
} else {
    Write-Host "`nNode.js is ready to use!" -ForegroundColor Green
    Write-Host "`nTo run the setup later:" -ForegroundColor Yellow
    Write-Host "  1. Open a NEW PowerShell window (to load updated PATH)" -ForegroundColor White
    Write-Host "  2. cd to project directory" -ForegroundColor White
    Write-Host "  3. Run: .\scripts\setup-metrics.ps1`n" -ForegroundColor White
    
    Write-Host "Node.js location: $nodePath" -ForegroundColor Gray
    Write-Host "You can now use: node, npm, npx`n" -ForegroundColor Gray
}

Read-Host "Press Enter to exit"
