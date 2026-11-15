#!/usr/bin/env bash
set -euo pipefail

deploy_root="${PEPSA_STATIC_ROOT:-${HOME}/var/www/customer-frontend-production}"
cd "$deploy_root"

test -d .git || { echo "ERROR: $deploy_root is not a git clone." >&2; exit 1; }
test -f shared/.env || { echo "ERROR: missing $deploy_root/shared/.env" >&2; exit 1; }

ln -sfn shared/.env .env
export PATH="/usr/local/bin:/usr/bin:/bin:${HOME}/.local/bin:${PATH}"
[[ -s "${HOME}/.nvm/nvm.sh" ]] && source "${HOME}/.nvm/nvm.sh"
export NODE_OPTIONS="${NODE_OPTIONS:---max-old-space-size=1536}"

pnpm install --frozen-lockfile

next_dist="$deploy_root/.dist-next-$$"
previous_dist="$deploy_root/.dist-previous"
rm -rf "$next_dist"
export PEPSA_VITE_OUTDIR="$next_dist"
pnpm build
test -f "$next_dist/index.html"

rm -rf "$previous_dist"
if [[ -d "$deploy_root/dist" ]]; then
  mv "$deploy_root/dist" "$previous_dist"
fi
mv "$next_dist" "$deploy_root/dist"

echo "Customer frontend deployed at $(git rev-parse --short HEAD) to $deploy_root/dist"
