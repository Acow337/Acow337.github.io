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

## 新文章发布前的内容优化标准（必做）

每次新增文章（`posts/*.md`）后，发布前都必须按以下两类步骤优化：

### 1) 公式优化（Markdown 可解析）

- 全文改成标准 KaTeX 友好的写法：
  - 行内公式：`$...$`
  - 块级公式：`$$...$$`
- 把核心估算关系统一成清晰公式（例如：`6NT`、`Time = 6NT/(GPη)`、内存拆分公式等）
- 避免把公式写在代码块里（代码块中的公式不会被 KaTeX 渲染）

### 2) 内容优化（可读性更强）

- 结构重构为：**问题 → 公式 → 解释 → 落地流程 → TL;DR**
- 增加章节层次与工程化结论
- 去掉冗余叙述，保留关键结论与可直接套用的步骤

### 3) 发布前检查清单

- [ ] 公式在 `post.html` 中能正确渲染
- [ ] 标题、摘要、日期、标签齐全（front matter 完整）
- [ ] 文章可直接给出“可执行的估算/实践步骤”
- [ ] 运行 `python3 scripts/generate_manifest.py`
- [ ] 本地预览无异常后再提交与发布


## 多语言发布约定（必做）

- 中文页面：`/`，英文页面：`/en/`
- 文章目录按语言拆分：`posts/<lang>/*.md`
- 发布前必须运行：

```bash
python3 scripts/generate_manifest.py
```

并确认 `posts/manifest.<lang>.json` 已更新。

新增语言流程（例如 `ja`）：
1. 增加 `ja/index.html`、`ja/blog.html`、`ja/post.html`
2. 增加 `posts/ja/*.md`
3. 运行 manifest 生成脚本
4. 本地预览并发布
