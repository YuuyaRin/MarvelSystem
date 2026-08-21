#!/usr/bin/env bash
# 一键部署到 GitHub Pages
# 用法: bash tools/deploy.sh [仓库名]   (默认 MarvelSystem)
set -euo pipefail
cd "$(dirname "$0")/.."

REPO="${1:-MarvelSystem}"
USER="$(gh api user -q .login)"

if ! git remote get-url origin >/dev/null 2>&1; then
  echo "▶ 创建公开仓库 $USER/$REPO 并推送…"
  gh repo create "$REPO" --public --source=. --remote=origin --push \
    --description "漫威宇宙观影指挥中心:从零补全 MCU 的资料站 + 任务式观影清单"
else
  echo "▶ 推送到已有远程 origin…"
  git push -u origin main
fi

echo "▶ 开启 GitHub Pages(main 分支根目录)…"
gh api -X POST "repos/$USER/$REPO/pages" -f "source[branch]=main" -f "source[path]=/" >/dev/null 2>&1 \
  || gh api -X PUT "repos/$USER/$REPO/pages" -f "source[branch]=main" -f "source[path]=/" >/dev/null 2>&1 \
  || true

URL="https://$(echo "$USER" | tr '[:upper:]' '[:lower:]').github.io/$REPO/"
echo ""
echo "✅ 完成!首次构建约需 1-2 分钟,之后访问:"
echo "   $URL"
echo "   (以后更新:git add -A && git commit -m '更新' && git push)"
