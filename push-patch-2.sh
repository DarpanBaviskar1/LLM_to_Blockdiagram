#!/bin/bash
# Script to push the patch-2 branch to remote
# This branch was created as an empty orphan branch for file uploads

set -e

echo "Switching to patch-2 branch..."
git checkout patch-2

echo "Pushing patch-2 branch to remote..."
git push -u origin patch-2

echo "Success! The patch-2 branch is now available on GitHub."
echo "You can verify it at: https://github.com/DarpanBaviskar1/LLM_to_Blockdiagram/tree/patch-2"
