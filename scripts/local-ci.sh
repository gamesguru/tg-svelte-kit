#!/usr/bin/env bash
# Local CI Simulation Script
# Runs the same checks as GitHub Actions CI workflows locally
#
# Usage:
#   ./scripts/local-ci.sh           # Run all checks
#   ./scripts/local-ci.sh quick     # Quick checks only (lint, check, unit tests)
#   ./scripts/local-ci.sh lint      # Lint only
#   ./scripts/local-ci.sh check     # Type check only
#   ./scripts/local-ci.sh unit      # Unit tests only
#   ./scripts/local-ci.sh e2e       # E2E tests only
#   ./scripts/local-ci.sh kit       # Full kit tests (unit + integration)
#   ./scripts/local-ci.sh cross     # Cross-platform tests
#   ./scripts/local-ci.sh legacy    # Legacy template tests

set -e
set -o pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$ROOT_DIR"

# Ensure log directory exists
CI_ROOT="$ROOT_DIR/.tmp/ci-logs"
TIMESTAMP=$(date +%s)
LOG_DIR="$CI_ROOT/$TIMESTAMP"
mkdir -p "$LOG_DIR"

# Update latest link (remove if it's a dir or link)
rm -rf "$CI_ROOT/latest"
ln -s "$TIMESTAMP" "$CI_ROOT/latest"

echo "Logging to: $LOG_DIR"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[✓]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[✗]${NC} $1"; }
log_step() {
	echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
	echo -e "${BLUE}[STEP]${NC} $1"
	echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

# Track results
declare -A RESULTS
FAILED=0

run_step() {
	local name="$1"
	local cmd="$2"

	log_step "$name"
	echo "$ $cmd"

	if eval "$cmd"; then
		log_success "$name passed"
		RESULTS["$name"]="✓"
	else
		log_error "$name failed"
		RESULTS["$name"]="✗"
		FAILED=$((FAILED + 1))
	fi
}

run_step_optional() {
	local name="$1"
	local cmd="$2"

	log_step "$name (optional)"
	echo "$ $cmd"

	if eval "$cmd"; then
		log_success "$name passed"
		RESULTS["$name"]="✓"
	else
		log_warn "$name failed (non-blocking)"
		RESULTS["$name"]="~"
	fi
}

print_summary() {
	echo ""
	log_step "Summary"
	for key in "${!RESULTS[@]}"; do
		if [[ "${RESULTS[$key]}" == "✓" ]]; then
			echo -e "  ${GREEN}✓${NC} $key"
		elif [[ "${RESULTS[$key]}" == "~" ]]; then
			echo -e "  ${YELLOW}~${NC} $key (skipped/optional)"
		else
			echo -e "  ${RED}✗${NC} $key"
		fi
	done

	if [[ $FAILED -eq 0 ]]; then
		echo ""
		log_success "All checks passed!"
		exit 0
	else
		echo ""
		log_error "$FAILED check(s) failed"
		exit 1
	fi
}

# Ensure dependencies are installed
ensure_deps() {
	if [[ ! -d "node_modules" ]]; then
		log_info "Installing dependencies..."
		pnpm install
	fi
}

# Ensure Playwright browsers are installed
ensure_playwright() {
	if ! command -v playwright &>/dev/null; then
		log_info "Installing Playwright browsers..."
		pnpm playwright install chromium
	fi
}

# ============================================================================
# Individual check functions
# ============================================================================

do_lint() {
	run_step "Lint" "pnpm run lint 2>&1 | tee \"$LOG_DIR/lint.log\""
}

do_check() {
	run_step "Type Check (prepublishOnly)" "cd packages/kit && pnpm prepublishOnly 2>&1 | tee \"$LOG_DIR/check.log\""
	run_step "Type Check (check)" "pnpm run check 2>&1 | tee -a \"$LOG_DIR/check.log\""
}

do_unit() {
	run_step "Unit Tests" "cd packages/kit && pnpm test:unit 2>&1 | tee \"$LOG_DIR/unit.log\""
}

do_e2e() {
	ensure_playwright
	run_step "E2E Tests (dev)" "pnpm test:cross-platform:dev 2>&1 | tee \"$LOG_DIR/e2e.log\""
	run_step "E2E Tests (build)" "pnpm test:cross-platform:build 2>&1 | tee -a \"$LOG_DIR/e2e.log\""
}

do_kit() {
	run_step "Kit Tests" "cd packages/kit && pnpm test 2>&1 | tee \"$LOG_DIR/kit.log\""
}

do_cross() {
	ensure_playwright
	run_step "Cross-Platform Tests (dev)" "pnpm test:cross-platform:dev 2>&1 | tee \"$LOG_DIR/cross.log\""
	run_step "Cross-Platform Tests (build)" "pnpm test:cross-platform:build 2>&1 | tee -a \"$LOG_DIR/cross.log\""
}

do_ssrr() {
	ensure_playwright
	run_step "Server-Side Route Resolution (dev)" "pnpm test:server-side-route-resolution:dev 2>&1 | tee \"$LOG_DIR/ssrr.log\""
	run_step "Server-Side Route Resolution (build)" "pnpm test:server-side-route-resolution:build 2>&1 | tee -a \"$LOG_DIR/ssrr.log\""
}

do_async() {
	ensure_playwright
	run_step "Svelte Async Tests (dev)" "pnpm test:svelte-async:dev 2>&1 | tee \"$LOG_DIR/async.log\""
	run_step "Svelte Async Tests (build)" "pnpm test:svelte-async:build 2>&1 | tee -a \"$LOG_DIR/async.log\""
}

do_others() {
	run_step "Other Tests" "pnpm -w run test:others 2>&1 | tee \"$LOG_DIR/others.log\""
}

do_legacy() {
	if [[ -d "website-template-svkit-v2-legacy" ]]; then
		run_step "Build Kit" "cd packages/kit && pnpm build && pnpm check 2>&1 | tee \"$LOG_DIR/legacy_build.log\""
		run_step "Legacy Template Install" "cd website-template-svkit-v2-legacy && pnpm install 2>&1 | tee \"$LOG_DIR/legacy.log\""
		run_step "Legacy Template Tests" "cd website-template-svkit-v2-legacy && pnpm test 2>&1 | tee -a \"$LOG_DIR/legacy.log\""
	else
		log_warn "Legacy template directory not found, skipping"
		RESULTS["Legacy Template"]="~"
	fi
}

do_quick() {
	log_info "Running quick checks (lint, check, unit tests)..."
	ensure_deps
	pnpm run sync-all 2>/dev/null || true

	do_lint
	do_check

	# Only run unit tests from kit (faster than full test:kit)
	run_step "Unit Tests (fast)" "cd packages/kit && pnpm test:unit:dev 2>&1 | tee \"$LOG_DIR/unit.log\""
}

do_all() {
	log_info "Running full CI simulation..."
	ensure_deps
	ensure_playwright
	pnpm run sync-all

	do_lint
	do_check
	do_kit
	do_cross
	do_ssrr
	do_async
	do_others
	do_legacy
}

# ============================================================================
# Main
# ============================================================================

MODE="${1:-all}"

case "$MODE" in
quick)
	do_quick
	;;
