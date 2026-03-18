(function () {
  const params = new URLSearchParams(location.search);
  const id = parseInt(params.get('id'), 10);
  const from = params.get('from');
  const backHref = from ? decodeURIComponent(from) : 'index.html';
  const backLinkEl = document.querySelector('.back-link');
  if (backLinkEl) backLinkEl.setAttribute('href', backHref);

  const titleEl = document.getElementById('article-title');
  const metaEl = document.getElementById('article-meta');
  const bodyEl = document.getElementById('article-body');
  const commentListEl = document.getElementById('comment-list');
  const commentIdentityEl = document.getElementById('comment-identity');
  const commentContentEl = document.getElementById('comment-content');
  const commentSubmitEl = document.getElementById('comment-submit');

  function escapeHtml(s) {
    const div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }

  function timeStr() {
    const now = new Date();
    return (
      now.getFullYear() +
      '-' +
      String(now.getMonth() + 1).padStart(2, '0') +
      '-' +
      String(now.getDate()).padStart(2, '0') +
      ' ' +
      String(now.getHours()).padStart(2, '0') +
      ':' +
      String(now.getMinutes()).padStart(2, '0')
    );
  }

  function renderReply(r, commentId) {
    var nested = (r.replies || [])
      .map(function (nr) {
        return renderReply(nr, commentId);
      })
      .join('');
    return (
      '<li class="reply-item" data-comment-id="' +
      escapeHtml(commentId) +
      '" data-reply-id="' +
      escapeHtml(r.id) +
      '">' +
      '<div class="reply-head">' +
      '<strong>' +
      escapeHtml(r.author) +
      '</strong> ' +
      '<span class="comment-time">' +
      escapeHtml(r.time) +
      '</span>' +
      '</div>' +
      '<p class="reply-text tap-to-reply">' +
      escapeHtml(r.content) +
      '</p>' +
      '<ul class="reply-list">' +
      nested +
      '</ul>' +
      '<div class="reply-form-wrap" style="display:none">' +
      '<textarea class="reply-content" placeholder="回复内容，Enter 发送 / Shift+Enter 换行" rows="2"></textarea>' +
      '<button type="button" class="btn btn-small reply-submit">回复</button>' +
      '</div>' +
      '</li>'
    );
  }

  function findReplyInReplies(replies, replyId) {
    if (!replies || !replies.length) return null;
    for (var i = 0; i < replies.length; i++) {
      if (replies[i].id === replyId) return replies[i];
      var found = findReplyInReplies(replies[i].replies, replyId);
      if (found) return found;
    }
    return null;
  }

  function renderComments(comments) {
    comments = comments || [];
    commentListEl.innerHTML = comments
      .map(function (c) {
        const repliesHtml = (c.replies || [])
          .map(function (r) {
            return renderReply(r, c.id);
          })
          .join('');
        return (
          '<li class="comment-item" data-comment-id="' +
          escapeHtml(c.id) +
          '">' +
          '<div class="comment-head">' +
          '<strong>' +
          escapeHtml(c.author) +
          '</strong> ' +
          '<span class="comment-time">' +
          escapeHtml(c.time) +
          '</span>' +
          '</div>' +
          '<p class="comment-text tap-to-reply">' +
          escapeHtml(c.content) +
          '</p>' +
          '<ul class="reply-list">' +
          repliesHtml +
          '</ul>' +
          '<div class="reply-form-wrap" style="display:none">' +
          '<textarea class="reply-content" placeholder="回复内容，Enter 发送 / Shift+Enter 换行" rows="2"></textarea>' +
          '<button type="button" class="btn btn-small reply-submit">回复</button>' +
          '</div>' +
          '</li>'
        );
      })
      .join('');

    commentListEl.querySelectorAll('.tap-to-reply').forEach(function (el) {
      el.addEventListener('click', function () {
        var container = el.closest('.comment-item') || el.closest('.reply-item');
        var wrap = container && container.querySelector(':scope > .reply-form-wrap');
        if (!wrap) return;
        var wasOpen = wrap.style.display === 'block';
        commentListEl.querySelectorAll('.reply-form-wrap').forEach(function (w) {
          w.style.display = 'none';
        });
        if (!wasOpen) wrap.style.display = 'block';
      });
    });

    commentListEl.querySelectorAll('.reply-submit').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var formWrap = btn.closest('.reply-form-wrap');
        var container = formWrap && formWrap.parentElement;
        var contentInput = formWrap && formWrap.querySelector('.reply-content');
        if (!contentInput || !container) return;
        var u = getCurrentUser();
        if (!u || !(u.nickname || '').trim()) return;
        var commentId = container.getAttribute('data-comment-id');
        var parentReplyId = container.getAttribute('data-reply-id') || undefined;
        var content = contentInput.value.trim();
        if (!content || !commentId) return;
        if (typeof addReply !== 'function') return;
        addReply(id, commentId, content, parentReplyId).then(function () {
          contentInput.value = '';
          formWrap.style.display = 'none';
          return getComments(id);
        }).then(function (list) { renderComments(list); }).catch(function () {});
      });
    });
  }

  function loadComments() {
    if (typeof getComments === 'function') {
      getComments(id).then(renderComments).catch(function () { renderComments([]); });
    } else {
      renderComments([]);
    }
  }

  function updateCommentIdentity() {
    if (!commentIdentityEl) return;
    var u = getCurrentUser();
    if (!u) return;
    var nick = (u.nickname || '').trim();
    commentIdentityEl.innerHTML = nick ? '以 <strong>' + escapeHtml(u.avatar + ' ' + nick) + '</strong> 身份评论' : '加载中…';
    commentIdentityEl.className = 'comment-identity';
  }

  fetchUserInfo().then(updateCommentIdentity);

  (typeof getArticle === 'function' ? getArticle(id) : Promise.resolve(null))
    .then(function (result) {
      if (!result || !result.article) {
        if (titleEl) titleEl.textContent = '文章不存在';
        if (metaEl) metaEl.innerHTML = '<a href="index.html">返回首页</a>';
        if (bodyEl) bodyEl.innerHTML = '';
        return;
      }
      var article = result.article;
      var bodyHtml = result.bodyHtml || '';
      if (typeof recordArticleView === 'function') recordArticleView(article.id);
      document.title = article.title + ' - 技术博客';
      if (titleEl) titleEl.textContent = article.title;
      if (metaEl) {
        var authorStr = (article.author && article.author.avatar) ? article.author.avatar + ' ' : '';
        authorStr += (article.author && article.author.name) || '';
        metaEl.innerHTML = '<span class="author">' + escapeHtml(authorStr) + '</span> <time datetime="' + escapeHtml(article.publishedAt || '') + '">' + escapeHtml(article.publishedAt || '') + '</time>';
      }
      if (bodyEl) bodyEl.innerHTML = bodyHtml;
      loadComments();
    })
    .catch(function () {
      if (titleEl) titleEl.textContent = '加载失败';
      if (metaEl) metaEl.innerHTML = '<a href="index.html">返回首页</a>';
      if (bodyEl) bodyEl.innerHTML = '';
    });

  if (commentSubmitEl && commentContentEl) {
    commentSubmitEl.addEventListener('click', function () {
      var u = getCurrentUser();
      if (!u || !(u.nickname || '').trim()) return;
      var content = commentContentEl.value.trim();
      if (!content) return;
      if (typeof addComment !== 'function') return;
      addComment(id, content).then(function () {
        commentContentEl.value = '';
        return getComments(id);
      }).then(function (list) { renderComments(list); }).catch(function () {});
    });
    commentContentEl.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        commentSubmitEl.click();
      }
    });
  }

  commentListEl.addEventListener('keydown', function (e) {
    if (!e.target.classList || !e.target.classList.contains('reply-content')) return;
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      var wrap = e.target.closest('.reply-form-wrap');
      var btn = wrap && wrap.querySelector('.reply-submit');
      if (btn) btn.click();
    }
  });
})();
