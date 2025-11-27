$cacheDir = Join-Path (Get-Location) ".cache"
$cacheFile = Join-Path $cacheDir "sentiment-cache.json"

if (Test-Path $cacheFile) {
    Write-Host "Removing cache file: $cacheFile"
    Remove-Item $cacheFile -Force
    Write-Host "Cache file removed."
} elseif (Test-Path $cacheDir) {
    Write-Host ".cache folder exists but no cache file found. Removing folder."
    Remove-Item $cacheDir -Recurse -Force
+    Write-Host "Cache folder removed."
+} else {
+    Write-Host "No cache found. Nothing to do."
+}
