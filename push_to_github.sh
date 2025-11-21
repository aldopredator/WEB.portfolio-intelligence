
#!/bin/bash

# GitHub Push Helper Script
# This script helps you push the stock insights dashboard to GitHub

echo "╔════════════════════════════════════════════════════════════╗"
echo "║          Stock Insights Dashboard - GitHub Push           ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Check if token is provided
if [ -z "$1" ]; then
    echo "❌ ERROR: GitHub Personal Access Token required!"
    echo ""
    echo "Usage:"
    echo "  ./push_to_github.sh YOUR_GITHUB_TOKEN"
    echo ""
    echo "Example:"
    echo "  ./push_to_github.sh ghp_1234567890abcdefghijklmnopqrstuvwxyz"
    echo ""
    echo "📖 How to get a token:"
    echo "   1. Go to: https://github.com/settings/tokens"
    echo "   2. Click 'Generate new token (classic)'"
    echo "   3. Select 'repo' scope"
    echo "   4. Generate and copy the token"
    echo ""
    echo "📄 See GIT_PUSH_INSTRUCTIONS.md for detailed instructions"
    exit 1
fi

TOKEN=$1
REPO_URL="https://github.com/aldopredator/WEB.portfolio-intelligence.git"

echo "🔍 Checking repository status..."
cd /home/ubuntu/stock_insights_dashboard/nextjs_space

# Verify git is initialized
if [ ! -d ".git" ]; then
    echo "❌ Git repository not found!"
    exit 1
fi

echo "✅ Repository found"
echo ""

# Show current status
echo "📊 Current status:"
git status --short
echo ""

# Push to GitHub
echo "🚀 Pushing to GitHub..."
echo "   Repository: $REPO_URL"
echo "   Branch: main"
echo ""

# Use token in URL for authentication
git push https://${TOKEN}@github.com/aldopredator/WEB.portfolio-intelligence.git main

if [ $? -eq 0 ]; then
    echo ""
    echo "╔════════════════════════════════════════════════════════════╗"
    echo "║                    ✅ SUCCESS!                             ║"
    echo "╚════════════════════════════════════════════════════════════╝"
    echo ""
    echo "Your code has been pushed to GitHub!"
    echo ""
    echo "🌐 View your repository:"
    echo "   https://github.com/aldopredator/WEB.portfolio-intelligence"
    echo ""
    echo "🚀 Live dashboard:"
    echo "   https://portfolio-intelligence.co.uk"
    echo ""
else
    echo ""
    echo "╔════════════════════════════════════════════════════════════╗"
    echo "║                    ❌ PUSH FAILED                          ║"
    echo "╚════════════════════════════════════════════════════════════╝"
    echo ""
    echo "Possible issues:"
    echo "  • Invalid or expired token"
    echo "  • Insufficient permissions (need 'repo' scope)"
    echo "  • Repository doesn't exist or no write access"
    echo ""
    echo "📖 Check GIT_PUSH_INSTRUCTIONS.md for troubleshooting"
    exit 1
fi
