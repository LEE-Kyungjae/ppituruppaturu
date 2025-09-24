#!/usr/bin/env bash
set -euo pipefail

# Synchronises or validates the initdb migration folder used by Docker.
# Without this step the postgres container would execute *.down.sql files
# and fail during initialization. Default mode copies only *.up.sql files;
# "--check" validates that the committed initdb folder is already in sync.

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SOURCE_DIR="$ROOT_DIR/pp-backend/internal/migrations"
TARGET_DIR="$SOURCE_DIR/initdb"

MODE="sync"
if [[ "${1:-}" == "--check" ]]; then
  MODE="check"
fi

SRC_FILES=()
while IFS= read -r file; do
  SRC_FILES+=("$file")
done < <(find "$SOURCE_DIR" -maxdepth 1 -type f -name '*_*.up.sql' ! -path "$TARGET_DIR/*" | sort)

if [[ ! -d "$TARGET_DIR" ]]; then
  mkdir -p "$TARGET_DIR"
fi

DST_FILES=()
while IFS= read -r file; do
  DST_FILES+=("$file")
done < <(find "$TARGET_DIR" -maxdepth 1 -type f -name '*_*.up.sql' 2>/dev/null | sort)

if [[ "$MODE" == "sync" ]]; then
  # Remove stale files that no longer exist in the source migrations directory.
  for file in "${DST_FILES[@]}"; do
    base="$(basename "$file")"
    if [[ ! -f "$SOURCE_DIR/$base" ]]; then
      rm -f "$file"
    fi
  done

  # Copy new or updated *.up.sql files into the initdb folder.
  for file in "${SRC_FILES[@]}"; do
    dest="$TARGET_DIR/$(basename "$file")"
    if [[ ! -f "$dest" ]] || ! cmp -s "$file" "$dest"; then
      cp "$file" "$dest"
    fi
  done

  count=$(find "$TARGET_DIR" -maxdepth 1 -type f -name '*_*.up.sql' | wc -l | tr -d ' ')
  echo "Synced $count migration files into $TARGET_DIR"
  exit 0
fi

status=0

# Check that every source migration exists in initdb and matches byte-for-byte.
for file in "${SRC_FILES[@]}"; do
  base="$(basename "$file")"
  dest="$TARGET_DIR/$base"
  if [[ ! -f "$dest" ]]; then
    echo "::error::Missing initdb migration for $base" >&2
    status=1
    continue
  fi
  if ! cmp -s "$file" "$dest"; then
    echo "::error::initdb migration out of sync for $base" >&2
    status=1
  fi
done

# Detect stale files present only in the initdb folder.
for file in "${DST_FILES[@]}"; do
  base="$(basename "$file")"
  if [[ ! -f "$SOURCE_DIR/$base" ]]; then
    echo "::error::Stale initdb migration $base (remove or regenerate)" >&2
    status=1
  fi
done

if [[ $status -ne 0 ]]; then
  echo "::error::Run scripts/ensure-initdb.sh to sync initdb migrations" >&2
fi

exit $status
