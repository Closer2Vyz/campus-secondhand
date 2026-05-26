#!/bin/bash
find /Users/closervyz/campus-secondhand/miniprogram/pages -name "*.wxml" -print0 | while IFS= read -r -d '' f; do
  sed -i '' 's|{{serverURL + item\.images\[0\]}}|{{item.images[0]}}|g' "$f"
  sed -i '' 's|{{serverURL + order\.itemImages\[0\]}}|{{order.itemImages[0]}}|g' "$f"
  sed -i '' 's|{{serverURL + editAvatar}}|{{editAvatar}}|g' "$f"
  sed -i '' 's|serverURL + item\.images\[0\]|item.images[0]|g' "$f"
  sed -i '' 's|serverURL + item\.firstImage|item.firstImage|g' "$f"
  echo "fixed: $f"
done
echo "done"
