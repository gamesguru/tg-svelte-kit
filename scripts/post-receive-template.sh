#!/bin/bash
# post-receive hook template
# Copy this file to your remote server's .git/hooks/post-receive
# Make sure to make it executable: chmod +x .git/hooks/post-receive

# Define the deployment directory (Work Tree)
# If your remote is a bare repo, you must checkout the code somewhere to run tests/build.
# Example: automatically deploying to a folder named 'deploy' next to the git repo
DEPLOY_DIR="$(pwd)/deploy"   # Adjust this path as needed
echo "Deploying to $DEPLOY_DIR..."

# Create the directory if it doesn't exist
mkdir -p "$DEPLOY_DIR"

# Checkout the latest code to the deploy directory
git --work-tree="$DEPLOY_DIR" --git-dir="." checkout -f

# Navigate to the deploy directory
echo "Navigating to $DEPLOY_DIR"
cd "$DEPLOY_DIR" || exit 1

# Run the verification script
echo "Running legacy build verification..."
if ./scripts/verify-legacy-build.sh; then
    echo "✅ Build Verification Passed"
else
    echo "❌ Build Verification Failed"
    exit 1
fi
