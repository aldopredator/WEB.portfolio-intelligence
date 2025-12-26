# Internal Score Automation Setup

## Overview

The Internal Score model automatically recalculates factor weights daily based on the latest portfolio performance data. This ensures the scoring model stays current with market conditions and your portfolio's evolution.

## Features

✅ **Daily Automated Execution** - Runs at 2 AM daily  
✅ **Delta Tracking** - Shows how factor weights changed from previous run  
✅ **Historical Archive** - Keeps daily snapshots in `.internal-score-history/`  
✅ **Transparent Features** - Each predictive feature shows which factor it belongs to  
✅ **Logs & Monitoring** - Full execution logs for troubleshooting

## Setup Options

### Option 1: Windows Task Scheduler (Local)

**Recommended for local development and testing**

1. **Open PowerShell as Administrator**

2. **Run the setup script:**
   ```powershell
   cd nextjs_space
   .\scripts\setup-internal-score-scheduler.ps1
   ```

3. **Verify the task was created:**
   ```powershell
   Get-ScheduledTask -TaskName "PortfolioIntelligence-InternalScore-Daily"
   ```

4. **Test immediately (optional):**
   ```powershell
   Start-ScheduledTask -TaskName "PortfolioIntelligence-InternalScore-Daily"
   ```

**Configuration:**
- Default schedule: Daily at 2:00 AM
- Task name: `PortfolioIntelligence-InternalScore-Daily`
- Logs: `nextjs_space/logs/internal-score-YYYY-MM-DD.log`
- Runs even if user is not logged in

**Management Commands:**
```powershell
# View task details
Get-ScheduledTask -TaskName "PortfolioIntelligence-InternalScore-Daily" | Format-List

# Run manually
Start-ScheduledTask -TaskName "PortfolioIntelligence-InternalScore-Daily"

# Disable temporarily
Disable-ScheduledTask -TaskName "PortfolioIntelligence-InternalScore-Daily"

# Re-enable
Enable-ScheduledTask -TaskName "PortfolioIntelligence-InternalScore-Daily"

# Remove task
Unregister-ScheduledTask -TaskName "PortfolioIntelligence-InternalScore-Daily" -Confirm:$false
```

### Option 2: GitHub Actions (Cloud)

**Recommended for production deployment**

The GitHub Actions workflow is already configured in `.github/workflows/internal-score-daily.yml`.

**Prerequisites:**
1. **Add GitHub Secrets** (Settings → Secrets and variables → Actions):
   - `PORTFOLIO_INTELLIGENCE_PRISMA_DATABASE_URL` - Your PostgreSQL connection string
   - `POLYGON_API_KEY` - Polygon.io API key
   - `FINNHUB_API_KEY` - Finnhub API key

2. **Enable GitHub Actions** (if not already enabled):
   - Go to repository Settings → Actions → General
   - Allow all actions and reusable workflows

**Features:**
- ✅ Runs daily at 2:00 AM UTC
- ✅ Can be manually triggered via "Run workflow" button
- ✅ Automatically commits results to repository
- ✅ Uploads analysis artifacts (90-day retention)
- ✅ Creates run summary with factor weights

**Manual Trigger:**
1. Go to Actions tab in GitHub
2. Select "Internal Score Daily Update"
3. Click "Run workflow"

**Monitoring:**
- View run history in Actions tab
- Check workflow logs for details
- Download artifacts for offline analysis

## Output Files

### `internal-score-analysis.json`
Latest analysis results (committed to git)

```json
{
  "generatedAt": "2025-12-26T02:00:00.000Z",
  "generatedDate": "2025-12-26",
  "dataPoints": 406,
  "return90d": {
    "samples": 225,
    "ridgeRegression": {
      "r2": 0.1090,
      "factors": {
        "value": 0.200,
        "quality": 0.339,
        "growth": 0.246,
        "momentum": 0.005,
        "risk": 0.210
      }
    },
    "topFeatures": [
      {
        "name": "pbRatio",
        "coefficient": 4.8212,
        "factor": "Value"
      },
      ...
    ]
  }
}
```

### `.internal-score-history/internal-score-YYYY-MM-DD.json`
Daily snapshots for historical comparison (local only, not in git)

### `logs/internal-score-YYYY-MM-DD.log`
Execution logs (Windows Task Scheduler only)

## Delta Tracking Output

When previous results exist, the script automatically shows changes:

```
==============================================================
📊 FACTOR WEIGHT CHANGES (Delta Analysis)
==============================================================
Previous: 2025-12-25
Current:  2025-12-26

90-Day Return Model:
   🟢 value       20.0% → 21.5%  ↑ +1.5pp (+7.5%)
   ⚪ quality     33.9% → 33.5%  ↓ -0.4pp (-1.2%)
   🔴 growth      24.6% → 22.1%  ↓ -2.5pp (-10.2%)
   ⚪ momentum     0.5% → 0.6%   ↑ +0.1pp (+20.0%)
   ⚪ risk        21.0% → 22.3%  ↑ +1.3pp (+6.2%)

   Model R²: 0.1090 → 0.1135  ↑ +0.45%
   Samples:  225 → 230  +5
```

