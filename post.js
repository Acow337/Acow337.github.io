(function () {
  var root = document.documentElement;
  var themeToggle = document.getElementById('theme-toggle');
  var themeIcon = themeToggle ? themeToggle.querySelector('.theme-icon') : null;
  var menuToggle = document.getElementById('menu-toggle');
  var nav = document.getElementById('site-nav');
  var postPage = document.getElementById('post-page');
  var themeStorageKey = 'ruka-theme';

  function detectLang() {
    return window.location.pathname.startsWith('/en/') ? 'en' : 'zh';
  }

  var lang = detectLang();
  var isEn = lang === 'en';

  function escapeHtml(text) {
    return String(text || '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  function parseFrontMatter(mdText) {
    var match = mdText.match(/^---\n([\s\S]*?)\n---\n?/);
    if (!match) return { meta: {}, content: mdText };

    var meta = {};
    match[1].split('\n').forEach(function (line) {
      var idx = line.indexOf(':');
      if (idx === -1) return;
      var key = line.slice(0, idx).trim();
      var value = line.slice(idx + 1).trim();
      meta[key] = value;
    });

    return { meta: meta, content: mdText.slice(match[0].length) };
  }

  function applyTheme(theme) {
    root.setAttribute('data-theme', theme);
    if (themeIcon) themeIcon.textContent = theme === 'dark' ? '🌙' : '☀️';
    if (themeToggle) themeToggle.setAttribute('aria-label', theme === 'dark' ? (isEn ? 'Switch to light mode' : '切换到浅色模式') : (isEn ? 'Switch to dark mode' : '切换到深色模式'));
  }

  function getPreferredTheme() {
    var saved = localStorage.getItem(themeStorageKey);
    if (saved === 'light' || saved === 'dark') return saved;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  function closeNav() {
    if (!nav || !menuToggle) return;
    nav.classList.remove('nav-open');
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.textContent = '☰';
    menuToggle.setAttribute('aria-label', isEn ? 'Open menu' : '打开导航');
  }

  function normalizeTags(tagStr) {
    if (!tagStr) return [];
    return tagStr.split(',').map(function (t) { return t.trim(); }).filter(Boolean);
  }

  function fallbackMarkdownToHtml(markdown) {
    var lines = (markdown || '').replace(/\r\n/g, '\n').split('\n');
    var out = [];
    var inCode = false;
    var codeLang = '';
    var inUl = false;
    var inOl = false;

    function closeLists() {
      if (inUl) { out.push('</ul>'); inUl = false; }
      if (inOl) { out.push('</ol>'); inOl = false; }
    }

    lines.forEach(function (line) {
      if (line.startsWith('```')) {
        closeLists();
        if (!inCode) {
          inCode = true;
          codeLang = line.slice(3).trim();
          out.push('<pre><code class="language-' + escapeHtml(codeLang || 'text') + '">');
        } else {
          inCode = false;
          out.push('</code></pre>');
        }
        return;
      }

      if (inCode) {
        out.push(escapeHtml(line) + '\n');
        return;
      }

      if (!line.trim()) {
        closeLists();
        out.push('');
        return;
      }

      var h = line.match(/^(#{1,6})\s+(.*)$/);
      if (h) {
        closeLists();
        var lv = h[1].length;
        out.push('<h' + lv + '>' + escapeHtml(h[2]) + '</h' + lv + '>');
        return;
      }

      var ol = line.match(/^\d+\.\s+(.*)$/);
      if (ol) {
        if (!inOl) { closeLists(); inOl = true; out.push('<ol>'); }
        out.push('<li>' + escapeHtml(ol[1]) + '</li>');
        return;
      }

      var ul = line.match(/^[-*]\s+(.*)$/);
      if (ul) {
        if (!inUl) { closeLists(); inUl = true; out.push('<ul>'); }
        out.push('<li>' + escapeHtml(ul[1]) + '</li>');
        return;
      }

      closeLists();
      out.push('<p>' + escapeHtml(line) + '</p>');
    });

    closeLists();
    return out.join('\n');
  }

  function renderMarkdownToHtml(markdown) {
    if (window.marked) {
      window.marked.setOptions({ gfm: true, breaks: false, mangle: false, headerIds: false });
      return window.marked.parse(markdown || '');
    }
    return fallbackMarkdownToHtml(markdown);
  }

  function extractDisplayMathBlocks(markdown) {
    var text = String(markdown || '');
    var blocks = [];
    var out = '';
    var i = 0;

    while (i < text.length) {
      var start = text.indexOf('$$', i);
      if (start === -1) {
        out += text.slice(i);
        break;
      }

      out += text.slice(i, start);
      var end = text.indexOf('$$', start + 2);
      if (end === -1) {
        out += text.slice(start);
        break;
      }

      var expr = text.slice(start + 2, end);
      var token = 'KATEX_BLOCK_TOKEN_' + blocks.length;
      blocks.push({ token: token, expr: expr });
      out += '\n\n' + token + '\n\n';
      i = end + 2;
    }

    return { markdown: out, blocks: blocks };
  }

  function renderDisplayMathTokens(html, blocks) {
    var rendered = String(html || '');
    (blocks || []).forEach(function (item) {
      var expr = normalizeLatexForRendering(item.expr || '').trim();
      var katexHtml = '';
      if (window.katex) {
        try {
          katexHtml = '<div class="math-block-fallback">' + window.katex.renderToString(expr, {
            displayMode: true,
            throwOnError: false
          }) + '</div>';
        } catch (_) {
          katexHtml = '<div class="math-block-fallback">$$' + escapeHtml(item.expr || '') + '$$</div>';
        }
      } else {
        katexHtml = '<div class="math-block-fallback">$$' + escapeHtml(item.expr || '') + '$$</div>';
      }

      rendered = rendered
        .replaceAll('<p>' + item.token + '</p>', katexHtml)
        .replaceAll(item.token, katexHtml);
    });
    return rendered;
  }

  function normalizeLatexForRendering(text) {
    var normalized = text || '';
    // Common malformed delimiters that break KaTeX parsing.
    normalized = normalized
      .replace(/\\left\s*\{/g, '\\left\\{')
      .replace(/\\right\s*\}/g, '\\right\\}');

    // Normalize patterns like \mathcal{B}{t+1} to \mathcal{B}_{t+1}.
    normalized = normalized.replace(/\\mathcal\{([A-Za-z])\}\{([^{}]+)\}/g, '\\mathcal{$1}_{$2}');

    return normalized;
  }

  function sanitizeHtml(html) {
    if (window.DOMPurify) return window.DOMPurify.sanitize(html);
    return html;
  }

  function enhanceCodeBlocks() {
    postPage.querySelectorAll('pre code').forEach(function (block) {
      if (window.hljs) window.hljs.highlightElement(block);

      var pre = block.parentElement;
      if (!pre || pre.classList.contains('enhanced')) return;
      pre.classList.add('enhanced');

      var className = block.className || '';
      var langMatch = className.match(/language-([\w-]+)/i) || className.match(/lang-([\w-]+)/i);
      var langName = langMatch ? langMatch[1] : 'text';

      var toolbar = document.createElement('div');
      toolbar.className = 'code-toolbar';
      toolbar.innerHTML = '<span class="code-lang">' + escapeHtml(langName) + '</span><button class="copy-btn" type="button">' + (isEn ? 'Copy' : '复制') + '</button>';
      pre.parentNode.insertBefore(toolbar, pre);

      var copyBtn = toolbar.querySelector('.copy-btn');
      copyBtn.addEventListener('click', async function () {
        try {
          await navigator.clipboard.writeText(block.innerText);
          copyBtn.textContent = isEn ? 'Copied' : '已复制';
          setTimeout(function () { copyBtn.textContent = isEn ? 'Copy' : '复制'; }, 1200);
        } catch (_) {
          copyBtn.textContent = isEn ? 'Failed' : '复制失败';
          setTimeout(function () { copyBtn.textContent = isEn ? 'Copy' : '复制'; }, 1200);
        }
      });
    });
  }

  function renderMath() {
    function normalizeMathExpr(expr) {
      return String(expr || '')
        .replace(/\\left\s*\{/g, '\\left\\{')
        .replace(/\\right\s*\}/g, '\\right\\}')
        .replace(/\\mathcal\{([A-Za-z])\}\{([^{}]+)\}/g, '\\mathcal{$1}_{$2}');
    }

    function renderRemainingDisplayMath() {
      if (!window.katex) return;

      var walker = document.createTreeWalker(postPage, NodeFilter.SHOW_TEXT, {
        acceptNode: function (node) {
          if (!node.nodeValue || node.nodeValue.indexOf('$$') === -1) return NodeFilter.FILTER_REJECT;
          var parent = node.parentElement;
          if (!parent) return NodeFilter.FILTER_REJECT;
          var tag = parent.tagName && parent.tagName.toLowerCase();
          if (['script', 'noscript', 'style', 'textarea', 'pre', 'code'].includes(tag)) return NodeFilter.FILTER_REJECT;
          return NodeFilter.FILTER_ACCEPT;
        }
      });

      var nodes = [];
      while (walker.nextNode()) nodes.push(walker.currentNode);

      nodes.forEach(function (node) {
        var text = node.nodeValue;
        if (!text || text.indexOf('$$') === -1) return;

        var pattern = /\$\$([\s\S]+?)\$\$/g;
        var last = 0;
        var found = false;
        var frag = document.createDocumentFragment();
        var match;

        while ((match = pattern.exec(text)) !== null) {
          found = true;
          if (match.index > last) {
            frag.appendChild(document.createTextNode(text.slice(last, match.index)));
          }

          var holder = document.createElement('div');
          holder.className = 'math-block-fallback';
          var expr = normalizeMathExpr(match[1]).trim();
          try {
            holder.innerHTML = window.katex.renderToString(expr, {
              displayMode: true,
              throwOnError: false
            });
          } catch (_) {
            holder.textContent = '$$' + match[1] + '$$';
          }
          frag.appendChild(holder);
          last = pattern.lastIndex;
        }

        if (!found) return;
        if (last < text.length) frag.appendChild(document.createTextNode(text.slice(last)));
        node.parentNode.replaceChild(frag, node);
      });
    }

    if (window.renderMathInElement) {
      window.renderMathInElement(postPage, {
        delimiters: [
          { left: '$$', right: '$$', display: true },
          { left: '$', right: '$', display: false },
          { left: '\\(', right: '\\)', display: false },
          { left: '\\[', right: '\\]', display: true }
        ],
        ignoredTags: ['script', 'noscript', 'style', 'textarea', 'pre', 'code'],
        throwOnError: false
      });
      renderRemainingDisplayMath();
      return;
    }

    // Fallback when KaTeX auto-render is unavailable but katex core exists.
    if (!window.katex) return;

    function isEscaped(text, idx) {
      var slashCount = 0;
      for (var i = idx - 1; i >= 0 && text[i] === '\\'; i--) slashCount++;
      return slashCount % 2 === 1;
    }

    function splitMath(text) {
      var parts = [];
      var i = 0;
      while (i < text.length) {
        var displayStart = text.indexOf('$$', i);
        var inlineStart = text.indexOf('$', i);
        var start = -1;
        var isDisplay = false;

        if (displayStart !== -1 && !isEscaped(text, displayStart)) {
          start = displayStart;
          isDisplay = true;
        }
        if (inlineStart !== -1 && !isEscaped(text, inlineStart)) {
          if (start === -1 || inlineStart < start) {
            start = inlineStart;
            isDisplay = false;
          }
        }

        if (start === -1) {
          parts.push({ type: 'text', value: text.slice(i) });
          break;
        }

        if (start > i) parts.push({ type: 'text', value: text.slice(i, start) });

        var leftLen = isDisplay ? 2 : 1;
        var end = -1;
        var cursor = start + leftLen;
        var right = isDisplay ? '$$' : '$';
        while (cursor < text.length) {
          var pos = text.indexOf(right, cursor);
          if (pos === -1) break;
          if (!isEscaped(text, pos)) {
            end = pos;
            break;
          }
          cursor = pos + right.length;
        }

        if (end === -1) {
          parts.push({ type: 'text', value: text.slice(start) });
          break;
        }

        parts.push({ type: 'math', value: text.slice(start + leftLen, end), display: isDisplay });
        i = end + right.length;
      }

      return parts;
    }

    var walker = document.createTreeWalker(postPage, NodeFilter.SHOW_TEXT, {
      acceptNode: function (node) {
        if (!node.nodeValue || node.nodeValue.indexOf('$') === -1) return NodeFilter.FILTER_REJECT;
        var parent = node.parentElement;
        if (!parent) return NodeFilter.FILTER_REJECT;
        var tag = parent.tagName && parent.tagName.toLowerCase();
        if (['script', 'noscript', 'style', 'textarea', 'pre', 'code'].includes(tag)) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });

    var nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);

    nodes.forEach(function (node) {
      var parts = splitMath(node.nodeValue);
      if (!parts.some(function (p) { return p.type === 'math'; })) return;

      var frag = document.createDocumentFragment();
      parts.forEach(function (part) {
        if (part.type === 'text') {
          frag.appendChild(document.createTextNode(part.value));
          return;
        }

        var holder = document.createElement(part.display ? 'div' : 'span');
        if (part.display) holder.className = 'math-block-fallback';
        try {
          holder.innerHTML = window.katex.renderToString(part.value, {
            displayMode: !!part.display,
            throwOnError: false
          });
        } catch (_) {
          holder.textContent = (part.display ? '$$' : '$') + part.value + (part.display ? '$$' : '$');
        }
        frag.appendChild(holder);
      });

      node.parentNode.replaceChild(frag, node);
    });

    renderRemainingDisplayMath();
  }

  function showDependencyNote() {
    var missing = [];
    if (!window.marked) missing.push('marked');
    if (!window.DOMPurify) missing.push('DOMPurify');
    if (!window.hljs) missing.push('highlight.js');
    if (!window.renderMathInElement) missing.push('KaTeX auto-render');

    if (!missing.length || !postPage) return;

    var note = document.createElement('div');
    note.className = 'render-note';
    note.textContent = isEn
      ? 'Note: Some rendering dependencies are not loaded (' + missing.join(', ') + '). Fallback rendering is enabled.'
      : '提示：部分渲染依赖未加载（' + missing.join(', ') + '），已启用兼容渲染。';
    postPage.prepend(note);
  }

  async function loadPost() {
    if (!postPage) return;
    var params = new URLSearchParams(window.location.search);
    var file = params.get('file');

    if (!file) {
      postPage.innerHTML = '<p class="post-loading">' + (isEn ? 'No post file provided. Please open from blog list.' : '未指定文章路径，请从首页文章列表进入。') + '</p>';
      return;
    }

    try {
      var fileUrl = file + (file.indexOf('?') >= 0 ? '&' : '?') + 'v=20260531c';
      var res = await fetch(fileUrl, { cache: 'reload' });
      if (!res.ok) throw new Error('load failed');
      var text = await res.text();
      var parsed = parseFrontMatter(text);
      var tags = normalizeTags(parsed.meta.tags).map(function (tag) {
        return '<span>#' + escapeHtml(tag) + '</span>';
      }).join('');

      var normalizedMarkdown = normalizeLatexForRendering(parsed.content || '');
      var extracted = extractDisplayMathBlocks(normalizedMarkdown);
      var rawHtml = renderMarkdownToHtml(extracted.markdown);
      var safeHtml = sanitizeHtml(rawHtml);
      var finalHtml = renderDisplayMathTokens(safeHtml, extracted.blocks);
      document.title = (parsed.meta.title || (isEn ? 'Post' : '文章')) + ' · ruka';

      postPage.innerHTML = [
        '<header class="post-header">',
        '  <h1>' + escapeHtml(parsed.meta.title || (isEn ? 'Untitled Post' : '未命名文章')) + '</h1>',
        '  <p class="meta">' + escapeHtml(parsed.meta.date || (isEn ? 'Unknown date' : '未知日期')) + (parsed.meta.readingTime ? ' · ' + escapeHtml(parsed.meta.readingTime) : '') + '</p>',
        parsed.meta.summary ? '  <p class="post-summary">' + escapeHtml(parsed.meta.summary) + '</p>' : '',
        tags ? '  <div class="tags">' + tags + '</div>' : '',
        '</header>',
        '<section class="post-content">' + finalHtml + '</section>'
      ].join('\n');

      var firstBodyH1 = postPage.querySelector('.post-content h1');
      if (firstBodyH1) firstBodyH1.remove();

      showDependencyNote();
      enhanceCodeBlocks();
      renderMath();
    } catch (e) {
      postPage.innerHTML = '<p class="post-loading">' + (isEn ? 'Failed to load post. Check file path and availability.' : '文章加载失败，请检查链接或文件是否存在。') + '</p>';
      console.error(e);
    }
  }

  var currentTheme = getPreferredTheme();
  applyTheme(currentTheme);

  if (themeToggle) {
    themeToggle.addEventListener('click', function () {
      currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
      localStorage.setItem(themeStorageKey, currentTheme);
      applyTheme(currentTheme);
    });
  }

  if (menuToggle && nav) {
    menuToggle.addEventListener('click', function () {
      var isOpen = nav.classList.toggle('nav-open');
      menuToggle.setAttribute('aria-expanded', String(isOpen));
      menuToggle.textContent = isOpen ? '✕' : '☰';
      menuToggle.setAttribute('aria-label', isOpen ? (isEn ? 'Close menu' : '关闭导航') : (isEn ? 'Open menu' : '打开导航'));
    });

    nav.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () { closeNav(); });
    });

    document.addEventListener('click', function (event) {
      var clickedInsideMenu = nav.contains(event.target);
      var clickedToggle = menuToggle.contains(event.target);
      if (!clickedInsideMenu && !clickedToggle) closeNav();
    });

    window.addEventListener('resize', function () {
      if (window.innerWidth > 760) closeNav();
    });
  }

  loadPost();
})();
