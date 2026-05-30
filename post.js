(function () {
  var root = document.documentElement;
  var themeToggle = document.getElementById('theme-toggle');
  var themeIcon = themeToggle ? themeToggle.querySelector('.theme-icon') : null;
  var menuToggle = document.getElementById('menu-toggle');
  var nav = document.getElementById('site-nav');
  var postPage = document.getElementById('post-page');
  var themeStorageKey = 'ruka-theme';

  function escapeHtml(text) {
    return String(text || '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  function applyInlineMd(text) {
    return escapeHtml(text)
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\*([^*]+)\*/g, '<em>$1</em>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
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

  function renderMarkdown(mdText) {
    var lines = mdText.replace(/\r\n/g, '\n').split('\n');
    var html = [];
    var inCode = false;
    var codeLang = '';
    var inList = false;

    function closeList() {
      if (inList) {
        html.push('</ul>');
        inList = false;
      }
    }

    lines.forEach(function (line) {
      if (line.startsWith('```')) {
        if (!inCode) {
          closeList();
          inCode = true;
          codeLang = line.slice(3).trim();
          html.push('<pre><code' + (codeLang ? ' class="lang-' + escapeHtml(codeLang) + '"' : '') + '>');
        } else {
          inCode = false;
          html.push('</code></pre>');
        }
        return;
      }

      if (inCode) {
        html.push(escapeHtml(line) + '\n');
        return;
      }

      if (!line.trim()) {
        closeList();
        html.push('');
        return;
      }

      var heading = line.match(/^(#{1,6})\s+(.*)$/);
      if (heading) {
        closeList();
        var level = heading[1].length;
        html.push('<h' + level + '>' + applyInlineMd(heading[2]) + '</h' + level + '>');
        return;
      }

      var item = line.match(/^[-*]\s+(.*)$/);
      if (item) {
        if (!inList) {
          html.push('<ul>');
          inList = true;
        }
        html.push('<li>' + applyInlineMd(item[1]) + '</li>');
        return;
      }

      closeList();
      html.push('<p>' + applyInlineMd(line) + '</p>');
    });

    closeList();
    return html.join('\n');
  }

  function applyTheme(theme) {
    root.setAttribute('data-theme', theme);
    if (themeIcon) themeIcon.textContent = theme === 'dark' ? '🌙' : '☀️';
    if (themeToggle) themeToggle.setAttribute('aria-label', theme === 'dark' ? '切换到浅色模式' : '切换到深色模式');
  }

  function getPreferredTheme() {
    var saved = localStorage.getItem(themeStorageKey);
    if (saved === 'light' || saved === 'dark') return saved;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  }

  function closeNav() {
    if (!nav || !menuToggle) return;
    nav.classList.remove('nav-open');
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.textContent = '☰';
    menuToggle.setAttribute('aria-label', '打开导航');
  }

  function normalizeTags(tagStr) {
    if (!tagStr) return [];
    return tagStr.split(',').map(function (t) { return t.trim(); }).filter(Boolean);
  }

  async function loadPost() {
    if (!postPage) return;
    var params = new URLSearchParams(window.location.search);
    var file = params.get('file');

    if (!file) {
      postPage.innerHTML = '<p class="post-loading">未指定文章路径，请从首页文章列表进入。</p>';
      return;
    }

    try {
      var res = await fetch(file, { cache: 'no-cache' });
      if (!res.ok) throw new Error('load failed');
      var text = await res.text();
      var parsed = parseFrontMatter(text);
      var tags = normalizeTags(parsed.meta.tags).map(function (tag) {
        return '<span>#' + escapeHtml(tag) + '</span>';
      }).join('');

      var bodyHtml = renderMarkdown(parsed.content || '');
      document.title = (parsed.meta.title || '文章') + ' · ruka';

      postPage.innerHTML = [
        '<header class="post-header">',
        '  <h1>' + escapeHtml(parsed.meta.title || '未命名文章') + '</h1>',
        '  <p class="meta">' + escapeHtml(parsed.meta.date || '未知日期') + (parsed.meta.readingTime ? ' · ' + escapeHtml(parsed.meta.readingTime) : '') + '</p>',
        (parsed.meta.summary ? '  <p class="post-summary">' + escapeHtml(parsed.meta.summary) + '</p>' : ''),
        (tags ? '  <div class="tags">' + tags + '</div>' : ''),
        '</header>',
        '<section class="post-content">' + bodyHtml + '</section>'
      ].join('\n');
    } catch (e) {
      postPage.innerHTML = '<p class="post-loading">文章加载失败，请检查链接或文件是否存在。</p>';
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
      menuToggle.setAttribute('aria-label', isOpen ? '关闭导航' : '打开导航');
    });

    nav.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        closeNav();
      });
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
