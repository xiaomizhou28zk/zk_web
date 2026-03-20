(function () {
  if (!window.BlogAPI || !window.BlogAPI.getToken || !window.BlogAPI.getToken()) {
    location.href = 'index.html?needLogin=1';
    return;
  }
  var listEl = document.getElementById('my-articles-list');
  var paginationEl = document.getElementById('pagination');
  var pageSizeSelectEl = document.getElementById('page-size');
  if (!listEl || !paginationEl) return;

  function getParams() {
    var params = new URLSearchParams(location.search);
    var size = parseInt(params.get('size'), 10);
    if (!PAGE_SIZE_OPTIONS.includes(size)) size = DEFAULT_PAGE_SIZE;
    return { size: size };
  }

  function getPage(totalPages) {
    var params = new URLSearchParams(location.search);
    var p = parseInt(params.get('page'), 10);
    return isNaN(p) || p < 1 ? 1 : Math.min(p, Math.max(1, totalPages));
  }

  function buildUrl(opts) {
    var cur = new URLSearchParams(location.search);
    if (opts.page !== undefined) cur.set('page', String(opts.page));
    if (opts.size !== undefined) cur.set('size', String(opts.size));
    var s = cur.toString();
    return s ? 'my-articles.html?' + s : 'my-articles.html';
  }

  function escapeHtml(s) {
    var div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }

  function render() {
    getMyArticles().then(function (list) {
      list = list || [];
      var total = list.length;
      var size = getParams().size;
    var totalPages = Math.max(1, Math.ceil(total / size));
    var page = getPage(totalPages);
    var start = (page - 1) * size;
    var items = list.slice(start, start + size);

    if (total === 0) {
      listEl.innerHTML = '<p class="empty-tip">你还没有写过文章，<a href="publish.html">去写一篇</a>吧。</p>';
      paginationEl.innerHTML = '';
      return;
    }

    listEl.innerHTML = items
      .map(function (a) {
        var statusText = a.status === 'draft' ? '草稿' : '已发布';
        var statusClass = a.status === 'draft' ? 'my-articles-status-draft' : 'my-articles-status-pub';
        var date = a.publishedAt || '—';
        var editHref = 'publish.html?id=' + a.id;
        var visOn = Number(a.visibility) !== 2;
        return (
          '<div class="my-articles-row" data-id="' + a.id + '">' +
          '<a href="' + escapeHtml('article.html?id=' + a.id) + '" class="my-articles-title">' + escapeHtml(a.title) + '</a>' +
          '<span class="my-articles-date">' + escapeHtml(date) + '</span>' +
          '<span class="my-articles-status ' + statusClass + '">' + statusText + '</span>' +
          '<div class="my-articles-vis-cell" title="关闭后文章仍可通过链接打开，但首页列表与推荐不再展示">' +
          '<span class="my-articles-vis-label">首页展示</span>' +
          '<button type="button" class="my-articles-vis-switch' + (visOn ? ' is-on' : '') + '" role="switch" aria-checked="' + visOn + '" data-id="' + a.id + '" aria-label="首页展示"></button>' +
          '</div>' +
          '<a href="' + escapeHtml(editHref) + '" class="my-articles-edit">编辑</a>' +
          '</div>'
        );
      })
      .join('');

    listEl.querySelectorAll('.my-articles-vis-switch').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        var id = parseInt(btn.getAttribute('data-id'), 10);
        if (isNaN(id) || typeof setArticleVisibility !== 'function') return;
        var nowOn = btn.classList.contains('is-on');
        var nextOn = !nowOn;
        var nextVis = nextOn ? 1 : 2;
        btn.disabled = true;
        setArticleVisibility(id, nextVis).then(function (ok) {
          btn.disabled = false;
          if (ok) {
            btn.classList.toggle('is-on', nextOn);
            btn.setAttribute('aria-checked', String(nextOn));
          }
        });
      });
    });

    var parts = [];
    if (page > 1) {
      parts.push('<a href="' + escapeHtml(buildUrl({ page: page - 1, size: size })) + '" class="pagination-link">上一页</a>');
    }
    for (var i = 1; i <= totalPages; i++) {
      if (i === page) {
        parts.push('<span class="pagination-current">' + i + '</span>');
      } else {
        parts.push('<a href="' + escapeHtml(buildUrl({ page: i, size: size })) + '" class="pagination-link">' + i + '</a>');
      }
    }
    if (page < totalPages) {
      parts.push('<a href="' + escapeHtml(buildUrl({ page: page + 1, size: size })) + '" class="pagination-link">下一页</a>');
    }
    if (totalPages > 1) {
      parts.push(
        '<span class="pagination-jump">' +
        '跳至 <input type="text" inputmode="numeric" class="pagination-jump-input" placeholder="' + page + '" aria-label="跳至页码" maxlength="4"> 页' +
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
        if (e.key === 'Enter') { e.preventDefault(); doJump(); }
      });
      if (jumpBtn) jumpBtn.addEventListener('click', doJump);
    }
    }).catch(function () {
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

  fetchUserInfo().then(function () {
    syncControlsFromUrl();
    render();
  }).catch(function () {
    listEl.innerHTML = '<p class="empty-tip">请先登录</p>';
  });

  if (pageSizeSelectEl) {
    pageSizeSelectEl.addEventListener('change', applyPageSize);
  }
})();
