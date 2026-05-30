# ruka 个人博客

一个简洁风的静态个人博客首页（可直接部署到 GitHub Pages）。

## 本地预览

在项目根目录运行：

```bash
python3 -m http.server 8080
```

然后打开：

```text
http://localhost:8080
```

## 目录结构

```text
.
├── index.html               # 首页
├── style.css                # 样式（含深色模式与移动端导航）
├── script.js                # 主题切换 + 移动端菜单 + 从 Markdown 读取文章
├── rss.xml                  # RSS 订阅源
├── posts
│   ├── manifest.json        # Markdown 文件清单
│   └── *.md                 # 文章文件（带 front matter）
├── scripts
│   ├── deploy.sh            # 一键部署脚本（会先自动生成 manifest）
│   └── generate_manifest.py # 自动生成 posts/manifest.json
└── .github
    └── workflows
        └── deploy-pages.yml # GitHub Actions 自动部署
```

## 已接入真实链接

- GitHub: `https://github.com/Acow337`
- 邮箱: `mailto:yzjin2001@qq.com`
- RSS: `/rss.xml`

## 文章来源：Markdown 文件

首页“最新文章”会自动读取 `posts/manifest.json` 中列出的 `.md` 文件，并只展示最新 Top-3。

点击首页文章标题会进入 `post.html`，并在网页中渲染 Markdown 内容（不是直接打开原始 .md 文件）。

### Markdown 格式示例

```md
---
title: 文章标题
date: 2026-05-30
readingTime: 5 min
summary: 一句话摘要
tags: HarnessEngineering, Evaluation
---

# 正文标题

正文内容...
```

### 新增文章步骤

1. 在 `posts/` 新建一个 `.md` 文件
2. 按上面的 front matter 填写元数据
3. 运行自动生成脚本更新清单：

```bash
python3 scripts/generate_manifest.py
```

4. 提交并部署


### 自动生成 manifest

```bash
python3 scripts/generate_manifest.py
```

脚本会扫描 `posts/*.md`，按 front matter 的 `date` 倒序生成 `posts/manifest.json`。

## 深色模式

- 默认跟随系统主题
- 点击右上角按钮可手动切换
- 主题偏好保存在浏览器 `localStorage`

## 移动端导航优化

- 小屏幕显示汉堡按钮（☰）
- 点击展开/收起浮层菜单
- 点击空白区域或菜单项自动关闭

## 部署方式

### 方式 A：手动脚本部署到 `gh-pages`

```bash
bash scripts/deploy.sh
```

> 脚本会：检查分支 -> git add/commit -> push 到当前分支（建议 `gh-pages`）

### 方式 B：GitHub Actions 自动部署（推荐）

已提供 `.github/workflows/deploy-pages.yml`。

1. 推送代码到仓库
2. 在 GitHub 仓库设置中启用 Pages（Source 选 **GitHub Actions**）
3. 每次 push 到 `main` 或 `gh-pages` 时自动发布


## 文章页能力

- 全页面阅读布局（更宽阅读区）
- 公式渲染（KaTeX，支持 `$...$` 与 `$$...$$`）
- 代码块高亮 + 语言标签 + 一键复制


- “查看全部”会跳转到 `blog.html`，展示完整文章列表并支持分页。
