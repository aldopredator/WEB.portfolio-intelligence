# Automated Metrics Historization Setup Script
# Handles Node.js detection, Prisma generation, DB push, and initial population

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Portfolio Intelligence - Metrics Setup" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$scriptDir = Split-Path -Parent $PSCommandPath
$projectRoot = Split-Path -Parent $scriptDir
Set-Location $projectRoot

Write-Host "Project directory: $projectRoot`n" -ForegroundColor Gray

# Step 1: Find Node.js (support both PATH and environment variables)
Write-Host "[1/5] Looking for Node.js..." -ForegroundColor Yellow

$node = $null
$npm = $null

# Check if paths were provided via environment variables
if ($env:NODE_PATH -and (Test-Path $env:NODE_PATH)) {
    $node = $env:NODE_PATH
    $nodeDir = Split-Path $node
    $npm = Join-Path $nodeDir "npm.cmd"
    $nodeVersion = & $node --version 2>&1
    Write-Host "   Using Node.js from environment: $nodeVersion" -ForegroundColor Green
}

# Try node in PATH
if (-not $node) {
    try {
        $nodeTest = node --version 2>&1
        if ($LASTEXITCODE -eq 0) {
            $node = "node"
            $npm = "npm"
            Write-Host "   Found Node.js in PATH: $nodeTest" -ForegroundColor Green
        }
    } catch {}
}

# Search common locations
if (-not $node) {
    $searchPaths = @(
        "C:\Program Files\nodejs\node.exe",
        "C:\Program Files (x86)\nodejs\node.exe",
        "$env:LOCALAPPDATA\Programs\nodejs\node.exe",
        "$env:APPDATA\npm\node.exe"
    )
    
    foreach ($path in $searchPaths) {
        if (Test-Path $path) {
            $node = $path
            $nodeDir = Split-Path $path
            $npm = Join-Path $nodeDir "npm.cmd"
            $nodeVersion = & $node --version 2>&1
            Write-Host "   Found Node.js at: $path ($nodeVersion)" -ForegroundColor Green
            break
        }
    }
}

if (-not $node) {
    Write-Host "`n   ERROR: Node.js not found!" -ForegroundColor Red
    Write-Host "`n   Please run: .\scripts\setup-nodejs-user.ps1" -ForegroundColor Yellow
    Write-Host "   (This will add Node.js to your PATH without admin rights)`n" -ForegroundColor Gray
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""

# Step 2: Check environment
Write-Host "[2/5] Checking environment..." -ForegroundColor Yellow

$envPath = Join-Path $projectRoot ".env"
if (Test-Path $envPath) {
    Write-Host "   .env file found" -ForegroundColor Green
} else {
    Write-Host "   WARNING: .env file not found" -ForegroundColor Yellow
}

Write-Host ""

# Step 3: Generate Prisma client
Write-Host "[3/5] Generating Prisma client..." -ForegroundColor Yellow

try {
    if ($npm -eq "npm") {
        & npx prisma generate 2>&1 | Out-Host
    } else {
        & $npm run postinstall 2>&1 | Out-Host
    }
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   Prisma client generated successfully" -ForegroundColor Green
    } else {
        throw "Failed"
    }
} catch {
    Write-Host "`n   ERROR: Prisma generate failed" -ForegroundColor Red
    Write-Host "   Try manually: cd $projectRoot && npx prisma generate`n" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""

# Step 4: Update database schema
Write-Host "[4/5] Updating database schema..." -ForegroundColor Yellow
Write-Host "   This adds the Metrics table for daily snapshots..." -ForegroundColor Gray

try {
    if ($npm -eq "npm") {
        & npx prisma db push --accept-data-loss 2>&1 | Out-Host
    } else {
        $npxPath = Join-Path (Split-Path $npm) "npx.cmd"
        & $npxPath prisma db push --accept-data-loss 2>&1 | Out-Host
    }
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   Database schema updated successfully" -ForegroundColor Green
    } else {
        throw "Failed"
    }
} catch {
    Write-Host "`n   ERROR: Database push failed" -ForegroundColor Red
    Write-Host "   Try manually: cd $projectRoot && npx prisma db push`n" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""

# Step 5: Populate metrics
Write-Host "[5/5] Populate initial metrics?" -ForegroundColor Yellow
Write-Host "   This will fetch metrics for all stocks (takes 45-60s)" -ForegroundColor Gray
$response = Read-Host "   Run now? (y/n)"

if ($response -eq "y") {
    Write-Host ""
    try {
        if ($npm -eq "npm") {
            & npm run populate-metrics 2>&1 | Out-Host
        } else {
            & $npm run populate-metrics 2>&1 | Out-Host
        }
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "`n   Initial metrics populated successfully" -ForegroundColor Green
        }
    } catch {
        Write-Host "`n   WARNING: Metrics population had errors" -ForegroundColor Yellow
        Write-Host "   You can run manually: npm run populate-metrics" -ForegroundColor Gray
    }
} else {
    Write-Host "   Skipped. Run later with: npm run populate-metrics" -ForegroundColor Gray
}

# Summary
Write-Host "`n========================================" -ForegroundColor Green
Write-Host "           Setup Complete!              " -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Green

Write-Host "What was done:" -ForegroundColor Cyan
Write-Host "  - Prisma client generated" -ForegroundColor White
Write-Host "  - Database schema updated (Metrics table ready)" -ForegroundColor White
if ($response -eq "y") {
    Write-Host "  - Initial metrics populated" -ForegroundColor White
}

Write-Host "`nNext Steps:" -ForegroundColor Cyan
Write-Host "  1. Schedule daily job: npm run populate-metrics" -ForegroundColor White
Write-Host "     (Run at 6 AM daily via Task Scheduler)" -ForegroundColor Gray
Write-Host "`n  2. Test your app: npm run dev" -ForegroundColor White
Write-Host "     (Screening page should load faster now)" -ForegroundColor Gray
Write-Host "`n  3. Query metrics: npm run query-metrics -- --limit 10" -ForegroundColor White
Write-Host "     (Verify data is being captured)" -ForegroundColor Gray

Write-Host "`nDocumentation:" -ForegroundColor Cyan
Write-Host "  - METRICS_HISTORIZATION_README.md (full guide)" -ForegroundColor Gray
Write-Host "  - IMPLEMENTATION_SUMMARY.md (quick reference)" -ForegroundColor Gray

Write-Host "`nPress Enter to exit..." -ForegroundColor Gray
Read-Host
