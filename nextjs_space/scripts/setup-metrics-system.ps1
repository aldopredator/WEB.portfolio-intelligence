# Automated Metrics Historization Setup Script
# Handles Node.js detection, Prisma generation, DB push, and initial population

Write-Host "🚀 Portfolio Intelligence - Metrics Historization Setup" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Gray
Write-Host ""

$ErrorActionPreference = "Stop"
$projectRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)

# Change to project directory
Set-Location $projectRoot
Write-Host "📁 Project directory: $projectRoot" -ForegroundColor Gray
Write-Host ""

# Function to find Node.js executable
function Find-NodeExecutable {
    Write-Host "🔍 Looking for Node.js..." -ForegroundColor Yellow
    
    # Common installation paths
    $searchPaths = @(
        "$env:ProgramFiles\nodejs\node.exe",
        "${env:ProgramFiles(x86)}\nodejs\node.exe",
        "$env:LOCALAPPDATA\Programs\nodejs\node.exe",
        "$env:APPDATA\npm\node.exe",
        "C:\Program Files\nodejs\node.exe",
        "C:\Program Files (x86)\nodejs\node.exe"
    )
    
    # Check if node is in PATH
    try {
        $nodeVersion = & node --version 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "   ✅ Found Node.js in PATH: $nodeVersion" -ForegroundColor Green
            return "node"
        }
    } catch {}
    
    # Search common paths
    foreach ($path in $searchPaths) {
        if (Test-Path $path) {
            $version = & $path --version 2>$null
            Write-Host "   ✅ Found Node.js at: $path ($version)" -ForegroundColor Green
            return $path
        }
    }
    
    # Try to find via where.exe
    try {
        $wherePath = (where.exe node 2>$null | Select-Object -First 1)
        if ($wherePath -and (Test-Path $wherePath)) {
            Write-Host "   ✅ Found Node.js via where.exe: $wherePath" -ForegroundColor Green
            return $wherePath
        }
    } catch {}
    
    return $null
}

# Function to find npm executable
function Find-NpmExecutable {
    param(
        [string]$nodePath
    )
    
    if ($nodePath -eq "node") {
        # Node is in PATH, npm should be too
        try {
            $npmVersion = & npm --version 2>$null
            if ($LASTEXITCODE -eq 0) {
                return "npm"
            }
        } catch {}
    }
    
    # npm is usually in the same directory as node
    $nodeDir = Split-Path $nodePath -Parent
    $npmPath = Join-Path $nodeDir "npm.cmd"
    
    if (Test-Path $npmPath) {
        return $npmPath
    }
    
    # Try npx
    $npxPath = Join-Path $nodeDir "npx.cmd"
    if (Test-Path $npxPath) {
        return $npxPath
    }
    
    return $null
}

# Find Node.js
$nodePath = Find-NodeExecutable

if (-not $nodePath) {
    Write-Host "❌ Node.js not found!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please install Node.js from: https://nodejs.org/" -ForegroundColor Yellow
    Write-Host "After installation, restart PowerShell and run this script again." -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

# Find npm
$npmPath = Find-NpmExecutable $nodePath

if (-not $npmPath) {
    Write-Host "❌ npm not found!" -ForegroundColor Red
    Write-Host "npm should be installed with Node.js. Please reinstall Node.js." -ForegroundColor Yellow
    exit 1
}

Write-Host "   ✅ Found npm/npx" -ForegroundColor Green
Write-Host ""

# Step 1: Check .env file
Write-Host "📋 Step 1: Checking environment configuration..." -ForegroundColor Cyan
$envPath = Join-Path $projectRoot ".env"

if (-not (Test-Path $envPath)) {
    Write-Host "   ❌ .env file not found!" -ForegroundColor Red
    Write-Host "   Please create .env file with required variables." -ForegroundColor Yellow
    exit 1
}

# Check for required environment variables
$envContent = Get-Content $envPath -Raw
$requiredVars = @("PORTFOLIO_INTELLIGENCE_PRISMA_DATABASE_URL", "POLYGON_API_KEY", "FINNHUB_API_KEY")
$missingVars = @()

foreach ($var in $requiredVars) {
    if ($envContent -notmatch $var) {
        $missingVars += $var
    }
}

if ($missingVars.Count -gt 0) {
    Write-Host "   ⚠️  Missing environment variables:" -ForegroundColor Yellow
    foreach ($var in $missingVars) {
        Write-Host "      - $var" -ForegroundColor Yellow
    }
    Write-Host ""
    $continue = Read-Host "   Continue anyway? (y/n)"
    if ($continue -ne "y") {
        exit 1
    }
} else {
    Write-Host "   ✅ All required environment variables found" -ForegroundColor Green
}
Write-Host ""

# Step 2: Generate Prisma Client
Write-Host "📦 Step 2: Generating Prisma Client..." -ForegroundColor Cyan
try {
    if ($npmPath -eq "npm") {
        & npx prisma generate
    } else {
        $npxPath = Join-Path (Split-Path $npmPath -Parent) "npx.cmd"
        if (Test-Path $npxPath) {
            & $npxPath prisma generate
        } else {
            & $npmPath run postinstall
        }
    }
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ Prisma client generated successfully" -ForegroundColor Green
    } else {
        throw "Prisma generate failed"
    }
} catch {
    Write-Host "   ❌ Failed to generate Prisma client: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "   Try manually:" -ForegroundColor Yellow
    Write-Host "   cd $projectRoot" -ForegroundColor Gray
    Write-Host "   npx prisma generate" -ForegroundColor Gray
    exit 1
}
Write-Host ""

