/**
 * 全局配置：接口 base URL。页面与 API 同机部署时默认用当前站点 origin，避免改端口要改配置。
 */
(function () {
  if (window.BLOG_API_BASE != null && window.BLOG_API_BASE !== '') return;
  try {
    if (typeof location !== 'undefined' && /^https?:$/i.test(location.protocol)) {
      window.BLOG_API_BASE = location.origin;
      return;
    }
  } catch (_) {}
  window.BLOG_API_BASE = 'http://127.0.0.1:8080';
})();
