#!/usr/bin/env bash
set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$root"

if find . -maxdepth 4 -type d -name '.vscode' -not -path './node_modules/*' | grep -q .; then
  echo "Malicious-code check failed: unexpected .vscode directory."
  exit 1
fi

patterns='global\.i[[:space:]]*=|global\[['"'"'"]r['"'"'"]\][[:space:]]*=[[:space:]]*require|while[[:space:]]*\([[:space:]]*!![[:space:]]*\[[[:space:]]*\][[:space:]]*\)|function[[:space:]]+_0x[0-9a-fA-F]{4,}[[:space:]]*\(|spawn[[:space:]]*\([^)]*\[[[:space:]]*['"'"'"]-e['"'"'"]'
if grep -RIlE "$patterns" . --exclude='check-malicious-code.sh' --exclude-dir=.git --exclude-dir=node_modules --exclude-dir=dist --exclude-dir=build --exclude-dir=coverage | grep -q .; then
  echo "Malicious-code check failed: suspicious obfuscated pattern found."
  exit 1
fi

echo "Malicious-code check passed."

