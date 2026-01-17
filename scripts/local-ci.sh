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
export PATH="$ROOT_DIR/node_modules/.bin:$PATH"

# Ensure log directory exists
CI_ROOT="$ROOT_DIR/.tmp/ci-logs"
if [ -n "$2" ]; then
	TIMESTAMP="$2"
	echo "Resuming/Overwriting CI Run ID: $TIMESTAMP"
else
	TIMESTAMP=$(date +%s)
fi
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

# Exit on Ctrl+C
trap "echo ''; log_error 'Script interrupted by user'; exit 1" INT

run_step() {
	local name="$1"
	local cmd="$2"

	log_step "$name"
	echo "$ $cmd"

	if (eval "$cmd"); then
		log_success "$name passed"
		RESULTS["$name"]="✓"
	else
		log_error "$name failed"
		RESULTS["$name"]="✗"
		exit 1
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
	if ! pnpm exec playwright --version &>/dev/null; then
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
	# Legacy wrapper running both
	do_kit_unit
	do_kit_integration
}

do_kit_unit() {
	run_step "Kit Unit Tests" "cd packages/kit && pnpm test:unit 2>&1 | tee \"$LOG_DIR/kit-unit.log\""
}

do_kit_integration() {
	run_step "Kit Integration Tests" "cd packages/kit && pnpm test:integration 2>&1 | tee \"$LOG_DIR/kit-integration.log\""
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
	run_step "Other Package Tests" "pnpm -w run test:others 2>&1 | tee \"$LOG_DIR/others.log\""
}

do_legacy() {
	run_step "Legacy Template Install" "cd website-template-svkit-v2-legacy && npm install 2>&1 | tee \"$LOG_DIR/legacy.log\""
	run_step "Legacy Template Tests" "cd website-template-svkit-v2-legacy && npm run test 2>&1 | tee -a \"$LOG_DIR/legacy.log\""
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
	do_kit_unit
	do_kit_integration
	do_cross
	do_ssrr
	do_async
	do_others
	do_legacy
}

# ============================================================================
# Main
# ============================================================================

print_usage() {
	echo "Usage: $0 {quick|lint|check|unit|e2e|kit|kit-unit|kit-integration|cross|ssrr|async|others|legacy|all}"
	echo ""
	echo "Options:"
	echo "  quick            - Fast checks: lint, type check, unit tests"
	echo "  lint             - Run linter only"
	echo "  check            - Run type check only"
	echo "  unit             - Run unit tests only"
	echo "  e2e              - Run E2E tests (dev + build)"
	echo "  kit              - Run full kit tests (unit + integration)"
	echo "  kit-unit         - Run kit unit tests only"
	echo "  kit-integration  - Run kit integration tests only"
	echo "  cross            - Run cross-platform tests"
	echo "  ssrr             - Run server-side route resolution tests"
	echo "  async            - Run svelte async tests"
	echo "  others           - Run other package tests"
	echo "  legacy           - Run legacy template tests"
	echo "  all              - Run everything"
}

if [ -z "$1" ]; then
	print_usage
	exit 0
fi

# restart a run by timestamp. Combined with the ID override, i.e., restart from kit onwards:
#   ./scripts/local-ci.sh kit.. 1768617476

MODE="$1"

ALL_STEPS=(lint check unit kit kit-unit kit-integration e2e cross ssrr async others legacy)

# Check for range syntax (start..end or start..)
if [[ "$MODE" == *".."* ]]; then
	START_STEP="${MODE%..*}"
	END_STEP="${MODE#*..}"

	# Validate start step
	FOUND_START=false
	for i in "${!ALL_STEPS[@]}"; do
		if [[ "${ALL_STEPS[$i]}" == "$START_STEP" ]]; then
			START_IDX=$i
			FOUND_START=true
			break
		fi
	done

	if [ "$FOUND_START" = false ]; then
		log_error "Invalid start step: $START_STEP"
		print_usage
		exit 1
	fi

	# Validate end step (if provided)
	if [ -n "$END_STEP" ] && [ "$END_STEP" != "END" ]; then
		FOUND_END=false
		for i in "${!ALL_STEPS[@]}"; do
			if [[ "${ALL_STEPS[$i]}" == "$END_STEP" ]]; then
				END_IDX=$i
				FOUND_END=true
				break
			fi
		done

		if [ "$FOUND_END" = false ]; then
			log_error "Invalid end step: $END_STEP"
			print_usage
			exit 1
		fi
	else
		# Default to last step
		END_IDX=$((${#ALL_STEPS[@]} - 1))
	fi

	if [ "$START_IDX" -gt "$END_IDX" ]; then
		log_error "Start step cannot be after end step"
		exit 1
	fi

	echo "Running steps: ${ALL_STEPS[*]:$START_IDX:$((END_IDX - START_IDX + 1))}"

	# Run the range
	for ((i = START_IDX; i <= END_IDX; i++)); do
		STEP="${ALL_STEPS[$i]}"
		MODE="$STEP"
		case "$STEP" in
		lint)
			ensure_deps
			do_lint
			;;
		check)
			ensure_deps
			do_check
			;;
		kit)
			ensure_deps
			ensure_playwright
			pnpm run sync-all
			do_kit
			SKIP_KIT_SUBSTEPS=true
			;;
		kit-unit)
			if [ "$SKIP_KIT_SUBSTEPS" = true ]; then
				echo "Skipping kit-unit (already run by kit)"
			else
				ensure_deps
				pnpm run sync-all
				do_kit_unit
			fi
			;;
		kit-integration)
			if [ "$SKIP_KIT_SUBSTEPS" = true ]; then
				echo "Skipping kit-integration (already run by kit)"
			else
				ensure_deps
				ensure_playwright
				pnpm run sync-all
				do_kit_integration
			fi
			;;
		unit)
			ensure_deps
			pnpm run sync-all
			do_unit
			;;
		e2e)
			ensure_deps
			ensure_playwright
			pnpm run sync-all
			do_e2e
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
		esac
	done
	exit 0
fi

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
	do_unit
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
	do_kit_unit
	do_kit_integration
	;;
kit-unit)
	ensure_deps
	pnpm run sync-all
	do_kit_unit
	;;
kit-integration)
	ensure_deps
	ensure_playwright
	pnpm run sync-all
	do_kit_integration
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
	print_usage
	exit 1
	;;
esac

print_summary
