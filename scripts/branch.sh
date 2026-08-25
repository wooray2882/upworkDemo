#!/usr/bin/env bash
set -e

if [ -z "$1" ]; then
  echo "Usage: ./scripts/branch.sh <type/branch-name>"
  echo "Example: ./scripts/branch.sh feat/frontend-ui"
  exit 1
fi

BRANCH_NAME="$1"
git checkout -b "$BRANCH_NAME"
echo "Successfully created and switched to branch: $BRANCH_NAME"
