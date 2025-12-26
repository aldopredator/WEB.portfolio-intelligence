# Internal Score Daily Update - Windows Task Scheduler Setup

# This script updates the internal scoring model weights daily at 2 AM

param(
    [string]$WorkingDir = "C:\Users\khaledh\OneDrive - SkySparc\Documents\GitHub\WEB.portfolio-intelligence\nextjs_space"
)

# Set working directory
Set-Location $WorkingDir

# Log file path
$logDir = Join-Path $WorkingDir "logs"
$logFile = Join-Path $logDir "internal-score-$(Get-Date -Format 'yyyy-MM-dd').log"

# Create logs directory if it doesn't exist
if (-not (Test-Path $logDir)) {
    New-Item -ItemType Directory -Path $logDir -Force | Out-Null
}

# Start logging
Start-Transcript -Path $logFile -Append

Write-Host "=================================================="
Write-Host "Internal Score Daily Update"
Write-Host "Started: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
Write-Host "=================================================="

try {
    # Run the analysis
    Write-Host "`nRunning internal score calculation..."
    npx tsx --require dotenv/config scripts/calculate-internal-score.ts
    
    $exitCode = $LASTEXITCODE
    
    if ($exitCode -eq 0) {
        Write-Host "`n✅ Internal score calculation completed successfully"
    } else {
        Write-Host "`n❌ Internal score calculation failed with exit code: $exitCode"
        throw "Script execution failed"
    }
    
} catch {
    Write-Host "`n❌ Error occurred: $_"
    Write-Host $_.Exception.Message
    Write-Host $_.ScriptStackTrace
    exit 1
} finally {
    Write-Host "`nCompleted: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
    Write-Host "=================================================="
    Stop-Transcript
}

# Clean up old logs (keep last 30 days)
$cutoffDate = (Get-Date).AddDays(-30)
Get-ChildItem $logDir -Filter "internal-score-*.log" | Where-Object { $_.LastWriteTime -lt $cutoffDate } | Remove-Item -Force

exit 0
