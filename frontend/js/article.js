(function () {
  const params = new URLSearchParams(location.search);
  const id = parseInt(params.get('id'), 10);
  const from = params.get('from');
  const backHref = from ? decodeURIComponent(from) : 'index.html';
  const backLinkEl = document.querySelector('.back-link');
  if (backLinkEl) backLinkEl.setAttribute('href', backHref);

  const titleEl = document.getElementById('article-title');
  const metaEl = document.getElementById('article-meta');
  const engagementEl = document.getElementById('article-engagement');
  const bodyEl = document.getElementById('article-body');
  const commentListEl = document.getElementById('comment-list');
  const commentIdentityEl = document.getElementById('comment-identity');
  const commentContentEl = document.getElementById('comment-content');
  const commentSubmitEl = document.getElementById('comment-submit');

  /** 单行起高，换行/删行时随内容变化（不依赖 field-sizing 的旧浏览器也一致） */
  function adjustTextareaHeight(el) {
    if (!el || el.tagName !== 'TEXTAREA') return;
    var max = el.classList.contains('reply-content') ? 220 : 240;
    el.style.height = '0px';
    var sh = el.scrollHeight;
    if (sh > max) {
      el.style.height = max + 'px';
      el.style.overflowY = 'auto';
    } else {
      el.style.height = sh + 'px';
      el.style.overflowY = 'hidden';
    }
  }

  function bindTextareaAutoGrow(el) {
    if (!el || el.getAttribute('data-auto-grow') === '1') return;
    el.setAttribute('data-auto-grow', '1');
    el.addEventListener('input', function () {
      adjustTextareaHeight(el);
    });
    /* 隐藏的回复框由展开时的 requestAnimationFrame 再算高 */
    if (el.offsetParent) adjustTextareaHeight(el);
  }

  function escapeHtml(s) {
    const div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }

  /** 头像：http(s) 图片地址用 img，否则按 emoji/文本展示 */
  function avatarHtml(avatar) {
    var a = avatar != null ? String(avatar).trim() : '';
    if (!a) a = '👤';
    if (/^https?:\/\/.+/i.test(a)) {
      var src = a.replace(/"/g, '&quot;');
      return '<img class="user-avatar-img" src="' + src + '" alt="" referrerpolicy="no-referrer" loading="lazy" />';
    }
    return escapeHtml(a);
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

  /** @param {string} [parentAuthor] 被回复者昵称，用于显示「A 回复 B」 */
  function renderReply(r, commentId, parentAuthor) {
    var replyLabel = parentAuthor ? escapeHtml(r.author) + ' 回复 ' + escapeHtml(parentAuthor) : escapeHtml(r.author);
    var nested = (r.replies || [])
      .map(function (nr) {
        return renderReply(nr, commentId, r.author);
      })
      .join('');
    return (
      '<li class="reply-item" data-comment-id="' +
      escapeHtml(commentId) +
      '" data-reply-id="' +
      escapeHtml(r.id) +
      '" data-reply-author="' +
      escapeHtml(r.author) +
      '">' +
      '<div class="reply-head">' +
      '<strong>' + replyLabel + '</strong> ' +
      '<span class="comment-time">' +
      escapeHtml(r.time) +
      '</span> ' +
      '<a href="javascript:void(0)" class="reply-link tap-to-reply">回复</a>' +
      '</div>' +
      '<p class="reply-text tap-to-reply">' +
      escapeHtml(r.content) +
      '</p>' +
      '<ul class="reply-list">' +
      nested +
      '</ul>' +
      '<div class="reply-form-wrap" style="display:none">' +
      '<textarea class="reply-content" placeholder="回复内容，Enter 发送 / Shift+Enter 换行" rows="1"></textarea>' +
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
            return renderReply(r, c.id, c.author);
          })
          .join('');
        return (
          '<li class="comment-item" data-comment-id="' +
          escapeHtml(c.id) +
          '" data-comment-author="' +
          escapeHtml(c.author || '') +
          '">' +
          '<div class="comment-head">' +
          '<strong>' +
          escapeHtml(c.author) +
          '</strong> ' +
          '<span class="comment-time">' +
          escapeHtml(c.time) +
          '</span> ' +
          '<a href="javascript:void(0)" class="reply-link tap-to-reply">回复</a>' +
          '</div>' +
          '<p class="comment-text tap-to-reply">' +
          escapeHtml(c.content) +
          '</p>' +
          '<ul class="reply-list">' +
          repliesHtml +
          '</ul>' +
          '<div class="reply-form-wrap" style="display:none">' +
          '<textarea class="reply-content" placeholder="回复内容，Enter 发送 / Shift+Enter 换行" rows="1"></textarea>' +
          '<button type="button" class="btn btn-small reply-submit">回复</button>' +
          '</div>' +
          '</li>'
        );
      })
      .join('');

    commentListEl.querySelectorAll('.reply-content').forEach(bindTextareaAutoGrow);

    commentListEl.querySelectorAll('.tap-to-reply').forEach(function (el) {
      el.addEventListener('click', function () {
        var container = el.closest('.reply-item') || el.closest('.comment-item');
        var wrap = container && container.querySelector(':scope > .reply-form-wrap');
        if (!wrap) return;
        var wasOpen = wrap.style.display === 'block';
        commentListEl.querySelectorAll('.reply-form-wrap').forEach(function (w) {
          w.style.display = 'none';
        });
        if (!wasOpen) wrap.style.display = 'block';
        if (!wasOpen) {
          var textarea = wrap.querySelector('.reply-content');
          var author = container.getAttribute('data-reply-author') || container.getAttribute('data-comment-author');
          textarea.placeholder = author ? '回复 @' + author : '回复内容，Enter 发送 / Shift+Enter 换行';
          requestAnimationFrame(function () {
            adjustTextareaHeight(textarea);
          });
          textarea.focus();
        }
      });
    });

    commentListEl.querySelectorAll('.reply-submit').forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (!window.BlogAPI || !window.BlogAPI.getToken || !window.BlogAPI.getToken()) {
          window.dispatchEvent(new CustomEvent('blog:openLogin'));
          return;
        }
        var formWrap = btn.closest('.reply-form-wrap');
        var container = formWrap && formWrap.parentElement;
        var contentInput = formWrap && formWrap.querySelector('.reply-content');
        if (!contentInput || !container) return;
        var u = getCurrentUser();
        if (!u || !(u.nickname || '').trim()) return;
        var commentId = container.getAttribute('data-comment-id');
        var replyItem = formWrap.closest('.reply-item');
        var parentReplyId = replyItem ? (replyItem.getAttribute('data-reply-id') || undefined) : undefined;
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

  /** 互动区 SVG（线性图标，激活态由 CSS 着色与加粗描边） */
  var svgLike =
    '<svg class="engagement-svg" viewBox="0 0 24 24" width="19" height="19" aria-hidden="true" focusable="false" fill="none">' +
    '<path stroke="currentColor" stroke-width="1.55" stroke-linecap="round" stroke-linejoin="round" d="M6.633 10.25c.806 0 1.536-.438 2.038-1.133a9.093 9.093 0 0 1 2.236-2.48c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 0 0 .322-1.672V3a.75.75 0 0 1 .75-.75 2.25 2.25 0 0 1 2.25 2.25c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.851.068 1.285 0 3.255-2.33 5.954-5.47 6.154-2.893.19-5.534-1.457-6.634-4.154ZM5.25 10h-1A2.25 2.25 0 0 0 2 12.25v6.5A2.25 2.25 0 0 0 4.25 21h1A2.25 2.25 0 0 0 7.5 18.75v-6.5A2.25 2.25 0 0 0 5.25 10Z"/>' +
    '</svg>';
  var svgFav =
    '<svg class="engagement-svg" viewBox="0 0 24 24" width="19" height="19" aria-hidden="true" focusable="false" fill="none">' +
    '<path stroke="currentColor" stroke-width="1.55" stroke-linecap="round" stroke-linejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z"/>' +
    '</svg>';

  function renderEngagement(eg) {
    if (!engagementEl) return;
    eg = eg || { likeCount: 0, favoriteCount: 0, liked: false, favorited: false };
    var likeCount = eg.likeCount != null ? eg.likeCount : 0;
    var favCount = eg.favoriteCount != null ? eg.favoriteCount : 0;
    var liked = !!eg.liked;
    var favorited = !!eg.favorited;
    engagementEl.innerHTML =
      '<div class="article-engagement-inner">' +
      '<p class="engagement-lead">这篇文章对你有帮助吗？</p>' +
      '<div class="engagement-panel" role="group" aria-label="点赞与收藏">' +
      '<button type="button" class="engagement-chip engagement-like' +
      (liked ? ' is-on' : '') +
      '" data-action="like" aria-pressed="' +
      liked +
      '">' +
      '<span class="engagement-chip__icon" aria-hidden="true">' +
      svgLike +
      '</span>' +
      '<span class="engagement-chip__text">' +
      '<span class="engagement-chip__label">点赞</span>' +
      '<span class="engagement-chip__count like-count" aria-label="点赞数">' +
      likeCount +
      '</span>' +
      '</span>' +
      '</button>' +
      '<span class="engagement-divider" aria-hidden="true"></span>' +
      '<button type="button" class="engagement-chip engagement-fav' +
      (favorited ? ' is-on' : '') +
      '" data-action="favorite" aria-pressed="' +
      favorited +
      '">' +
      '<span class="engagement-chip__icon" aria-hidden="true">' +
      svgFav +
      '</span>' +
      '<span class="engagement-chip__text">' +
      '<span class="engagement-chip__label">收藏</span>' +
      '<span class="engagement-chip__count fav-count" aria-label="收藏数">' +
      favCount +
      '</span>' +
      '</span>' +
      '</button>' +
      '</div>' +
      '</div>';

    engagementEl.querySelectorAll('.engagement-chip').forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (!window.BlogAPI || !window.BlogAPI.getToken || !window.BlogAPI.getToken()) {
          window.dispatchEvent(new CustomEvent('blog:openLogin'));
          return;
        }
        var act = btn.getAttribute('data-action');
        if (act === 'like' && typeof window.BlogAPI.toggleArticleLike === 'function') {
          window.BlogAPI.toggleArticleLike(id)
            .then(function (d) {
              var lc = d.likeCount != null ? d.likeCount : d.like_count;
              var isOn = !!(d.liked != null ? d.liked : false);
              btn.classList.toggle('is-on', isOn);
              btn.setAttribute('aria-pressed', String(isOn));
              var c = engagementEl.querySelector('.like-count');
              if (c != null && lc != null) c.textContent = String(lc);
            })
            .catch(function () {});
        } else if (act === 'favorite' && typeof window.BlogAPI.toggleArticleFavorite === 'function') {
          window.BlogAPI.toggleArticleFavorite(id)
            .then(function (d) {
              var fc = d.favoriteCount != null ? d.favoriteCount : d.favorite_count;
              var isOn = !!(d.favorited != null ? d.favorited : false);
              btn.classList.toggle('is-on', isOn);
              btn.setAttribute('aria-pressed', String(isOn));
              var c = engagementEl.querySelector('.fav-count');
              if (c != null && fc != null) c.textContent = String(fc);
            })
            .catch(function () {});
        }
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
    commentIdentityEl.innerHTML = nick ? '以 <strong>' + (avatarHtml(u.avatar) || '') + (u.avatar ? ' ' : '') + escapeHtml(nick) + '</strong> 身份评论' : '加载中…';
    commentIdentityEl.className = 'comment-identity';
  }

  fetchUserInfo().then(updateCommentIdentity);

  (typeof getArticle === 'function' ? getArticle(id) : Promise.resolve(null))
    .then(function (result) {
      if (!result || !result.article) {
        if (titleEl) titleEl.textContent = '文章不存在';
        if (metaEl) metaEl.innerHTML = '<a href="index.html">返回首页</a>';
        if (engagementEl) engagementEl.innerHTML = '';
        if (bodyEl) bodyEl.innerHTML = '';
        return;
      }
      var article = result.article;
      var bodyHtml = result.bodyHtml || '';
      // 浏览统计由后端 GetArticle 接口内部写入 article_view_log，无需前端再调 recordView
      document.title = article.title + ' - 阿瑞之家';
      if (titleEl) titleEl.textContent = article.title;
      if (metaEl) {
        var authorAvatar = (article.author && article.author.avatar) ? avatarHtml(article.author.avatar) : '';
        var authorName = escapeHtml((article.author && article.author.name) || '');
        metaEl.innerHTML = '<span class="author">' + (authorAvatar ? authorAvatar + ' ' : '') + authorName + '</span> <time datetime="' + escapeHtml(article.publishedAt || '') + '">' + escapeHtml(article.publishedAt || '') + '</time>';
      }
      if (bodyEl) bodyEl.innerHTML = bodyHtml;
      renderEngagement(result.engagement);
      loadComments();
    })
    .catch(function () {
      if (titleEl) titleEl.textContent = '加载失败';
      if (metaEl) metaEl.innerHTML = '<a href="index.html">返回首页</a>';
      if (engagementEl) engagementEl.innerHTML = '';
      if (bodyEl) bodyEl.innerHTML = '';
    });

  if (commentSubmitEl && commentContentEl) {
    commentSubmitEl.addEventListener('click', function () {
      if (!window.BlogAPI || !window.BlogAPI.getToken || !window.BlogAPI.getToken()) {
        window.dispatchEvent(new CustomEvent('blog:openLogin'));
        return;
      }
      var u = getCurrentUser();
      if (!u || !(u.nickname || '').trim()) return;
      var content = commentContentEl.value.trim();
      if (!content) return;
      if (typeof addComment !== 'function') return;
      addComment(id, content).then(function () {
        commentContentEl.value = '';
        adjustTextareaHeight(commentContentEl);
        return getComments(id);
      }).then(function (list) { renderComments(list); }).catch(function () {});
    });
    commentContentEl.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        commentSubmitEl.click();
      }
    });
    bindTextareaAutoGrow(commentContentEl);
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
