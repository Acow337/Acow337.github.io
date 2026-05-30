# AGENTS.md

## 博客更新流程（Acow337.github.io）

本仓库当前是简洁静态博客，首页“最新文章”由 `posts/*.md` + `posts/manifest.json` 驱动。

### 1) 写文章

1. 在 `posts/` 新建 Markdown 文件，例如：
   - `posts/2026-06-01-my-post.md`
2. 文件使用 front matter：

```md
---
title: 文章标题
date: 2026-06-01
readingTime: 5 min
summary: 一句话摘要
tags: TagA, TagB
---

# 正文标题

正文内容...
```

### 2) 自动生成文章清单

运行：

```bash
python3 scripts/generate_manifest.py
```

脚本会自动扫描 `posts/*.md`，按 `date` 倒序生成 `posts/manifest.json`。

> 注意：front matter 里建议填写标准日期（如 `2026-06-01`），否则会被排到最后。

首页点击文章后会跳转到 `post.html?file=...`，在网页内渲染 Markdown 正文。

### 3) 本地预览

```bash
python3 -m http.server 8080
```

打开 `http://localhost:8080` 检查：
- 首页文章是否正常加载
- 深色模式是否可切换
- 移动端菜单是否正常

### 4) 提交并推送（SSH）

仓库已配置 SSH 远端：
- `origin = git@github.com:Acow337/Acow337.github.io.git`

发布命令：

```bash
git add -A
git commit -m "update: add new post"
git push origin gh-pages
```

### 5) 线上检查

访问：
- `https://acow337.github.io/`

若未立即生效，等待 1~5 分钟后刷新（可强刷）。

---

## 常见问题

### Q1: 首页提示“文章加载失败”
- 先运行 `python3 scripts/generate_manifest.py`
- 检查 `posts/manifest.json` 是否是合法 JSON
- 检查路径与文件名是否一致（含大小写）

### Q2: push 失败（鉴权问题）
- 确认远端是 SSH：`git remote -v`
- 如需改回 SSH：

```bash
git remote set-url origin git@github.com:Acow337/Acow337.github.io.git
```

### Q3: GitHub Pages 还是旧页面
- 仓库 Settings → Pages 检查 Source
- 如使用分支部署，确保是 `gh-pages / root`
- 如使用 Actions，检查 workflow 是否成功


## 文章页能力

- 全页面阅读布局（更宽阅读区）
- 公式渲染（KaTeX，支持 `$...$` 与 `$$...$$`）
- 代码块高亮 + 语言标签 + 一键复制


- “查看全部”会跳转到 `blog.html`，展示完整文章列表并支持分页。

### Q4: GitHub Actions 部署报错 `Missing environment`
- 现象：Actions 里 `Deploy to GitHub Pages` 失败，提示：`HttpError: Missing environment`
- 原因：`.github/workflows/deploy-pages.yml` 的 `deploy` job 没有配置 `environment: github-pages`
- 解决：在 `jobs.deploy` 下添加：

```yaml
environment:
  name: github-pages
  url: ${{ steps.deployment.outputs.page_url }}
```

- 修复后可用 badge 快速确认：
  - `https://github.com/Acow337/Acow337.github.io/actions/workflows/deploy-pages.yml/badge.svg`
  - 标题应为 `Deploy Pages - passing`
