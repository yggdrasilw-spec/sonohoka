#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
if grep -RInE 'ドパキチ|ドパドリル|Dopakichi|dopakichi|Dopa Drill|(^|[^[:alnum:]_])dopa([^[:alnum:]_]|$)|ドパ' app docs README.md --exclude-dir=.git; then
  echo 'ERROR: old protected branding remains outside LICENSE' >&2
  exit 1
fi
for old in app/js/dopakichi.js docs/dopakichi.svg app/icon.svg; do
  if [[ -e "$old" ]]; then echo "ERROR: old protected asset path remains: $old" >&2; exit 1; fi
done
for new in app/js/mascot.js docs/mascot.svg app/kazunome-icon.svg app/kazunome-logo.svg; do
  [[ -e "$new" ]] || { echo "ERROR: missing replacement asset: $new" >&2; exit 1; }
done
echo 'branding audit: OK'
