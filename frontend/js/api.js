/**
 * 博客 API 客户端：所有请求使用 config.js 中的 BLOG_API_BASE，回包统一外壳 { code, msg, data }
 */
(function () {
  var BASE = typeof window !== 'undefined' && window.BLOG_API_BASE != null ? String(window.BLOG_API_BASE) : '';
  var TOKEN_KEY = 'blog_token';

  function getToken() {
    try {
      return localStorage.getItem(TOKEN_KEY) || '';
    } catch (_) {}
    return '';
  }

  function setToken(token) {
    try {
      if (token) localStorage.setItem(TOKEN_KEY, token);
      else localStorage.removeItem(TOKEN_KEY);
    } catch (_) {}
  }

  function toCamel(obj) {
    if (obj === null || typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) return obj.map(toCamel);
    var out = {};
    for (var k in obj) {
      if (!Object.prototype.hasOwnProperty.call(obj, k)) continue;
      var key = k.replace(/_([a-z])/g, function (_, c) { return c.toUpperCase(); });
      out[key] = toCamel(obj[k]);
    }
    return out;
  }

  /** 密码在传输前做 base64 编码（与后端约定） */
  function base64EncodePassword(str) {
    if (str == null) return '';
    try {
      return btoa(unescape(encodeURIComponent(String(str))));
    } catch (_) {
      return btoa(String(str));
    }
  }

  function request(method, path, body, query) {
    var url = BASE + path;
    if (query && typeof query === 'object') {
      var qs = new URLSearchParams();
      for (var key in query) {
        if (query[key] !== undefined && query[key] !== '') qs.set(key, String(query[key]));
      }
      var s = qs.toString();
      if (s) url += (path.indexOf('?') !== -1 ? '&' : '?') + s;
    }
    var opts = {
      method: method,
      headers: { 'Content-Type': 'application/json' },
    };
    var token = getToken();
    if (token) opts.headers['Authorization'] = 'Bearer ' + token; // 登录/注册返回的 token 已写入存储，后续请求统一带此 header
    if (body != null && method !== 'GET') opts.body = JSON.stringify(body);
    return fetch(url, opts).then(function (response) {
      return response.text().then(function (text) {
        var res;
        try {
          res = text ? JSON.parse(text) : {};
        } catch (_) {
          if (window.BlogToast && typeof window.BlogToast.show === 'function') {
            window.BlogToast.show('响应解析失败');
          }
          var parseErr = new Error('响应解析失败');
          parseErr.code = -1;
          throw parseErr;
        }
        if (typeof res.code !== 'number') {
          if (window.BlogToast && typeof window.BlogToast.show === 'function') {
            window.BlogToast.show('接口返回格式错误');
          }
          var fmtErr = new Error('接口返回格式错误');
          fmtErr.code = -1;
          throw fmtErr;
        }
        if (res.code !== 0) {
          var errMsg = res.msg != null && res.msg !== '' ? String(res.msg) : '请求失败';
          if (window.BlogToast && typeof window.BlogToast.show === 'function') {
            window.BlogToast.show(errMsg);
          }
          var bizErr = new Error(errMsg);
          bizErr.code = res.code;
          throw bizErr;
        }
        var data = res.data != null ? res.data : {};
        return toCamel(data);
      });
    });
  }

  window.BlogAPI = {
    getToken: getToken,
    setToken: setToken,

    getUserMe: function () {
      return request('GET', '/api/user/me');
    },

    /** 更新昵称、头像（需登录；头像可为 emoji 或图片 URL） */
    updateProfile: function (nickname, avatar) {
      return request('POST', '/api/user/profile', {
        nickname: nickname,
        avatar: avatar || '👤',
      });
    },

    /** 修改密码（需登录；明文由内部 base64 后与登录一致） */
    changePassword: function (oldPassword, newPassword) {
      return request('POST', '/api/auth/change-password', {
        old_password: base64EncodePassword(oldPassword),
        new_password: base64EncodePassword(newPassword),
      });
    },

    login: function (account, password) {
      return request('POST', '/api/auth/login', { account: account, password: base64EncodePassword(password) })
        .then(function (data) {
          if (data && data.token) setToken(data.token);
          return data;
        });
    },

    register: function (nickname, account, password) {
      return request('POST', '/api/auth/register', { nickname: nickname, account: account, password: base64EncodePassword(password) })
        .then(function (data) {
          if (data && data.token) setToken(data.token);
          return data;
        });
    },

    logout: function () {
      return request('POST', '/api/auth/logout').then(function () {
        setToken('');
      });
    },

    getArticles: function (params) {
      return request('GET', '/api/articles', null, {
        q: params && params.q,
        cursor: params && params.cursor,
        page_size: params && params.page_size,
      });
    },

    getFeaturedArticles: function () {
      return request('GET', '/api/articles/featured');
    },

    getArticle: function (id) {
      return request('GET', '/api/articles/detail', null, { id: id });
    },

    getMyArticles: function (params) {
      return request('GET', '/api/articles/mine', null, {
        page: params && params.page,
        page_size: params && params.page_size,
      });
    },

    toggleArticleLike: function (articleId) {
      return request('POST', '/api/articles/like/toggle', { article_id: articleId });
    },

    toggleArticleFavorite: function (articleId) {
      return request('POST', '/api/articles/favorite/toggle', { article_id: articleId });
    },

    getMyFavoriteArticles: function (params) {
      return request('GET', '/api/articles/favorites/mine', null, {
        page: params && params.page,
        page_size: params && params.page_size,
      });
    },

    createArticle: function (body) {
      return request('POST', '/api/articles', {
        title: body.title,
        summary: body.summary,
        cover: body.cover || '📝',
        body_html: body.bodyHtml,
        status: body.status,
      });
    },

    updateArticle: function (id, body) {
      var payload = { id: id };
      if (body.title != null) payload.title = body.title;
      if (body.summary != null) payload.summary = body.summary;
      if (body.cover != null) payload.cover = body.cover;
      if (body.bodyHtml != null) payload.body_html = body.bodyHtml;
      if (body.status != null) payload.status = body.status;
      if (body.visibility != null) payload.visibility = body.visibility;
      if (body.publishedAt != null) payload.published_at = body.publishedAt;
      return request('POST', '/api/articles/update', payload);
    },

    getComments: function (articleId) {
      return request('GET', '/api/articles/comments', null, { article_id: articleId });
    },

    addComment: function (articleId, content) {
      return request('POST', '/api/articles/comments', { article_id: articleId, content: content });
    },

    addReply: function (articleId, commentId, content, parentReplyId) {
      var body = { article_id: articleId, comment_id: commentId, content: content };
      if (parentReplyId) body.parent_reply_id = parentReplyId;
      return request('POST', '/api/articles/comments/replies', body);
    },

    recordView: function (articleId) {
      return request('POST', '/api/articles/view', { article_id: articleId });
    },

    getHotRanking: function (type) {
      var map = { total: 1, week: 2, day: 3 };
      var t = map[String(type || 'total').toLowerCase()] || 1;
      return request('GET', '/api/articles/ranking', null, { type: t, limit: 10 });
    },

    /** 正文/编辑器视频：multipart，字段名 file；返回 data.url（mp4/webm/mov，最大约 80MB） */
    uploadEditorVideo: function (file) {
      var url = BASE + '/api/upload/editor-video';
      var fd = new FormData();
      fd.append('file', file);
      var token = getToken();
      var headers = {};
      if (token) headers['Authorization'] = 'Bearer ' + token;
      return fetch(url, { method: 'POST', headers: headers, body: fd }).then(function (response) {
        return response.text().then(function (text) {
          var res;
          try {
            res = text ? JSON.parse(text) : {};
          } catch (_) {
            throw new Error('响应解析失败');
          }
          if (typeof res.code !== 'number' || res.code !== 0) {
            var errMsg = res.msg != null && res.msg !== '' ? String(res.msg) : '上传失败';
            throw new Error(errMsg);
          }
          var data = res.data != null ? res.data : {};
          return toCamel(data);
        });
      });
    },

    /** 封面上传：multipart，字段名 file；返回 data.url */
    uploadArticleCover: function (file) {
      var url = BASE + '/api/upload/cover';
      var fd = new FormData();
      fd.append('file', file);
      var token = getToken();
      var headers = {};
      if (token) headers['Authorization'] = 'Bearer ' + token;
      return fetch(url, { method: 'POST', headers: headers, body: fd }).then(function (response) {
        return response.text().then(function (text) {
          var res;
          try {
            res = text ? JSON.parse(text) : {};
          } catch (_) {
            throw new Error('响应解析失败');
          }
          if (typeof res.code !== 'number' || res.code !== 0) {
            var errMsg = res.msg != null && res.msg !== '' ? String(res.msg) : '上传失败';
            throw new Error(errMsg);
          }
          var data = res.data != null ? res.data : {};
          return toCamel(data);
        });
      });
    },
  };
})();

