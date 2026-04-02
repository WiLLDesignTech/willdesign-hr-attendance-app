#!/bin/bash
# Sync all .md files from the project to Google Drive as .txt for Google Docs conversion
# Usage: ./sync-to-drive.sh [target-folder-name]
# Default target: willdesign-hr inside Google Drive Sync Files
#
# After syncing:
#   1. Go to Google Drive > willdesign-hr folder
#   2. Select all .txt files > Right-click > "Open with" > "Google Docs"
#   3. This creates Google Doc versions that NotebookLM can read
#   4. Add those Google Docs as sources in NotebookLM
#   5. On future syncs, the .txt files update and you re-open to refresh the Docs

DRIVE_BASE="/Users/subash/Documents/DOCS-SHARED/Google Drive Sync Files"
TARGET_NAME="${1:-willdesign-hr}"
TARGET_DIR="$DRIVE_BASE/$TARGET_NAME"
PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"

mkdir -p "$TARGET_DIR"

echo "Syncing .md files from: $PROJECT_DIR"
echo "To: $TARGET_DIR (as .txt for Google Docs conversion)"
echo ""

find "$PROJECT_DIR" -name "*.md" -not -path "*/node_modules/*" -not -path "*/.git/*" | sort | while read -r file; do
  relative="${file#$PROJECT_DIR/}"
  safe_name=$(echo "$relative" | sed 's/^\.//; s/^\.//' | tr '/' '_' | sed 's/\.md$/.txt/')
  cp "$file" "$TARGET_DIR/$safe_name"
  echo "  ✓ $relative → $safe_name"
done

echo ""
echo "Done. Files synced to: $TARGET_DIR"
echo ""
echo "Next steps:"
echo "  1. Open Google Drive > Computers > My Mac > Google Drive Sync Files > $TARGET_NAME"
echo "  2. Select all .txt files > Right-click > Open with > Google Docs"
echo "  3. Add the Google Docs as sources in NotebookLM"
