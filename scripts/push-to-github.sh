#!/usr/bin/env bash
# Push the current branch to the GitHub origin using GITHUB_PERSONAL_ACCESS_TOKEN.
# Usage: scripts/push-to-github.sh
set -euo pipefail

if [[ -z "${GITHUB_PERSONAL_ACCESS_TOKEN:-}" ]]; then
  echo "GITHUB_PERSONAL_ACCESS_TOKEN is not set in this environment." >&2
  exit 1
fi

REMOTE_URL="$(git remote get-url origin)"
# Strip any embedded creds and rebuild with the token.
CLEAN_URL="$(echo "$REMOTE_URL" | sed -E 's#https://[^@]+@#https://#')"
TOKENED_URL="$(echo "$CLEAN_URL" | sed -E "s#^https://#https://x-access-token:${GITHUB_PERSONAL_ACCESS_TOKEN}@#")"

BRANCH="$(git rev-parse --abbrev-ref HEAD)"
echo "Pushing $BRANCH → origin..."
git push "$TOKENED_URL" "HEAD:$BRANCH"
echo "Done."
