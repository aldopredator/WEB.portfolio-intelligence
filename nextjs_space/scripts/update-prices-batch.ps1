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
    Write-Host "=" * 60 -ForegroundColor DarkGray
    Write-Host "Batch #$batchNumber (offset: $offset)" -ForegroundColor Yellow
    
    $url = "$baseUrl?batch=$BatchSize&offset=$offset"
    
    try {
        $response = Invoke-WebRequest -Uri $url -Method GET -UseBasicParsing -TimeoutSec 120
        $data = $response.Content | ConvertFrom-Json
        
        Write-Host "✅ Status: $($response.StatusCode)" -ForegroundColor Green
        Write-Host "   Message: $($data.message)" -ForegroundColor White
        Write-Host "   Success: $($data.stats.success) | Errors: $($data.stats.errors)" -ForegroundColor White
        Write-Host "   Progress: $($data.stats.processed)/$($data.stats.total) stocks" -ForegroundColor Cyan
        Write-Host "   Execution time: $($data.executionTime)" -ForegroundColor Gray
        
        if ($data.errors -and $data.errors.Count -gt 0) {
            Write-Host "   Errors encountered:" -ForegroundColor Red
            $data.errors | ForEach-Object { Write-Host "     - $_" -ForegroundColor Red }
        }
        
        $totalProcessed += ($data.stats.success + $data.stats.errors)
        $offset = $data.stats.processed
        $nextBatchUrl = $data.nextBatchUrl
        
        if ($data.stats.remaining -eq 0) {
            Write-Host ""
            Write-Host "=" * 60 -ForegroundColor DarkGray
            Write-Host "✅ All stocks processed!" -ForegroundColor Green
            Write-Host "   Total: $($data.stats.total) stocks" -ForegroundColor White
            Write-Host "   Success: $($data.stats.success)" -ForegroundColor Green
            Write-Host "   Errors: $($data.stats.errors)" -ForegroundColor $(if ($data.stats.errors -gt 0) { "Red" } else { "White" })
            break
        }
        
        $batchNumber++
        Start-Sleep -Seconds 2  # Wait a bit between batches
        
    } catch {
        Write-Host "❌ Error in batch #$batchNumber" -ForegroundColor Red
        Write-Host "   $($_.Exception.Message)" -ForegroundColor Red
        
        if ($_.Exception.Response) {
            $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            $responseBody = $reader.ReadToEnd()
            Write-Host "   Response: $responseBody" -ForegroundColor Red
        }
        
        Write-Host ""
        Write-Host "Stopping batch process due to error" -ForegroundColor Yellow
        break
    }
    
} while ($true)

Write-Host ""
Write-Host "Batch process complete." -ForegroundColor Cyan
Write-Host "Total stocks processed: $totalProcessed" -ForegroundColor White
