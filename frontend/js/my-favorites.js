(function () {
  var listEl = document.getElementById('my-favorites-list');
  var paginationEl = document.getElementById('pagination');
  var pageSizeSelectEl = document.getElementById('page-size');
  if (!listEl || !paginationEl) return;

  function trimToken() {
    try {
      if (!window.BlogAPI || typeof window.BlogAPI.getToken !== 'function') return '';
      return String(window.BlogAPI.getToken() || '').trim();
    } catch (e) {
      return '';
    }
  }

  function showGuest() {
    if (typeof window.blogTryOpenLogin === 'function') window.blogTryOpenLogin();
    else if (typeof window.openBlogLogin === 'function') window.openBlogLogin();
    else window.dispatchEvent(new CustomEvent('blog:openLogin'));
    listEl.innerHTML = '<p class="empty-tip">请先登录后查看我的收藏。</p>';
    paginationEl.innerHTML = '';
    window.addEventListener('blog:loginSuccess', function onLogin() {
      window.removeEventListener('blog:loginSuccess', onLogin);
      location.reload();
    });
  }

  function initMain() {
    function getParams() {
      var params = new URLSearchParams(location.search);
      var size = parseInt(params.get('size'), 10);
      if (!PAGE_SIZE_OPTIONS.includes(size)) size = DEFAULT_PAGE_SIZE;
      return { size: size };
    }

    function buildUrl(opts) {
      var cur = new URLSearchParams(location.search);
      if (opts.page !== undefined) cur.set('page', String(opts.page));
      if (opts.size !== undefined) cur.set('size', String(opts.size));
      var s = cur.toString();
      return s ? 'my-favorites.html?' + s : 'my-favorites.html';
    }

    function escapeHtml(s) {
      var div = document.createElement('div');
      div.textContent = s;
      return div.innerHTML;
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

    function favoriteRowStatsHtml(a) {
      var lc = a.likeCount != null ? a.likeCount : a.like_count;
      var fc = a.favoriteCount != null ? a.favoriteCount : a.favorite_count;
      var like = Number(lc);
      var fav = Number(fc);
      if (!isFinite(like) || like < 0) like = 0;
      if (!isFinite(fav) || fav < 0) fav = 0;
      return (
        '<div class="card-stats my-favorites-row-stats" aria-label="点赞与收藏">' +
        '<span class="card-stat" title="点赞">' +
        svgCardLike +
        '<span class="card-stat__num">' +
        escapeHtml(formatStatNum(like)) +
        '</span></span>' +
        '<span class="card-stat" title="收藏">' +
        svgCardFav +
        '<span class="card-stat__num">' +
        escapeHtml(formatStatNum(fav)) +
        '</span></span>' +
        '</div>'
      );
    }

    function render() {
      var size = getParams().size;
      if (typeof getMyFavoriteArticles !== 'function') {
        listEl.innerHTML = '<p class="empty-tip">数据模块未加载。</p>';
        paginationEl.innerHTML = '';
        return;
      }
      var params = new URLSearchParams(location.search);
      var pageFromUrl = parseInt(params.get('page'), 10);
      var page = isNaN(pageFromUrl) || pageFromUrl < 1 ? 1 : pageFromUrl;

      getMyFavoriteArticles({ page: page, page_size: size })
        .then(function (res) {
          var total = res.total != null ? res.total : 0;
          var totalPages = Math.max(1, Math.ceil(total / size));
          if (page > totalPages) {
            location.replace(buildUrl({ page: totalPages, size: size }));
            return;
          }
          var items = res.articles || [];

          if (total === 0) {
            listEl.innerHTML = '<p class="empty-tip">暂无收藏，在文章详情页点击「收藏」即可加入这里。</p>';
            paginationEl.innerHTML = '';
            return;
          }

          var favoritesListUrl = buildUrl({ page: page, size: size });

          listEl.innerHTML = items
            .map(function (a) {
              var date = a.publishedAt || '—';
              var articleUrl =
                'article.html?id=' + a.id + '&from=' + encodeURIComponent(favoritesListUrl);
              return (
                '<div class="my-articles-row" data-id="' +
                a.id +
                '">' +
                '<a href="' +
                escapeHtml(articleUrl) +
                '" class="my-articles-title">' +
                escapeHtml(a.title) +
                '</a>' +
                '<span class="my-articles-date">' +
                escapeHtml(date) +
                '</span>' +
                favoriteRowStatsHtml(a) +
                '</div>'
              );
            })
            .join('');

          var parts = [];
          if (page > 1) {
            parts.push(
              '<a href="' + escapeHtml(buildUrl({ page: page - 1, size: size })) + '" class="pagination-link">上一页</a>'
            );
          }
          for (var i = 1; i <= totalPages; i++) {
            if (i === page) {
              parts.push('<span class="pagination-current">' + i + '</span>');
            } else {
              parts.push(
                '<a href="' + escapeHtml(buildUrl({ page: i, size: size })) + '" class="pagination-link">' + i + '</a>'
              );
            }
          }
          if (page < totalPages) {
            parts.push(
              '<a href="' + escapeHtml(buildUrl({ page: page + 1, size: size })) + '" class="pagination-link">下一页</a>'
            );
          }
          if (totalPages > 1) {
            parts.push(
              '<span class="pagination-jump">' +
                '跳至 <input type="text" inputmode="numeric" class="pagination-jump-input" placeholder="' +
                page +
                '" aria-label="跳至页码" maxlength="4"> 页' +
                '<button type="button" class="pagination-jump-btn" aria-label="跳转">→</button>' +
                '</span>'
            );
          }
          paginationEl.innerHTML = parts.length ? '<div class="pagination-inner">' + parts.join('') + '</div>' : '';

          var jumpInput = paginationEl.querySelector('.pagination-jump-input');
          var jumpBtn = paginationEl.querySelector('.pagination-jump-btn');
          if (jumpInput && totalPages > 1) {
            function doJump() {
              var v = parseInt(jumpInput.value, 10);
              if (!isNaN(v) && v >= 1 && v <= totalPages) {
                location.href = buildUrl({ page: v, size: size });
              } else {
                jumpInput.placeholder = '1-' + totalPages;
                jumpInput.value = '';
                jumpInput.focus();
              }
            }
            jumpInput.addEventListener('keydown', function (e) {
              if (e.key === 'Enter') {
                e.preventDefault();
                doJump();
              }
            });
            if (jumpBtn) jumpBtn.addEventListener('click', doJump);
          }
        })
        .catch(function () {
          listEl.innerHTML = '<p class="empty-tip">加载失败，请稍后重试。</p>';
          paginationEl.innerHTML = '';
        });
    }

    function syncControlsFromUrl() {
      var size = getParams().size;
      if (pageSizeSelectEl) pageSizeSelectEl.value = String(size);
    }

    function applyPageSize() {
      var size = pageSizeSelectEl ? parseInt(pageSizeSelectEl.value, 10) : DEFAULT_PAGE_SIZE;
      location.href = buildUrl({ page: 1, size: size });
    }

    fetchUserInfo()
      .then(function () {
        syncControlsFromUrl();
        render();
      })
      .catch(function () {
        listEl.innerHTML = '<p class="empty-tip">请先登录</p>';
      });

    if (pageSizeSelectEl) {
      pageSizeSelectEl.addEventListener('change', applyPageSize);
    }
  }

  if (!trimToken()) {
    showGuest();
    return;
  }
  if (typeof fetchUserInfo !== 'function') {
    showGuest();
    return;
  }
  fetchUserInfo().then(function (u) {
    if (!u) {
      showGuest();
      return;
    }
    initMain();
  });
})();
