#!/bin/bash
for d in /Users/closervyz/campus-secondhand/miniprogram/cloudfunctions/orders /Users/closervyz/campus-secondhand/miniprogram/cloudfunctions/user /Users/closervyz/campus-secondhand/miniprogram/cloudfunctions/upload /Users/closervyz/campus-secondhand/miniprogram/cloudfunctions/favorites /Users/closervyz/campus-secondhand/miniprogram/cloudfunctions/ratings /Users/closervyz/campus-secondhand/miniprogram/cloudfunctions/comments /Users/closervyz/campus-secondhand/miniprogram/cloudfunctions/announcements; do
  echo '{"name":"'$(basename $d)'","version":"1.0.0","dependencies":{"wx-server-sdk":"latest"}}' > "$d/package.json"
done
echo "done"
