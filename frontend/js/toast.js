/**
 * 简单全局 Toast，供 api.js 在 code !== 0 时提示错误
 */
(function () {
  var container = null;
  var hideTimer = null;

  function ensureContainer() {
    if (container) return container;
    container = document.createElement('div');
    container.id = 'blog-toast-root';
    container.setAttribute('aria-live', 'polite');
    document.body.appendChild(container);
    return container;
  }

  function show(message, durationMs) {
    var text = message != null ? String(message) : '';
    if (!text) text = '请求失败';
    var ms = durationMs != null ? durationMs : 3200;
    var root = ensureContainer();
    var el = document.createElement('div');
    el.className = 'blog-toast';
    el.textContent = text;
    root.appendChild(el);
    if (hideTimer) clearTimeout(hideTimer);
    hideTimer = setTimeout(function () {
      el.classList.add('blog-toast-out');
      setTimeout(function () {
        if (el.parentNode) el.parentNode.removeChild(el);
      }, 280);
    }, ms);
  }

  window.BlogToast = { show: show };
})();
