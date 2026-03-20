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

  function cardEngagementCounts(a) {
    var lc = a.likeCount != null ? a.likeCount : a.like_count;
    var fc = a.favoriteCount != null ? a.favoriteCount : a.favorite_count;
    var like = Number(lc);
    var fav = Number(fc);
    return {
      like: isFinite(like) && like >= 0 ? like : 0,
      fav: isFinite(fav) && fav >= 0 ? fav : 0,
    };
  }

  function formatStatNum(n) {
    n = Number(n);
    if (!isFinite(n) || n < 0) return '0';
    if (n >= 10000) {
      var w = n / 10000;
      var s = w >= 10 ? String(Math.floor(w)) : String(Math.round(w * 10) / 10).replace(/\.0$/, '');
      return s + '万';
    }
    return String(n);
  }

  var svgCardLike =
    '<svg class="card-stat__icon" viewBox="0 0 24 24" width="14" height="14" aria-hidden="true" focusable="false" fill="none">' +
    '<path stroke="currentColor" stroke-width="1.55" stroke-linecap="round" stroke-linejoin="round" d="M6.633 10.25c.806 0 1.536-.438 2.038-1.133a9.093 9.093 0 0 1 2.236-2.48c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 0 0 .322-1.672V3a.75.75 0 0 1 .75-.75 2.25 2.25 0 0 1 2.25 2.25c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.851.068 1.285 0 3.255-2.33 5.954-5.47 6.154-2.893.19-5.534-1.457-6.634-4.154ZM5.25 10h-1A2.25 2.25 0 0 0 2 12.25v6.5A2.25 2.25 0 0 0 4.25 21h1A2.25 2.25 0 0 0 7.5 18.75v-6.5A2.25 2.25 0 0 0 5.25 10Z"/>' +
    '</svg>';
  var svgCardFav =
    '<svg class="card-stat__icon" viewBox="0 0 24 24" width="14" height="14" aria-hidden="true" focusable="false" fill="none">' +
    '<path stroke="currentColor" stroke-width="1.55" stroke-linecap="round" stroke-linejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z"/>' +
    '</svg>';

  function cardStatsHtml(a) {
    var eg = cardEngagementCounts(a);
    return (
      '<div class="card-stats" aria-label="点赞与收藏">' +
      '<span class="card-stat" title="点赞">' +
      svgCardLike +
      '<span class="card-stat__num">' +
      escapeHtml(formatStatNum(eg.like)) +
      '</span></span>' +
      '<span class="card-stat" title="收藏">' +
      svgCardFav +
      '<span class="card-stat__num">' +
      escapeHtml(formatStatNum(eg.fav)) +
      '</span></span>' +
      '</div>'
    );
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
    var authorRaw = (a.author && a.author.name) || '';
    var authorName = escapeHtml(authorRaw);
    return (
      '<article class="card" data-id="' + a.id + '">' +
      '<div class="card-cover">' + coverHtml + '</div>' +
      '<div class="card-body">' +
      '<h2 class="card-title"><a href="' +
      escapeHtml(articleUrl) +
      '" title="' +
      escapeHtml(a.title || '') +
      '">' +
      escapeHtml(a.title || '') +
      '</a></h2>' +
      '<p class="card-summary" title="' +
      escapeHtml(a.summary || '') +
      '">' +
      escapeHtml(a.summary || '') +
      '</p>' +
      '<div class="card-meta card-meta--with-stats">' +
      '<span class="author">' +
      (authorAvatar ? authorAvatar : '') +
      (authorAvatar && authorName ? ' ' : '') +
      '<span class="author-name" title="' +
      escapeHtml(authorRaw) +
      '">' +
      authorName +
      '</span></span>' +
      '<div class="card-meta-trail">' +
      cardStatsHtml(a) +
      '<time datetime="' + escapeHtml(a.publishedAt || '') + '">' + escapeHtml(a.publishedAt || '') + '</time>' +
      '</div>' +
      '</div>' +
      '</div>' +
      '</article>'
    );
  }

  /** 首页推荐精选：独立卡片结构（封面层次、悬停动效等） */
  function featuredCardHtml(a, listUrl) {
    var articleUrl = 'article.html?id=' + a.id + (listUrl !== 'index.html' ? '&from=' + encodeURIComponent(listUrl) : '');
    var coverHtml = mediaHtml(a.cover, '📝', 'card-cover-img') || '📝';
    var authorAvatar = (a.author && a.author.avatar) ? mediaHtml(a.author.avatar, '', 'user-avatar-img') : '';
    var authorRaw = (a.author && a.author.name) || '';
    var authorName = escapeHtml(authorRaw);
    return (
      '<article class="card card--featured" data-id="' + a.id + '">' +
      '<div class="card-cover featured-card-cover">' +
      '<div class="featured-card-cover-inner">' +
      coverHtml +
      '</div>' +
      '<div class="featured-card-cover-shade" aria-hidden="true"></div>' +
      '</div>' +
      '<div class="card-body featured-card-body">' +
      '<h2 class="card-title featured-card-title"><a href="' +
      escapeHtml(articleUrl) +
      '" title="' +
      escapeHtml(a.title || '') +
      '">' +
      escapeHtml(a.title || '') +
      '</a></h2>' +
      '<p class="card-summary featured-card-summary" title="' +
      escapeHtml(a.summary || '') +
      '">' +
      escapeHtml(a.summary || '') +
      '</p>' +
      '<div class="featured-card-meta">' +
      '<span class="author featured-card-author">' +
      (authorAvatar ? authorAvatar : '') +
      (authorAvatar && authorName ? ' ' : '') +
      '<span class="featured-card-author-name" title="' +
      escapeHtml(authorRaw) +
      '">' +
      authorName +
      '</span></span>' +
      '<time class="featured-card-time" datetime="' + escapeHtml(a.publishedAt || '') + '">' + escapeHtml(a.publishedAt || '') + '</time>' +
      '</div>' +
      '</div>' +
      '</article>'
    );
  }

  var hotRankRequestGen = 0;
  var HOT_LIST_LEAVE_MS = 200;
  var HOT_LIST_STAGGER_CLEAN_MS = 520;

  function buildHotRankingInnerHtml(ranking, listUrl) {
    if (!ranking || !ranking.length) {
      return '<p class="hot-empty">暂无浏览数据</p>';
    }
    return ranking
      .map(function (item, index) {
        var rank = index + 1;
        var title = (item.title || '').trim() || '未知文章';
        var articleUrl = 'article.html?id=' + item.id + (listUrl !== 'index.html' ? '&from=' + encodeURIComponent(listUrl) : '');
        return (
          '<div class="hot-item rank-' +
          rank +
          '"><span class="hot-item-rank">' +
          rank +
          '</span><a href="' +
          escapeHtml(articleUrl) +
          '" class="hot-item-link" title="' +
          escapeHtml(title) +
          '">' +
          escapeHtml(title) +
          '</a><span class="hot-item-views">' +
          item.views +
          ' 次</span></div>'
        );
      })
      .join('');
  }

  function hotRankingMotionReduced() {
    return typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function updateHotTabGlider() {
    if (!hotTabsEl) return;
    var glider = hotTabsEl.querySelector('.hot-tabs-glider');
    var active = hotTabsEl.querySelector('.hot-tab.is-active');
    if (!glider || !active) return;
    glider.style.width = active.offsetWidth + 'px';
    glider.style.transform = 'translateX(' + active.offsetLeft + 'px)';
  }

  function applyHotListHtml(html, withStagger) {
    if (!hotListEl) return;
    hotListEl.classList.remove('hot-list--leave');
    hotListEl.innerHTML = html;
    if (!withStagger || hotRankingMotionReduced()) {
      return;
    }
    hotListEl.classList.remove('hot-list--stagger');
    void hotListEl.offsetWidth;
    hotListEl.classList.add('hot-list--stagger');
    window.clearTimeout(applyHotListHtml._t);
    applyHotListHtml._t = window.setTimeout(function () {
      if (hotListEl) hotListEl.classList.remove('hot-list--stagger');
    }, HOT_LIST_STAGGER_CLEAN_MS);
  }

  function renderHotRanking(type) {
    if (!hotListEl || typeof getHotRanking !== 'function') return;
    var listUrl = buildListUrl({});
    var gen = ++hotRankRequestGen;
    var reduced = hotRankingMotionReduced();
    var seeded = hotListEl.classList.contains('hot-list--seeded');

    function finish(html) {
      if (gen !== hotRankRequestGen) return;
      applyHotListHtml(html, seeded && !reduced);
      hotListEl.classList.add('hot-list--seeded');
      requestAnimationFrame(function () {
        updateHotTabGlider();
      });
    }

    function fetchAndApply() {
      getHotRanking(type)
        .then(function (ranking) {
          finish(buildHotRankingInnerHtml(ranking, listUrl));
        })
        .catch(function () {
          finish('<p class="hot-empty">暂无浏览数据</p>');
        });
    }

    if (!seeded || reduced) {
      fetchAndApply();
      return;
    }

    hotListEl.classList.add('hot-list--leave');
    var leaveStarted = Date.now();
    getHotRanking(type)
      .then(function (ranking) {
        if (gen !== hotRankRequestGen) return;
        var wait = Math.max(0, HOT_LIST_LEAVE_MS - (Date.now() - leaveStarted));
        window.setTimeout(function () {
          if (gen !== hotRankRequestGen) return;
          finish(buildHotRankingInnerHtml(ranking, listUrl));
        }, wait);
      })
      .catch(function () {
        if (gen !== hotRankRequestGen) return;
        var wait = Math.max(0, HOT_LIST_LEAVE_MS - (Date.now() - leaveStarted));
        window.setTimeout(function () {
          if (gen !== hotRankRequestGen) return;
          finish('<p class="hot-empty">暂无浏览数据</p>');
        }, wait);
      });
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
        // 有搜索词时：列表展示接口全量结果，不再剔除「已在推荐里」的文章
        var toShow = q
          ? firstPage
          : firstPage.filter(function (a) { return !featIds[a.id]; });
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
          return '<div class="featured-card" role="listitem">' + featuredCardHtml(a, listUrl) + '</div>';
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
        updateHotTabGlider();
        renderHotRanking(type);
      });
    });
    requestAnimationFrame(function () {
      requestAnimationFrame(updateHotTabGlider);
    });
    window.addEventListener(
      'resize',
      function () {
        window.clearTimeout(updateHotTabGlider._debounce);
        updateHotTabGlider._debounce = window.setTimeout(updateHotTabGlider, 120);
      },
      { passive: true }
    );
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
