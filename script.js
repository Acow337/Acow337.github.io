(function () {
  var root = document.documentElement;
  var themeToggle = document.getElementById('theme-toggle');
  var themeIcon = themeToggle ? themeToggle.querySelector('.theme-icon') : null;
  var menuToggle = document.getElementById('menu-toggle');
  var nav = document.getElementById('site-nav');
  var postListEl = document.getElementById('post-list');
  var themeStorageKey = 'ruka-theme';

  function escapeHtml(text) {
    return String(text || '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
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

  function renderPosts(posts) {
    if (!postListEl) return;

    if (!posts.length) {
      postListEl.innerHTML = '<p class="post-loading">暂无文章，请在 posts/ 目录添加 .md 文件。</p>';
      return;
    }

    postListEl.innerHTML = posts
      .map(function (post) {
        var title = escapeHtml(post.title || '未命名文章');
        var summary = escapeHtml(post.summary || '暂无摘要');
        var date = escapeHtml(post.date || '未知日期');
        var readingTime = escapeHtml(post.readingTime || '');
        var href = escapeHtml(post.href || '#');
        var tags = (post.tags || [])
          .map(function (tag) {
            return '<span>#' + escapeHtml(tag) + '</span>';
          })
          .join('');

        return [
          '<article class="post-card">',
          '  <p class="meta">' + date + (readingTime ? ' · ' + readingTime : '') + '</p>',
          '  <h3><a class="post-link" href="' + href + '" target="_blank" rel="noopener">' + title + '</a></h3>',
          '  <p>' + summary + '</p>',
          '  <div class="tags">' + tags + '</div>',
          '</article>'
        ].join('');
      })
      .join('');
  }

  function normalizeTags(tagStr) {
    if (!tagStr) return [];
    return tagStr
      .split(',')
      .map(function (tag) {
        return tag.trim();
      })
      .filter(Boolean);
  }

  function toSortableDate(dateText) {
    var time = Date.parse(dateText || '');
    return Number.isNaN(time) ? 0 : time;
  }

  async function loadPostsFromMarkdown() {
    if (!postListEl) return;

    try {
      var manifestRes = await fetch('posts/manifest.json', { cache: 'no-cache' });
      if (!manifestRes.ok) throw new Error('manifest load failed: ' + manifestRes.status);
      var mdFiles = await manifestRes.json();

      var posts = await Promise.all(
        mdFiles.map(async function (filePath) {
          var res = await fetch(filePath, { cache: 'no-cache' });
          if (!res.ok) throw new Error('post load failed: ' + filePath);
          var text = await res.text();
          var parsed = parseFrontMatter(text);

          return {
            title: parsed.meta.title,
            date: parsed.meta.date,
            readingTime: parsed.meta.readingTime,
            summary: parsed.meta.summary,
            tags: normalizeTags(parsed.meta.tags),
            href: 'post.html?file=' + encodeURIComponent(filePath)
          };
        })
      );

      posts.sort(function (a, b) {
        return toSortableDate(b.date) - toSortableDate(a.date);
      });

      renderPosts(posts);
    } catch (error) {
      postListEl.innerHTML = '<p class="post-loading">文章加载失败，请检查 posts/manifest.json 与 Markdown 文件路径。</p>';
      console.error(error);
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
      if (!clickedInsideMenu && !clickedToggle) {
        closeNav();
      }
    });

    window.addEventListener('resize', function () {
      if (window.innerWidth > 760) closeNav();
    });
  }

  loadPostsFromMarkdown();
})();
