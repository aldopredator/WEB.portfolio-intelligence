# Populate earnings surprises from Finnhub API
Write-Host "Fetching and storing earnings surprises for all stocks..." -ForegroundColor Cyan

try {
    $response = Invoke-RestMethod -Uri "https://portfolio-intelligence.co.uk/api/update-earnings" -Method POST -ContentType "application/json"
    
    Write-Host "`nSuccess!" -ForegroundColor Green
    Write-Host "Updated: $($response.updated) stocks" -ForegroundColor Green
    Write-Host "Skipped: $($response.skipped) stocks" -ForegroundColor Yellow
    Write-Host "Total: $($response.total) stocks" -ForegroundColor Cyan
    
    if ($response.errors -and $response.errors.Count -gt 0) {
        Write-Host "`nErrors:" -ForegroundColor Red
        $response.errors | ForEach-Object { Write-Host "  - $_" -ForegroundColor Red }
    }
} catch {
    Write-Host "`nError calling API: $_" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}
