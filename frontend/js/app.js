(function () {
  var listEl = document.getElementById('article-list');
  var featuredEl = document.getElementById('featured-list');
  var searchInputEl = document.getElementById('search-input');
  var hotListEl = document.getElementById('hot-list');
  var hotTabsEl = document.querySelector('.hot-tabs');
  if (!listEl) return;

  var FEATURED_MAX = 10;
  var LIST_PAGE_SIZE = 15;
  var restList = [];
  var listPage = 0;
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

  function cardHtml(a, listUrl) {
    var articleUrl = 'article.html?id=' + a.id + (listUrl !== 'index.html' ? '&from=' + encodeURIComponent(listUrl) : '');
    return (
      '<article class="card" data-id="' + a.id + '">' +
      '<div class="card-cover">' + (a.cover || '📝') + '</div>' +
      '<div class="card-body">' +
      '<h2 class="card-title"><a href="' + escapeHtml(articleUrl) + '">' + escapeHtml(a.title) + '</a></h2>' +
      '<p class="card-summary">' + escapeHtml(a.summary || '') + '</p>' +
      '<div class="card-meta">' +
      '<span class="author">' + (a.author && a.author.avatar ? a.author.avatar + ' ' : '') + escapeHtml((a.author && a.author.name) || '') + '</span> ' +
      '<time datetime="' + escapeHtml(a.publishedAt || '') + '">' + (a.publishedAt || '') + '</time>' +
      '</div>' +
      '</div>' +
      '</article>'
    );
  }

  function renderHotRanking(type) {
    if (!hotListEl || typeof getHotRanking !== 'function') return;
    var listUrl = buildListUrl({});
    getArticleList()
      .then(function (articles) {
        var idToTitle = {};
        (articles || []).forEach(function (a) { idToTitle[a.id] = a.title; });
        return getHotRanking(type).then(function (ranking) {
          return { idToTitle: idToTitle, ranking: ranking || [], listUrl: listUrl };
        });
      })
      .then(function (o) {
        if (!o.ranking.length) {
          hotListEl.innerHTML = '<p class="hot-empty">暂无浏览数据</p>';
          return;
        }
        hotListEl.innerHTML = o.ranking.map(function (item, index) {
          var rank = index + 1;
          var title = o.idToTitle[item.id] || '未知文章';
          var articleUrl = 'article.html?id=' + item.id + (o.listUrl !== 'index.html' ? '&from=' + encodeURIComponent(o.listUrl) : '');
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
    var start = listPage * LIST_PAGE_SIZE;
    var chunk = restList.slice(start, start + LIST_PAGE_SIZE);
    if (chunk.length === 0) return;
    listPage++;
    appendListItems(chunk);
  }

  function render() {
    var q = getParams().q;
    listUrl = buildListUrl({});
    getArticleList(q)
      .then(function (list) {
        var filtered = filterArticles(list || [], q);
        var featured = filtered.slice(0, FEATURED_MAX);
        restList = filtered.slice(FEATURED_MAX);
        listPage = 0;

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
        if (restList.length === 0 && featured.length === 0) {
          listEl.innerHTML = '<p class="empty-tip">没有找到相关文章，试试其他关键词。</p>';
        } else if (restList.length === 0) {
          listEl.innerHTML = '';
        } else {
          loadNextPage();
          ensureSentinel();
        }

        listEl.querySelectorAll('.card .card-title a').forEach(function (link) {
          link.addEventListener('click', function (e) { e.preventDefault(); location.href = this.getAttribute('href'); });
        });
        if (featuredEl) {
          featuredEl.querySelectorAll('.card .card-title a').forEach(function (link) {
            link.addEventListener('click', function (e) { e.preventDefault(); location.href = this.getAttribute('href'); });
          });
        }
      })
      .catch(function () {
        listEl.innerHTML = '<p class="empty-tip">加载失败，请稍后重试。</p>';
      });
  }

  function onScroll() {
    var sentinel = document.getElementById('list-load-sentinel');
    if (!sentinel || restList.length === 0) return;
    var loaded = listPage * LIST_PAGE_SIZE;
    if (loaded >= restList.length) {
      if (sentinel.parentNode) sentinel.parentNode.removeChild(sentinel);
      return;
    }
    var rect = sentinel.getBoundingClientRect();
    if (rect.top <= (window.innerHeight || document.documentElement.clientHeight) + 200) {
      loadNextPage();
    }
  }

  function ensureSentinel() {
    var existing = document.getElementById('list-load-sentinel');
    if (existing && existing.parentNode) existing.parentNode.removeChild(existing);
    if (!listEl || restList.length <= listPage * LIST_PAGE_SIZE) return;
    var div = document.createElement('div');
    div.id = 'list-load-sentinel';
    div.className = 'list-load-sentinel';
    div.setAttribute('aria-hidden', 'true');
    listEl.appendChild(div);
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
  render();
  renderHotRanking('total');

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

  if (searchInputEl) {
    var searchTimeout;
    searchInputEl.addEventListener('input', function () {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(applySearch, 280);
    });
    searchInputEl.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        clearTimeout(searchTimeout);
        applySearch();
      }
    });
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
