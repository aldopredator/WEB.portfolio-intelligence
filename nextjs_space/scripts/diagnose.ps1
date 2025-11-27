<#
PowerShell diagnostics helper for the project.

Usage:
  # Show diagnostics only
  .\diagnose.ps1

  # Run install (prefers yarn if available)
  .\diagnose.ps1 -RunInstall

  # Run install and build
  .\diagnose.ps1 -RunInstall -RunBuild

This script is intended to be run locally on Windows PowerShell.
#>

param(
  [switch]$RunInstall,
  [switch]$RunBuild
)

function Check-Command($name) {
  return (Get-Command $name -ErrorAction SilentlyContinue) -ne $null
}

Write-Host "=== Project Diagnose: nextjs_space ===" -ForegroundColor Cyan
Write-Host "Working directory: $(Get-Location)"

$hasNode = Check-Command node
$hasNpm = Check-Command npm
$hasYarn = Check-Command yarn

Write-Host "Node installed:" ($hasNode ? "Yes" : "No")
if ($hasNode) { node -v }
Write-Host "npm installed:" ($hasNpm ? "Yes" : "No")
if ($hasNpm) { npm -v }
Write-Host "yarn installed:" ($hasYarn ? "Yes" : "No")
if ($hasYarn) { yarn -v }

Write-Host "`nRecommended commands to run locally:`n" -ForegroundColor Yellow
Write-Host "  cd $(Resolve-Path ..)\nextjs_space"
Write-Host "  (if using yarn) yarn install && yarn build"
Write-Host "  (or) (if using npm) npm install && npm run build"

if ($RunInstall) {
  if ($hasYarn) {
    Write-Host "Running: yarn install" -ForegroundColor Green
    yarn install
  } elseif ($hasNpm) {
    Write-Host "Running: npm install" -ForegroundColor Green
    npm install
  } else {
    Write-Host "Neither yarn nor npm found. Please install Node.js (which includes npm) or Yarn." -ForegroundColor Red
    exit 1
  }
}

if ($RunBuild) {
  if ($hasYarn) {
    Write-Host "Running: yarn build" -ForegroundColor Green
    yarn build
  } elseif ($hasNpm) {
    Write-Host "Running: npm run build" -ForegroundColor Green
    npm run build
  } else {
    Write-Host "Cannot run build: missing package manager." -ForegroundColor Red
    exit 1
  }
}

Write-Host "`nDone. If you hit errors, paste the error output here and I'll diagnose further." -ForegroundColor Cyan
