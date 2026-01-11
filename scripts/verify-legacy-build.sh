#!/bin/bash
set -e

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting Legacy Build Verification...${NC}"

# Ensure we are in the project root
cd "$(dirname "$0")/.."

echo -e "${GREEN}[1/5] Installing Root Dependencies...${NC}"
pnpm install

echo -e "${GREEN}[2/5] Checking Kit Package...${NC}"
cd packages/kit
pnpm check
cd ../..

echo -e "${GREEN}[3/5] Installing Template Dependencies...${NC}"
cd website-template-svkit-v2-legacy
pnpm install

# Check if playwright browsers are installed, if not, install them
if [ ! -d "node_modules/.bin/playwright" ]; then
    echo -e "${GREEN}[4/5] Installing Playwright Dependencies (this may take a while)...${NC}"
    npx playwright install --with-deps
else
    echo -e "${GREEN}[4/5] Playwright seems installed, skipping full install (run 'npx playwright install' manually if needed)...${NC}"
fi

echo -e "${GREEN}[5/5] Running E2E Tests (Builds & Previews)...${NC}"
pnpm test

echo -e "${GREEN}Legacy Build Verification Passed!${NC}"