**Legend:**
- 🟢 Green: Increase > 1 percentage point
- 🔴 Red: Decrease > 1 percentage point  
- ⚪ White: Minimal change (< 1 pp)
- pp = percentage points

## Transparent Feature Mapping

Each feature now shows which factor it contributes to:

```
🔝 Top 10 Most Important Features (with Factor Mapping):
   1. pbRatio [Value]: 4.8212
   2. roe [Quality]: 4.2043
   3. profitMargin [Quality]: 2.9188
   4. heldPercentInsiders [Quality]: 2.8540
   5. revenueGrowthQoQ [Growth]: 2.2310
   6. marketCap [Risk]: 1.9801
   7. sharesOutstanding [Risk]: 1.8953
   8. heldPercentInstitutions [Quality]: 1.7379
   9. earningsGrowthQoQ [Growth]: 1.5903
   10. roa [Quality]: 1.4549
```

This helps understand:
- **Why** a factor has high/low weight
- **Which metrics** are driving predictions
- **What data quality** issues might exist

## Troubleshooting

### Windows Task Scheduler Issues

**Task doesn't run:**
1. Check task is enabled: `Get-ScheduledTask -TaskName "PortfolioIntelligence-InternalScore-Daily"`
2. Verify trigger settings in Task Scheduler GUI
3. Check user has permissions to run scheduled tasks
4. Review logs in `nextjs_space/logs/`

**Permission errors:**
1. Ensure script was set up as Administrator
2. Check database connection string in `.env` file
3. Verify working directory path is correct

**No output:**
1. Check logs directory exists: `nextjs_space/logs/`
2. Verify PowerShell execution policy: `Get-ExecutionPolicy`
3. Test script manually: `.\scripts\run-internal-score-daily.ps1`

### GitHub Actions Issues

**Workflow doesn't run:**
1. Check GitHub Actions is enabled in repo settings
2. Verify secrets are configured correctly
3. Check workflow syntax with GitHub Actions validator

**Database connection fails:**
1. Ensure `PORTFOLIO_INTELLIGENCE_PRISMA_DATABASE_URL` secret is set
2. Verify database allows connections from GitHub Actions IPs
3. Check connection string format

**No commits:**
1. Ensure GitHub token has write permissions
2. Check if `.gitignore` is blocking files
3. Verify changes were detected

## Log Retention

- **Windows Task Scheduler**: Logs kept for 30 days (configurable in script)
- **GitHub Actions**: Artifacts kept for 90 days (configurable in workflow)
- **History Snapshots**: Kept indefinitely in `.internal-score-history/` (local only)

## Performance Considerations

**Execution Time:**
- Typically 2-5 minutes for 400+ stocks
- Depends on database query performance
- Network latency can affect duration

**Resource Usage:**
- Memory: ~500 MB peak
- CPU: Moderate during matrix operations
- Disk: <10 MB per daily snapshot

**Database Load:**
- Reads all active stocks + metrics + price history
- No writes to database
- Read-only operations, safe to run anytime

## Customization

### Change Schedule Time

**Windows:**
Edit time in `setup-internal-score-scheduler.ps1`:
```powershell
param(
    [string]$RunTime = "03:30"  # Run at 3:30 AM
)
```

**GitHub Actions:**
Edit cron in `.github/workflows/internal-score-daily.yml`:
```yaml
schedule:
  - cron: '30 3 * * *'  # Run at 3:30 AM UTC
```

### Change History Retention

Edit `run-internal-score-daily.ps1`:
```powershell
# Keep last 60 days instead of 30
$cutoffDate = (Get-Date).AddDays(-60)
```

### Disable Automation

**Windows:**
```powershell
Disable-ScheduledTask -TaskName "PortfolioIntelligence-InternalScore-Daily"
```

**GitHub Actions:**
Comment out the `schedule` trigger in workflow file, or disable the workflow in GitHub UI.

## Manual Execution

You can always run the analysis manually:

```bash
# From nextjs_space directory
npx tsx --require dotenv/config scripts/calculate-internal-score.ts
```

This is useful for:
- Testing after data updates
- Debugging issues
- Ad-hoc analysis
- Validating before committing changes

## Best Practices

1. **Monitor logs regularly** - Check for errors or data quality issues
2. **Review delta changes** - Large swings may indicate data problems
3. **Keep historical snapshots** - Useful for trend analysis
4. **Test manual runs first** - Before enabling automation
5. **Document configuration changes** - If you modify schedules or parameters
6. **Back up history folder** - Before major changes to database schema

## Support

If you encounter issues:
1. Check logs first (`logs/` directory or GitHub Actions logs)
2. Verify environment variables and secrets
3. Test manual execution
4. Review database connection and data quality
5. Check GitHub Actions workflow status

---

**Last Updated:** December 26, 2025  
**Automation Version:** 1.0.0
