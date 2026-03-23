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

          listEl.innerHTML = items
            .map(function (a) {
              var date = a.publishedAt || '—';
              return (
                '<div class="my-articles-row" data-id="' +
                a.id +
                '">' +
                '<a href="' +
                escapeHtml('article.html?id=' + a.id) +
                '" class="my-articles-title">' +
                escapeHtml(a.title) +
                '</a>' +
                '<span class="my-articles-date">' +
                escapeHtml(date) +
                '</span>' +
                '<span class="my-articles-status my-articles-status-pub">已发布</span>' +
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
