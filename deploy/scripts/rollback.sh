#!/usr/bin/env bash
set -euo pipefail

deploy_root="${PEPSA_STATIC_ROOT:-${HOME}/var/www/customer-frontend-production}"
cd "$deploy_root"
test -f .dist-previous/index.html || { echo "ERROR: no previous build is available." >&2; exit 1; }

failed_dist="$deploy_root/.dist-failed-$(date +%Y%m%d%H%M%S)"
mv dist "$failed_dist"
mv .dist-previous dist
echo "Rolled back frontend; replaced build retained at $failed_dist"
