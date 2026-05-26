#!/bin/bash
cd /Users/closervyz/campus-secondhand/miniprogram/pages
for dir in index item publish my-items my-orders order-detail profile seller; do
  if [ -f "$dir/index.js" ]; then
    sed -i '' 's|var CONFIG = require('\''../../utils/config'\'');|var CONFIG = require("../../utils/config");|g' "$dir/index.js"
    sed -i '' 's|serverURL: CONFIG.baseURL,|serverURL: "",|g' "$dir/index.js"
    echo "fixed: $dir/index.js"
  fi
done
# Fix item.js special cases
sed -i '' 's|CONFIG.baseURL +|"" +|g' item/item.js
sed -i '' "s|url: CONFIG.baseURL +|url: '' +|g" item/item.js
echo "done"