/**
 * 需登录页调用：多次尝试打开登录弹窗（应对脚本时机、残留 token 导致仅依赖 getToken 不准等情况）。
 * 依赖 header-user 提供的 window.openBlogLogin；未就绪时退回 blog:openLogin 事件。
 */
(function () {
  window.blogTryOpenLogin = function () {
    function once() {
      try {
        if (typeof window.openBlogLogin === 'function') window.openBlogLogin();
        else window.dispatchEvent(new CustomEvent('blog:openLogin'));
      } catch (e) {}
    }
    once();
    setTimeout(once, 0);
    setTimeout(function () {
      var m = document.getElementById('auth-modal');
      if (!m || !m.classList.contains('is-open')) once();
    }, 160);
  };

  /** 未登录时拦截跳转到需登录页，只弹登录窗（捕获阶段，不依赖各页单独绑事件） */
  function blogTrimAuthToken() {
    try {
      if (!window.BlogAPI || typeof window.BlogAPI.getToken !== 'function') return '';
      return String(window.BlogAPI.getToken() || '').trim();
    } catch (e) {
      return '';
    }
  }

  document.addEventListener(
    'click',
    function (e) {
      if (e.defaultPrevented) return;
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      var el = e.target && e.target.closest ? e.target.closest('a[href]') : null;
      if (!el) return;
      var href = String(el.getAttribute('href') || '').trim();
      if (!href || href.toLowerCase().indexOf('javascript:') === 0) return;
      var pathOnly = href.split('#')[0].split('?')[0];
      var file = pathOnly.replace(/^.*\//, '') || pathOnly;
      if (
        file !== 'profile.html' &&
        file !== 'my-articles.html' &&
        file !== 'my-favorites.html' &&
        file !== 'publish.html'
      ) {
        return;
      }

      /* 一律先拦住默认跳转，验完登录再决定：避免先进页面再弹窗（含过期 token） */
      e.preventDefault();
      e.stopPropagation();

      var targetUrl = el.href;

      if (!blogTrimAuthToken()) {
        window.blogTryOpenLogin();
        return;
      }

      function go() {
        window.location.href = targetUrl;
      }

      if (typeof fetchUserInfo === 'function') {
        fetchUserInfo()
          .then(function (u) {
            if (u) go();
            else window.blogTryOpenLogin();
          })
          .catch(function () {
            window.blogTryOpenLogin();
          });
        return;
      }

      if (window.BlogAPI && typeof window.BlogAPI.getUserMe === 'function') {
        window.BlogAPI.getUserMe().then(function (d) {
          var user = d && d.user;
          if (user) go();
          else window.blogTryOpenLogin();
        }).catch(function () {
          window.blogTryOpenLogin();
        });
        return;
      }

      window.blogTryOpenLogin();
    },
    true
  );
})();
