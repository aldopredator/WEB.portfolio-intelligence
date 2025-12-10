# Continuous Integration / Automated Testing

This repository has automated testing configured to run on every commit.

## GitHub Actions (CI/CD)

### When Tests Run Automatically:
- ✅ **Every push** to `main` or `develop` branch
- ✅ **Every pull request** targeting `main` or `develop`
- ✅ Tests run in isolated Ubuntu environment
- ✅ Results available in GitHub Actions tab

### What Happens:
1. Code is checked out
2. Node.js 20 and dependencies installed
3. Playwright browsers installed
4. Environment configured
5. All 21 tests executed
6. Test reports uploaded as artifacts (available for 30 days)

### Viewing Results:
1. Go to your repository on GitHub
2. Click the **Actions** tab
3. Select the workflow run
4. View test results and download artifacts (screenshots, traces, reports)

### Status Badges:
Add this to your README.md to show test status:
```markdown
![Playwright Tests](https://github.com/aldopredator/WEB.portfolio-intelligence/actions/workflows/playwright-tests.yml/badge.svg)
```

## Local Pre-Commit Hooks (Optional)

For even faster feedback, you can run tests before committing:

### Setup:
```bash
cd nextjs_space
yarn add -D husky
npx husky install
```

### Configure:
Edit `.huskyrc.json` to enable/disable hooks:
- `pre-commit`: Quick test run (stops at 5 failures)
- `pre-push`: Full test suite before pushing

### Skip Hooks:
If you need to commit without running tests:
```bash
git commit --no-verify -m "your message"
```

## Test Failure Handling
