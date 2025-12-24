# Batch process price updates
# Calls the API repeatedly with offset parameter until all stocks are processed

param(
    [int]$BatchSize = 5
)

$baseUrl = "https://portfolio-intelligence.co.uk/api/update-prices"
$offset = 0
$totalProcessed = 0

Write-Host "Starting batch price update..." -ForegroundColor Cyan
Write-Host "Batch size: $BatchSize stocks per request" -ForegroundColor Gray
Write-Host ""

$batchNumber = 1
do {
    Write-Host ("=" * 60) -ForegroundColor DarkGray
    Write-Host "Batch #$batchNumber (offset: $offset)" -ForegroundColor Yellow
    
    $url = "https://portfolio-intelligence.co.uk/api/update-prices?batch=$BatchSize&offset=$offset"
    Write-Host "URL: $url" -ForegroundColor Gray
    
    try {
        $response = Invoke-RestMethod -Uri $url -Method GET -TimeoutSec 120
        
        Write-Host "✅ Status: Success" -ForegroundColor Green
        Write-Host "   Message: $($response.message)" -ForegroundColor White
        Write-Host "   Success: $($response.stats.success) | Errors: $($response.stats.errors)" -ForegroundColor White
        Write-Host "   Progress: $($response.stats.processed)/$($response.stats.total) stocks" -ForegroundColor Cyan
        Write-Host "   Execution time: $($response.executionTime)" -ForegroundColor Gray
        
        if ($response.errors -and $response.errors.Count -gt 0) {
            Write-Host "   Errors encountered:" -ForegroundColor Red
            $response.errors | ForEach-Object { Write-Host "     - $_" -ForegroundColor Red }
        }
        
        $totalProcessed += ($response.stats.success + $response.stats.errors)
        $offset = $response.stats.processed
        $nextBatchUrl = $response.nextBatchUrl
        
        if ($response.stats.remaining -eq 0) {
            Write-Host ""
            Write-Host ("=" * 60) -ForegroundColor DarkGray
            Write-Host "✅ All stocks processed!" -ForegroundColor Green
            Write-Host "   Total: $($response.stats.total) stocks" -ForegroundColor White
            Write-Host "   Success: $($response.stats.success)" -ForegroundColor Green
            Write-Host "   Errors: $($response.stats.errors)" -ForegroundColor $(if ($response.stats.errors -gt 0) { "Red" } else { "White" })
            break
        }
        
        $batchNumber++
        Start-Sleep -Seconds 2  # Wait a bit between batches
        
    } catch {
        Write-Host "❌ Error in batch #$batchNumber" -ForegroundColor Red
        Write-Host "   $($_.Exception.Message)" -ForegroundColor Red
        
        Write-Host ""
        Write-Host "Stopping batch process due to error" -ForegroundColor Yellow
        break
    }
    
} while ($true)

Write-Host ""
Write-Host "Batch process complete." -ForegroundColor Cyan
Write-Host "Total stocks processed: $totalProcessed" -ForegroundColor White
