(function () {
  var listEl = document.getElementById('article-list');
  var featuredEl = document.getElementById('featured-list');
  var searchInputEl = document.getElementById('search-input');
  var hotListEl = document.getElementById('hot-list');
  var hotTabsEl = document.querySelector('.hot-tabs');
  if (!listEl) return;

  var FEATURED_MAX = 10;
  var LIST_PAGE_SIZE = 15;
  var nextCursor = '';
  var isLoadingMore = false;
  var listUrl = '';

  function getParams() {
    var params = new URLSearchParams(location.search);
    var q = (params.get('q') || '').trim().toLowerCase();
    return { q: q };
  }

  function buildListUrl(opts) {
    var cur = new URLSearchParams(location.search);
    if (opts.q !== undefined) cur.set('q', opts.q);
    var s = cur.toString();
    return s ? 'index.html?' + s : 'index.html';
  }

  function filterArticles(list, q) {
    if (!q) return list;
    return list.filter(function (a) {
      return (
        (a.title && a.title.toLowerCase().indexOf(q) !== -1) ||
        (a.summary && a.summary.toLowerCase().indexOf(q) !== -1) ||
        (a.author && a.author.name && a.author.name.toLowerCase().indexOf(q) !== -1)
      );
    });
  }

  function escapeHtml(s) {
    var div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }

  /** 图片 URL 或 emoji：http(s) 用 img，否则按文本展示。cls 可选，如 'user-avatar-img' */
  function mediaHtml(val, defaultVal, cls) {
    var v = (val != null && String(val).trim()) ? String(val).trim() : (defaultVal || '');
    if (!v) return '';
    if (/^https?:\/\//i.test(v)) {
      var src = (v + '').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      var c = (cls != null && String(cls).trim()) ? ' class="' + String(cls).replace(/"/g, '&quot;') + '"' : '';
      return '<img' + c + ' src="' + src + '" alt="" referrerpolicy="no-referrer" loading="lazy" />';
    }
    return escapeHtml(v);
  }

  /** 列表无文章时的占位（与卡片区视觉统一） */
  function articleEmptyStateHtml(q) {
    var hint = q
      ? '没有找到与当前搜索相关的文章，换个关键词试试'
      : '这里还没有文章，稍后再来看看吧';
    return (
      '<div class="article-empty-state" role="status">' +
      '<div class="article-empty-icon" aria-hidden="true">📄</div>' +
      '<p class="article-empty-title">暂无内容</p>' +
      '<p class="article-empty-hint">' + escapeHtml(hint) + '</p>' +
      '</div>'
    );
  }

  function articleErrorStateHtml() {
    return (
      '<div class="article-empty-state article-empty-state--error" role="alert">' +
      '<div class="article-empty-icon" aria-hidden="true">⚠️</div>' +
      '<p class="article-empty-title">加载失败</p>' +
      '<p class="article-empty-hint">请检查网络后刷新页面重试</p>' +
      '</div>'
    );
  }

  function cardHtml(a, listUrl) {
    var articleUrl = 'article.html?id=' + a.id + (listUrl !== 'index.html' ? '&from=' + encodeURIComponent(listUrl) : '');
    var coverHtml = mediaHtml(a.cover, '📝', 'card-cover-img') || '📝';
    var authorAvatar = (a.author && a.author.avatar) ? mediaHtml(a.author.avatar, '', 'user-avatar-img') : '';
    var authorName = escapeHtml((a.author && a.author.name) || '');
    return (
      '<article class="card" data-id="' + a.id + '">' +
      '<div class="card-cover">' + coverHtml + '</div>' +
      '<div class="card-body">' +
      '<h2 class="card-title"><a href="' + escapeHtml(articleUrl) + '">' + escapeHtml(a.title) + '</a></h2>' +
      '<p class="card-summary">' + escapeHtml(a.summary || '') + '</p>' +
      '<div class="card-meta">' +
      '<span class="author">' + (authorAvatar ? authorAvatar + ' ' : '') + authorName + '</span> ' +
      '<time datetime="' + escapeHtml(a.publishedAt || '') + '">' + (a.publishedAt || '') + '</time>' +
      '</div>' +
      '</div>' +
      '</article>'
    );
  }

  function renderHotRanking(type) {
    if (!hotListEl || typeof getHotRanking !== 'function') return;
    var listUrl = buildListUrl({});
    getHotRanking(type)
      .then(function (ranking) {
        if (!ranking || !ranking.length) {
          hotListEl.innerHTML = '<p class="hot-empty">暂无浏览数据</p>';
          return;
        }
        hotListEl.innerHTML = ranking.map(function (item, index) {
          var rank = index + 1;
          var title = (item.title || '').trim() || '未知文章';
          var articleUrl = 'article.html?id=' + item.id + (listUrl !== 'index.html' ? '&from=' + encodeURIComponent(listUrl) : '');
          return '<div class="hot-item rank-' + rank + '"><span class="hot-item-rank">' + rank + '</span><a href="' + escapeHtml(articleUrl) + '" class="hot-item-link" title="' + escapeHtml(title) + '">' + escapeHtml(title) + '</a><span class="hot-item-views">' + item.views + ' 次</span></div>';
        }).join('');
      })
      .catch(function () { hotListEl.innerHTML = '<p class="hot-empty">暂无浏览数据</p>'; });
  }

  function appendListItems(items) {
    if (!items.length) return;
    var before = listEl.querySelectorAll('.card').length;
    var html = items.map(function (a) { return cardHtml(a, listUrl); }).join('');
    listEl.insertAdjacentHTML('beforeend', html);
    var cards = listEl.querySelectorAll('.card');
    for (var i = before; i < cards.length; i++) {
      var link = cards[i].querySelector('.card-title a');
      if (link) {
        link.addEventListener('click', function (e) {
          e.preventDefault();
          location.href = this.getAttribute('href');
        });
      }
    }
    ensureSentinel();
  }

  function loadNextPage() {
    var q = getParams().q;
    if (isLoadingMore || !nextCursor) return;
    if (typeof getArticleListPage !== 'function') return;
    isLoadingMore = true;
    setSentinelLoading(true);
    getArticleListPage(q, nextCursor, LIST_PAGE_SIZE)
      .then(function (res) {
        nextCursor = res.nextCursor || '';
        var toAppend = res.articles || [];
        if (toAppend.length) appendListItems(toAppend);
        ensureSentinel();
      })
      .catch(function () {
        nextCursor = '';
        ensureSentinel();
      })
      .then(function () {
        isLoadingMore = false;
        setSentinelLoading(false);
      });
  }

  function render() {
    var q = getParams().q;
    listUrl = buildListUrl({});
    nextCursor = '';
    isLoadingMore = false;
    var featuredPromise = (typeof getFeaturedArticles === 'function') ? getFeaturedArticles() : Promise.resolve([]);
    var firstPagePromise = (typeof getArticleListPage === 'function') ? getArticleListPage(q, '', LIST_PAGE_SIZE) : Promise.resolve({ articles: [], nextCursor: '' });
    Promise.all([featuredPromise, firstPagePromise])
      .then(function (arr) {
        var featured = arr[0] || [];
        var firstRes = arr[1] || {};
        var firstPage = firstRes.articles || [];
        var featIds = {};
        featured.forEach(function (a) { featIds[a.id] = true; });
        var toShow = firstPage.filter(function (a) { return !featIds[a.id]; });
        nextCursor = firstRes.nextCursor || '';
        return { featured: featured, firstPage: toShow };
      })
      .then(function (o) {
        applyRender(o.featured, o.firstPage);
        if (hotListEl && typeof renderHotRanking === 'function') renderHotRanking('total');
      })
      .catch(function () {
        listEl.innerHTML = articleErrorStateHtml();
      });
  }

  function applyRender(featured, firstPage) {
    if (featuredEl) {
      if (featured.length === 0) {
        featuredEl.innerHTML = '';
        featuredEl.closest('.featured-section').style.display = 'none';
      } else {
        featuredEl.closest('.featured-section').style.display = '';
        featuredEl.innerHTML = featured.map(function (a) {
          return '<div class="featured-card" role="listitem">' + cardHtml(a, listUrl) + '</div>';
        }).join('');
      }
    }

    listEl.innerHTML = '';
    if (firstPage.length === 0) {
      listEl.innerHTML = articleEmptyStateHtml(getParams().q);
    } else {
      appendListItems(firstPage);
    }
    ensureSentinel();

    listEl.querySelectorAll('.card .card-title a').forEach(function (link) {
      link.addEventListener('click', function (e) { e.preventDefault(); location.href = this.getAttribute('href'); });
    });
    if (featuredEl) {
      featuredEl.querySelectorAll('.card .card-title a').forEach(function (link) {
        link.addEventListener('click', function (e) { e.preventDefault(); location.href = this.getAttribute('href'); });
      });
    }
  }

  function setSentinelLoading(loading) {
    var wrap = document.getElementById('list-load-sentinel-wrap');
    if (!wrap) return;
    var spinner = wrap.querySelector('.list-load-spinner');
    var text = wrap.querySelector('.list-load-text');
    if (spinner) spinner.style.display = loading ? 'inline-block' : 'none';
    if (text) text.textContent = loading ? '加载中…' : '';
  }

  function onScroll() {
    var sentinel = document.getElementById('list-load-sentinel');
    if (!sentinel || isLoadingMore) return;
    if (!nextCursor) return;
    var rect = sentinel.getBoundingClientRect();
    if (rect.top <= (window.innerHeight || document.documentElement.clientHeight) + 200) {
      loadNextPage();
    }
  }

  function ensureSentinel() {
    var existing = document.getElementById('list-load-sentinel-wrap');
    if (existing && existing.parentNode) existing.parentNode.removeChild(existing);
    if (!listEl || !nextCursor) return;
    var wrap = document.createElement('div');
    wrap.id = 'list-load-sentinel-wrap';
    wrap.className = 'list-load-sentinel-wrap';
    wrap.setAttribute('aria-hidden', 'true');
    wrap.innerHTML = '<div id="list-load-sentinel" class="list-load-sentinel"></div><div class="list-load-spinner" style="display:none;"></div><div class="list-load-text"></div>';
    listEl.appendChild(wrap);
  }

  function syncControlsFromUrl() {
    var q = getParams().q;
    if (searchInputEl) searchInputEl.value = q;
  }

  function applySearch() {
    var q = searchInputEl ? searchInputEl.value.trim() : '';
    var url = buildListUrl({ q: q });
    history.replaceState(null, '', url);
    syncControlsFromUrl();
    render();
  }

  syncControlsFromUrl();
  render(); // render 内部会调用 renderHotRanking 并传入首屏 idToTitle，无需单独请求

  // 仅当从 bfcache 恢复时刷新热度榜（避免首屏加载时重复请求）
  window.addEventListener('pageshow', function (e) {
    if (!e.persisted) return;
    var activeTab = hotTabsEl && hotTabsEl.querySelector('.hot-tab.is-active');
    var type = activeTab ? (activeTab.getAttribute('data-hot') || 'total') : 'total';
    renderHotRanking(type);
  });

  if (hotTabsEl) {
    hotTabsEl.querySelectorAll('.hot-tab').forEach(function (tab) {
      tab.addEventListener('click', function () {
        var type = this.getAttribute('data-hot');
        if (!type) return;
        hotTabsEl.querySelectorAll('.hot-tab').forEach(function (t) {
          t.classList.remove('is-active');
          t.setAttribute('aria-selected', 'false');
        });
        this.classList.add('is-active');
        this.setAttribute('aria-selected', 'true');
        renderHotRanking(type);
      });
    });
  }

  var searchBtnEl = document.getElementById('search-btn');
  if (searchInputEl) {
    searchInputEl.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') applySearch();
    });
  }
  if (searchBtnEl) {
    searchBtnEl.addEventListener('click', applySearch);
  }

  var backToTop = document.createElement('button');
  backToTop.type = 'button';
  backToTop.className = 'back-to-top';
  backToTop.setAttribute('aria-label', '回到顶部');
  backToTop.innerHTML = '↑';
  backToTop.addEventListener('click', function () {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
  document.body.appendChild(backToTop);

  function updateBackToTop() {
    var onePage = window.innerHeight || document.documentElement.clientHeight;
    if (window.scrollY > onePage) {
      backToTop.classList.add('is-visible');
    } else {
      backToTop.classList.remove('is-visible');
    }
  }

  window.addEventListener('scroll', function () {
    onScroll();
    updateBackToTop();
  }, { passive: true });
  updateBackToTop();
})();
