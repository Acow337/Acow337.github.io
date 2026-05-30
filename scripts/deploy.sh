#!/usr/bin/env bash
set -euo pipefail

branch="$(git rev-parse --abbrev-ref HEAD)"

if [[ "$branch" != "gh-pages" && "$branch" != "main" ]]; then
  echo "[warn] 当前分支是 $branch。建议在 gh-pages 或 main 分支部署。"
fi

msg="deploy: update site $(date '+%Y-%m-%d %H:%M:%S')"

git add -A

if git diff --cached --quiet; then
  echo "[info] 没有变更可提交。"
else
  git commit -m "$msg"
fi

echo "[info] pushing to origin/$branch ..."
git push origin "$branch"
echo "[done] 部署完成。"
