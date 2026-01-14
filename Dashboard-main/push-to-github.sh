#!/bin/bash

echo "🚀 Pushing Sentinel-Dashboard to GitHub..."

# Check if we're in a git repository
if [ ! -d ".git" ]; then
    echo "❌ Not a git repository"
    exit 1
fi

# Add all files
git add .

# Check if there are changes to commit
if git diff --staged --quiet; then
    echo "✅ No changes to commit"
else
    # Commit changes
    git commit -m "Update Sentinel Dashboard"
    echo "✅ Changes committed"
fi

# Push to GitHub
echo "📤 Pushing to GitHub..."
git push -u origin main

if [ $? -eq 0 ]; then
    echo "✅ Successfully pushed to GitHub!"
    echo "🌐 Repository: https://github.com/rauneets-sketch/Sentinel-Dashboard"
else
    echo "❌ Push failed. Please check your GitHub authentication."
    echo "💡 Try: git push -u origin main"
fi