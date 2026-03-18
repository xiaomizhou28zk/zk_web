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
    if (token) opts.headers['Authorization'] = 'Bearer ' + token;
    if (body != null && method !== 'GET') opts.body = JSON.stringify(body);
    return fetch(url, opts)
      .then(function (res) {
        return res.json().catch(function () {
          return { code: res.status || -1, msg: '请求失败', data: null };
        });
      })
      .then(function (res) {
        var code = res.code != null ? res.code : res.status;
        if (code !== 0 && code !== 200) {
          var err = new Error(res.msg != null ? res.msg : '请求失败');
          err.code = code;
          throw err;
        }
        return toCamel(res.data != null ? res.data : {});
      });
  }

  window.BlogAPI = {
    getToken: getToken,
    setToken: setToken,

    getUserMe: function () {
      return request('GET', '/api/user/me');
    },

    login: function (account, password) {
      return request('POST', '/api/auth/login', { account: account, password: password });
    },

    register: function (nickname, account, password) {
      return request('POST', '/api/auth/register', { nickname: nickname, account: account, password: password });
    },

    logout: function () {
      return request('POST', '/api/auth/logout');
    },

    getArticles: function (params) {
      return request('GET', '/api/articles', null, {
        q: params && params.q,
        cursor: params && params.cursor,
        page_size: params && params.page_size,
      });
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
      return request('GET', '/api/articles/ranking', null, { type: type || 'total' });
    },
  };
})();
