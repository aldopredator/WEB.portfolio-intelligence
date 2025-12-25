# Comprehensive Node.js Search
Write-Host "`nSearching thoroughly for Node.js installation...`n" -ForegroundColor Yellow

# Method 1: Check PATH
Write-Host "Checking PATH..." -ForegroundColor Gray
$pathDirs = $env:Path -split ";" | Where-Object { $_ -like "*node*" }
foreach ($dir in $pathDirs) {
    Write-Host "  Found in PATH: $dir" -ForegroundColor Cyan
    if (Test-Path (Join-Path $dir "node.exe")) {
        Write-Host "    ✓ node.exe exists here" -ForegroundColor Green
    }
}

# Method 2: Check common installation directories
Write-Host "`nChecking common installation directories..." -ForegroundColor Gray
$commonPaths = @(
    "C:\Program Files\nodejs",
    "C:\Program Files (x86)\nodejs",
    "$env:LOCALAPPDATA\Programs\nodejs",
    "$env:APPDATA\npm",
    "$env:APPDATA\nvm",
    "$env:ProgramFiles\nodejs",
    "${env:ProgramFiles(x86)}\nodejs",
    "C:\nodejs",
    "C:\Program Files\nvm",
    "$env:USERPROFILE\.nvm",
    "$env:NVM_HOME"
)

foreach ($path in $commonPaths) {
    if (Test-Path $path) {
        Write-Host "  Checking: $path" -ForegroundColor Cyan
        $nodeExe = Join-Path $path "node.exe"
        if (Test-Path $nodeExe) {
            Write-Host "    ✓ FOUND: node.exe" -ForegroundColor Green
            $version = & $nodeExe --version 2>&1
            Write-Host "    Version: $version" -ForegroundColor Green
        } else {
            # Check subdirectories
            $subDirs = Get-ChildItem -Path $path -Directory -ErrorAction SilentlyContinue
            foreach ($subDir in $subDirs) {
                $nodeExe = Join-Path $subDir.FullName "node.exe"
                if (Test-Path $nodeExe) {
                    Write-Host "    ✓ FOUND in subfolder: $($subDir.Name)" -ForegroundColor Green
                    $version = & $nodeExe --version 2>&1
                    Write-Host "    Version: $version" -ForegroundColor Green
                }
            }
        }
    }
}

# Method 3: Search entire C drive for node.exe (this takes time)
Write-Host "`nSearching C:\ drive (this may take a minute)..." -ForegroundColor Gray
$found = @()
Get-ChildItem -Path "C:\" -Filter "node.exe" -Recurse -ErrorAction SilentlyContinue | ForEach-Object {
    Write-Host "  ✓ FOUND: $($_.FullName)" -ForegroundColor Green
    $version = & $_.FullName --version 2>&1
    Write-Host "    Version: $version" -ForegroundColor Green
    $found += $_.DirectoryName
}

# Method 4: Check where.exe
Write-Host "`nChecking where.exe..." -ForegroundColor Gray
try {
    $wherePaths = where.exe node 2>$null
    if ($wherePaths) {
        foreach ($path in $wherePaths) {
            Write-Host "  ✓ FOUND via where.exe: $path" -ForegroundColor Green
        }
    }
} catch {}

# Method 5: Check VS Code / Development tools installations
Write-Host "`nChecking VS Code extensions..." -ForegroundColor Gray
$vscodeExtensions = "$env:USERPROFILE\.vscode\extensions"
if (Test-Path $vscodeExtensions) {
    Write-Host "  Checking: $vscodeExtensions" -ForegroundColor Cyan
    Get-ChildItem -Path $vscodeExtensions -Recurse -Filter "node.exe" -ErrorAction SilentlyContinue | ForEach-Object {
        Write-Host "    ✓ FOUND: $($_.DirectoryName)" -ForegroundColor Green
    }
}

# Summary
Write-Host "`n========================================" -ForegroundColor Cyan
if ($found.Count -gt 0) {
    Write-Host "Node.js installations found at:" -ForegroundColor Green
    foreach ($path in $found) {
        Write-Host "  $path" -ForegroundColor White
    }
} else {
    Write-Host "Node.js NOT found on this system" -ForegroundColor Red
    Write-Host "`nOptions:" -ForegroundColor Yellow
    Write-Host "  1. Install Node.js from: https://nodejs.org/" -ForegroundColor White
    Write-Host "     - Choose LTS version" -ForegroundColor Gray
    Write-Host "     - Select 'Just for me' (no admin required)" -ForegroundColor Gray
    Write-Host "`n  2. Use portable Node.js (no installation):" -ForegroundColor White
    Write-Host "     - Download zip from nodejs.org" -ForegroundColor Gray
    Write-Host "     - Extract to your user folder" -ForegroundColor Gray
    Write-Host "     - Point to it manually" -ForegroundColor Gray
}
Write-Host "`n========================================`n" -ForegroundColor Cyan

Read-Host "Press Enter to exit"
