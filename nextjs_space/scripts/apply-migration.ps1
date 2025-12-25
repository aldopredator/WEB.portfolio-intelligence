# Script to apply Prisma migrations
# Run this to update the database schema with the new costPrice fields

Write-Host "Applying Prisma migrations..." -ForegroundColor Cyan

# Find node.exe in common installation paths
$nodePaths = @(
    "C:\Program Files\nodejs\node.exe",
    "C:\Program Files (x86)\nodejs\node.exe",
    "$env:LOCALAPPDATA\Programs\nodejs\node.exe",
    "$env:ProgramFiles\nodejs\node.exe"
)

$nodeExe = $null
foreach ($path in $nodePaths) {
    if (Test-Path $path) {
        $nodeExe = $path
        Write-Host "Found Node.js at: $path" -ForegroundColor Green
        break
    }
}

if (-not $nodeExe) {
    Write-Host "ERROR: Node.js not found. Please install Node.js or add it to PATH." -ForegroundColor Red
    Write-Host "You can also run manually: npx prisma migrate deploy" -ForegroundColor Yellow
    exit 1
}

# Get npx path (usually in same directory as node)
$nodeDir = Split-Path -Parent $nodeExe
$npxExe = Join-Path $nodeDir "npx.cmd"

if (-not (Test-Path $npxExe)) {
    Write-Host "ERROR: npx not found at: $npxExe" -ForegroundColor Red
    exit 1
}

# Run prisma migrate deploy
Write-Host "Running: npx prisma migrate deploy" -ForegroundColor Yellow
& $npxExe prisma migrate deploy

if ($LASTEXITCODE -eq 0) {
    Write-Host "`nMigration applied successfully!" -ForegroundColor Green
    Write-Host "The costPrice and costPriceUpdatedAt fields are now available in the Stock table." -ForegroundColor Green
} else {
    Write-Host "`nMigration failed with exit code: $LASTEXITCODE" -ForegroundColor Red
    Write-Host "Check the error messages above for details." -ForegroundColor Yellow
}