lint)
	ensure_deps
	do_lint
	;;
check)
	ensure_deps
	do_check
	;;
unit)
	ensure_deps
	pnpm run sync-all 2>/dev/null || true
	run_step "Unit Tests" "cd packages/kit && pnpm test:unit"
	;;
e2e)
	ensure_deps
	ensure_playwright
	pnpm run sync-all 2>/dev/null || true
	do_e2e
	;;
kit)
	ensure_deps
	ensure_playwright
	pnpm run sync-all
	do_kit
	;;
cross)
	ensure_deps
	ensure_playwright
	pnpm run sync-all
	do_cross
	;;
ssrr)
	ensure_deps
	ensure_playwright
	pnpm run sync-all
	do_ssrr
	;;
async)
	ensure_deps
	ensure_playwright
	pnpm run sync-all
	do_async
	;;
others)
	ensure_deps
	pnpm run sync-all 2>/dev/null || true
	do_others
	;;
legacy)
	ensure_deps
	do_legacy
	;;
all)
	do_all
	;;
*)
	echo "Usage: $0 {quick|lint|check|unit|e2e|kit|cross|ssrr|async|others|legacy|all}"
	echo ""
	echo "Options:"
	echo "  quick   - Fast checks: lint, type check, unit tests"
	echo "  lint    - Run linter only"
	echo "  check   - Run type check only"
	echo "  unit    - Run unit tests only"
	echo "  e2e     - Run E2E tests (dev + build)"
	echo "  kit     - Run full kit tests"
	echo "  cross   - Run cross-platform tests"
	echo "  ssrr    - Run server-side route resolution tests"
	echo "  async   - Run svelte async tests"
	echo "  others  - Run other package tests"
	echo "  legacy  - Run legacy template tests"
	echo "  all     - Run everything (default)"
	exit 1
	;;
esac

print_summary
