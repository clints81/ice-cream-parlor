#!/bin/bash
# Double-click this file on a Mac to start Ice Cream Parlor.
# It opens the game in your web browser at http://127.0.0.1:5174
# Keep this window open while playing. Close it when you're done.

cd "$(dirname "$0")" || exit 1
URL="http://127.0.0.1:5174"

# Already running? Just open the browser.
if curl -s -o /dev/null "$URL"; then
  open "$URL"
  exit 0
fi

if ! command -v npm >/dev/null 2>&1; then
  osascript -e 'display alert "Ice Cream Parlor needs Node.js" message "Install the LTS version from nodejs.org, then double-click this file again."'
  open "https://nodejs.org"
  exit 1
fi

if [ ! -d node_modules ]; then
  echo "First time setup: getting the game ready (this takes a minute)..."
  npm install || { echo "Setup failed. Is the internet connected?"; read -r; exit 1; }
fi

echo ""
echo "  Ice Cream Parlor is starting at $URL"
echo "  Keep this window open while you play."
echo ""
npm start