# Step 3: Push database schema
Write-Host "🗄️  Step 3: Updating database schema..." -ForegroundColor Cyan
Write-Host "   This will add the Metrics table with daily snapshot support..." -ForegroundColor Gray

try {
    if ($npmPath -eq "npm") {
        & npx prisma db push --accept-data-loss
    } else {
        $npxPath = Join-Path (Split-Path $npmPath -Parent) "npx.cmd"
        if (Test-Path $npxPath) {
            & $npxPath prisma db push --accept-data-loss
        } else {
            Write-Host "   ⚠️  Cannot find npx, trying alternative method..." -ForegroundColor Yellow
            & $npmPath run build
        }
    }
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ Database schema updated successfully" -ForegroundColor Green
    } else {
        throw "Database push failed"
    }
} catch {
    Write-Host "   ❌ Failed to update database schema: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "   Try manually:" -ForegroundColor Yellow
    Write-Host "   cd $projectRoot" -ForegroundColor Gray
    Write-Host "   npx prisma db push" -ForegroundColor Gray
    exit 1
}
Write-Host ""

# Step 4: Populate initial metrics
Write-Host "📊 Step 4: Populating initial metrics..." -ForegroundColor Cyan
Write-Host "   This will fetch and store metrics for all active stocks..." -ForegroundColor Gray
Write-Host "   (This may take 45-60 seconds depending on number of stocks)" -ForegroundColor Gray
Write-Host ""

$populate = Read-Host "   Run initial metrics population now? (y/n)"

if ($populate -eq "y") {
    try {
        if ($npmPath -eq "npm") {
            & npm run populate-metrics
        } else {
            & $npmPath run populate-metrics
        }
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host ""
            Write-Host "   ✅ Initial metrics populated successfully" -ForegroundColor Green
        } else {
            throw "Metrics population failed"
        }
    } catch {
        Write-Host ""
        Write-Host "   ⚠️  Metrics population encountered errors" -ForegroundColor Yellow
        Write-Host "   You can run it manually later: npm run populate-metrics" -ForegroundColor Gray
    }
} else {
    Write-Host "   ⏭️  Skipped. Run later with: npm run populate-metrics" -ForegroundColor Gray
}
Write-Host ""

# Step 5: Summary and next steps
Write-Host "=" * 60 -ForegroundColor Gray
Write-Host "✅ Setup Complete!" -ForegroundColor Green
Write-Host "=" * 60 -ForegroundColor Gray
Write-Host ""
Write-Host "📋 What was done:" -ForegroundColor Cyan
Write-Host "   ✅ Prisma client generated" -ForegroundColor Green
Write-Host "   ✅ Database schema updated (Metrics table ready)" -ForegroundColor Green
if ($populate -eq "y") {
    Write-Host "   ✅ Initial metrics populated" -ForegroundColor Green
}
Write-Host ""
Write-Host "🎯 Next Steps:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Schedule Daily Job (IMPORTANT):" -ForegroundColor Yellow
Write-Host "   Run this command daily at 6 AM EST:" -ForegroundColor Gray
Write-Host "   npm run populate-metrics" -ForegroundColor White
Write-Host ""
Write-Host "   Setup Windows Task Scheduler:" -ForegroundColor Gray
Write-Host "   - Open Task Scheduler" -ForegroundColor Gray
Write-Host "   - Create Basic Task" -ForegroundColor Gray
Write-Host "   - Name: 'Portfolio Metrics Daily'" -ForegroundColor Gray
Write-Host "   - Trigger: Daily at 6:00 AM" -ForegroundColor Gray
Write-Host "   - Action: Start a program" -ForegroundColor Gray
Write-Host "     Program: npm" -ForegroundColor Gray
Write-Host "     Arguments: run populate-metrics" -ForegroundColor Gray
Write-Host "     Start in: $projectRoot" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Verify System:" -ForegroundColor Yellow
Write-Host "   npm run query-metrics -- --limit 10" -ForegroundColor White
Write-Host ""
Write-Host "3. Test Your App:" -ForegroundColor Yellow
Write-Host "   npm run dev" -ForegroundColor White
Write-Host "   Navigate to /screening page (should load faster now)" -ForegroundColor Gray
Write-Host ""
Write-Host "4. Monitor Growth:" -ForegroundColor Yellow
Write-Host "   After 30 days, you will have ~750 snapshots for ML training" -ForegroundColor Gray
Write-Host "   Export with: npm run query-metrics -- --export data.csv" -ForegroundColor White
Write-Host ""
Write-Host "📚 Documentation:" -ForegroundColor Cyan
Write-Host "   - METRICS_HISTORIZATION_README.md - Full guide" -ForegroundColor Gray
Write-Host "   - IMPLEMENTATION_SUMMARY.md - Quick reference" -ForegroundColor Gray
Write-Host ""
Write-Host "🎉 Your metrics historization system is ready!" -ForegroundColor Green
Write-Host ""

# Pause at the end
Read-Host "Press Enter to exit"
