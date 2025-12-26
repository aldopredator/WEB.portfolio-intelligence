# Setup Windows Task Scheduler for Daily Internal Score Updates

param(
    [string]$ScriptPath = "C:\Users\khaledh\OneDrive - SkySparc\Documents\GitHub\WEB.portfolio-intelligence\nextjs_space\scripts\run-internal-score-daily.ps1",
    [string]$TaskName = "PortfolioIntelligence-InternalScore-Daily",
    [string]$RunTime = "02:00"  # 2 AM daily
)

Write-Host "=================================================="
Write-Host "Setting up Windows Task Scheduler"
Write-Host "=================================================="

# Check if running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "❌ This script requires Administrator privileges"
    Write-Host "   Please run PowerShell as Administrator and try again"
    exit 1
}

# Check if task already exists
$existingTask = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue

if ($existingTask) {
    Write-Host "⚠️  Task '$TaskName' already exists"
    $response = Read-Host "Do you want to overwrite it? (Y/N)"
    if ($response -ne 'Y' -and $response -ne 'y') {
        Write-Host "Aborted."
        exit 0
    }
    Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
    Write-Host "✓ Removed existing task"
}

# Create the scheduled task action
$action = New-ScheduledTaskAction `
    -Execute "PowerShell.exe" `
    -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$ScriptPath`"" `
    -WorkingDirectory (Split-Path $ScriptPath -Parent)

# Create the trigger (daily at specified time)
$trigger = New-ScheduledTaskTrigger -Daily -At $RunTime

# Create the task principal (run as current user)
$principal = New-ScheduledTaskPrincipal `
    -UserId $env:USERNAME `
    -LogonType S4U `
    -RunLevel Highest

# Create the task settings
$settings = New-ScheduledTaskSettingsSet `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -StartWhenAvailable `
    -RunOnlyIfNetworkAvailable `
    -MultipleInstances IgnoreNew

# Register the scheduled task
try {
    Register-ScheduledTask `
        -TaskName $TaskName `
        -Action $action `
        -Trigger $trigger `
        -Principal $principal `
        -Settings $settings `
        -Description "Daily update of Internal Score model weights based on portfolio performance analysis" `
        -ErrorAction Stop
    
    Write-Host "`n✅ Successfully created scheduled task: $TaskName"
    Write-Host "   Schedule: Daily at $RunTime"
    Write-Host "   Script:   $ScriptPath"
    
    # Test the task (optional)
    Write-Host "`nTest Options:"
    Write-Host "1. Run now (test the task immediately)"
    Write-Host "2. Skip test"
    $testChoice = Read-Host "Enter choice (1 or 2)"
    
    if ($testChoice -eq "1") {
        Write-Host "`nRunning task now..."
        Start-ScheduledTask -TaskName $TaskName
        Write-Host "✓ Task started. Check the logs folder for output."
    }
    
} catch {
    Write-Host "`n❌ Failed to create scheduled task: $_"
    exit 1
}

Write-Host "`n=================================================="
Write-Host "Task Scheduler Setup Complete"
Write-Host "=================================================="
Write-Host "`nManagement Commands:"
Write-Host "  View task:   Get-ScheduledTask -TaskName '$TaskName'"
Write-Host "  Run now:     Start-ScheduledTask -TaskName '$TaskName'"
Write-Host "  Disable:     Disable-ScheduledTask -TaskName '$TaskName'"
Write-Host "  Enable:      Enable-ScheduledTask -TaskName '$TaskName'"
Write-Host "  Remove:      Unregister-ScheduledTask -TaskName '$TaskName' -Confirm:`$false"
Write-Host "`nLogs will be saved to: nextjs_space\logs\"

exit 0
