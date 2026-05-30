(function () {
  var root = document.documentElement;
  var themeToggle = document.getElementById('theme-toggle');
  var themeIcon = themeToggle ? themeToggle.querySelector('.theme-icon') : null;
  var menuToggle = document.getElementById('menu-toggle');
  var nav = document.getElementById('site-nav');
  var postListEl = document.getElementById('full-post-list');
  var paginationEl = document.getElementById('pagination');
  var themeStorageKey = 'ruka-theme';
  var pageSize = 6;

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
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
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
      meta[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
    });
    return { meta: meta, content: mdText.slice(match[0].length) };
  }

  function normalizeTags(tagStr) {
    if (!tagStr) return [];
    return tagStr.split(',').map(function (t) { return t.trim(); }).filter(Boolean);
  }

  function toSortableDate(dateText) {
    var time = Date.parse(dateText || '');
    return Number.isNaN(time) ? 0 : time;
  }

  function getPageFromQuery() {
    var params = new URLSearchParams(window.location.search);
    var page = Number(params.get('page') || 1);
    return Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
  }

  function updatePageInQuery(page) {
    var url = new URL(window.location.href);
    if (page <= 1) {
      url.searchParams.delete('page');
    } else {
      url.searchParams.set('page', String(page));
    }
    window.history.replaceState({}, '', url.toString());
  }

  function renderPosts(posts) {
    if (!postListEl) return;
    postListEl.innerHTML = posts.map(function (post) {
      var title = escapeHtml(post.title || '未命名文章');
      var summary = escapeHtml(post.summary || '暂无摘要');
      var date = escapeHtml(post.date || '未知日期');
      var readingTime = escapeHtml(post.readingTime || '');
      var href = escapeHtml(post.href || '#');
      var tags = (post.tags || []).map(function (tag) { return '<span>#' + escapeHtml(tag) + '</span>'; }).join('');
      return [
        '<article class="post-card">',
        '  <p class="meta">' + date + (readingTime ? ' · ' + readingTime : '') + '</p>',
        '  <h3><a class="post-link" href="' + href + '">' + title + '</a></h3>',
        '  <p>' + summary + '</p>',
        '  <div class="tags">' + tags + '</div>',
        '</article>'
      ].join('');
    }).join('');
  }

  function renderPagination(totalPages, currentPage, onPageChange) {
    if (!paginationEl) return;
    if (totalPages <= 1) {
      paginationEl.innerHTML = '';
      return;
    }

    var parts = [];
    parts.push('<button class="page-btn" ' + (currentPage === 1 ? 'disabled' : '') + ' data-page="' + (currentPage - 1) + '">上一页</button>');

    for (var p = 1; p <= totalPages; p++) {
      parts.push('<button class="page-btn ' + (p === currentPage ? 'active' : '') + '" data-page="' + p + '">' + p + '</button>');
    }

    parts.push('<button class="page-btn" ' + (currentPage === totalPages ? 'disabled' : '') + ' data-page="' + (currentPage + 1) + '">下一页</button>');

    paginationEl.innerHTML = parts.join('');

    paginationEl.querySelectorAll('button[data-page]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var next = Number(btn.getAttribute('data-page'));
        if (!Number.isFinite(next)) return;
        onPageChange(next);
      });
    });
  }

  async function loadAndRenderAllPosts() {
    if (!postListEl) return;
    try {
      var manifestRes = await fetch('posts/manifest.json', { cache: 'no-cache' });
      if (!manifestRes.ok) throw new Error('manifest load failed: ' + manifestRes.status);
      var mdFiles = await manifestRes.json();

      var allPosts = await Promise.all(mdFiles.map(async function (filePath) {
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
      }));

      allPosts.sort(function (a, b) { return toSortableDate(b.date) - toSortableDate(a.date); });

      function goToPage(page) {
        var totalPages = Math.max(1, Math.ceil(allPosts.length / pageSize));
        var safePage = Math.min(Math.max(page, 1), totalPages);
        var start = (safePage - 1) * pageSize;
        var pagePosts = allPosts.slice(start, start + pageSize);

        renderPosts(pagePosts);
        renderPagination(totalPages, safePage, goToPage);
        updatePageInQuery(safePage);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }

      goToPage(getPageFromQuery());
    } catch (error) {
      postListEl.innerHTML = '<p class="post-loading">文章加载失败，请检查 posts/manifest.json 与 Markdown 文件路径。</p>';
      if (paginationEl) paginationEl.innerHTML = '';
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

  loadAndRenderAllPosts();
})();
