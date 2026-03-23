(function () {
  var el = document.getElementById('header-user');

  function escapeHtml(s) {
    var div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }

  function isAvatarImageUrl(avatar) {
    var a = avatar != null ? String(avatar).trim() : '';
    return /^https?:\/\/.+/i.test(a);
  }

  /** 头像：http(s) 图片地址用 img，否则按 emoji/文本展示（顶栏不用 lazy，避免晚一拍才出现） */
  function avatarHtml(avatar) {
    var a = avatar != null ? String(avatar).trim() : '';
    if (!a) a = '👤';
    if (/^https?:\/\/.+/i.test(a)) {
      var src = a.replace(/"/g, '&quot;');
      return (
        '<img class="user-avatar-img" src="' +
        src +
        '" alt="" referrerpolicy="no-referrer" loading="eager" decoding="async" />'
      );
    }
    return escapeHtml(a);
  }

  /** 用于判断顶栏展示是否需整段替换（相同则跳过重绘，避免头像 img 反复卸载/重载闪烁） */
  var lastUserHeaderFingerprint = '';

  function userHeaderFingerprint(u) {
    if (!u) return '\0guest';
    var id = u.id != null ? String(u.id) : '';
    return [id, u.nickname || '', String(u.avatar || ''), u.bio || ''].join('\0');
  }

  function wireHeaderAvatarImages(root) {
    if (!root) return;
    var imgs = root.querySelectorAll('.user-avatar-img');
    imgs.forEach(function (img) {
      img.classList.remove('is-loaded');
      if (img.complete && img.naturalWidth > 0) {
        img.classList.add('is-loaded');
      } else {
        img.addEventListener('load', function onLoad() {
          img.removeEventListener('load', onLoad);
          img.classList.add('is-loaded');
        });
        img.addEventListener('error', function onErr() {
          img.removeEventListener('error', onErr);
          img.classList.add('is-loaded');
        });
      }
    });
  }

  /** @returns {boolean} 是否执行了 DOM 更新（为 true 时需 bindPopoverAndAuth） */
  function renderTrigger(u) {
    if (!el) return false;
    var fp = userHeaderFingerprint(u);
    if (fp === lastUserHeaderFingerprint && el.querySelector('.header-user-trigger')) {
      return false;
    }
    lastUserHeaderFingerprint = fp;

    var rawAvatar = u ? (u.avatar || '👤') : '👤';
    var avatarInner = avatarHtml(rawAvatar);
    var avatarPhotoClass = isAvatarImageUrl(rawAvatar) ? ' header-user-avatar--photo' : '';
    var popoverPhotoClass = isAvatarImageUrl(rawAvatar) ? ' popover-avatar--photo' : '';
    var nick = u && u.nickname ? escapeHtml(u.nickname) : '未登录';
    var bio = u && u.bio ? escapeHtml(u.bio) : '';
    var actions =
      '<a href="profile.html" class="popover-link">个人资料</a>' +
      '<a href="my-articles.html" class="popover-link">我的文章</a>' +
      '<a href="my-favorites.html" class="popover-link">我的收藏</a>';
    if (u) {
      actions += '<button type="button" class="popover-btn popover-btn-logout">退出</button>';
    } else {
      actions += '<button type="button" class="popover-btn popover-btn-login">登录</button>';
      actions += '<button type="button" class="popover-btn popover-btn-register">注册</button>';
    }
    el.innerHTML =
      '<button type="button" class="header-user-trigger" aria-expanded="false" aria-haspopup="true" aria-controls="header-user-popover">' +
      '<span class="header-user-avatar' + avatarPhotoClass + '">' + avatarInner + '</span>' +
      '<span class="header-user-nickname">' + nick + '</span>' +
      '</button>' +
      '<div class="header-user-popover" id="header-user-popover" role="dialog" aria-label="用户菜单" hidden>' +
      '<div class="popover-user">' +
      '<span class="popover-avatar' + popoverPhotoClass + '" id="popover-avatar">' + avatarInner + '</span>' +
      '<span class="popover-nickname" id="popover-nickname">' + nick + '</span>' +
      '<p class="popover-bio" id="popover-bio">' + bio + '</p>' +
      '</div>' +
      '<div class="popover-actions">' + actions + '</div>' +
      '</div>';
    wireHeaderAvatarImages(el);
    return true;
  }

  function ensureAuthModal() {
    var existing = document.getElementById('auth-modal');
    if (existing) return existing;
    var modal = document.createElement('div');
    modal.id = 'auth-modal';
    modal.className = 'auth-modal';
    modal.setAttribute('aria-hidden', 'true');
    modal.innerHTML =
      '<div class="auth-modal-backdrop" id="auth-modal-backdrop"></div>' +
      '<div class="auth-modal-box" role="dialog" aria-labelledby="auth-modal-title" aria-modal="true">' +
      '<div class="auth-modal-header">' +
      '<h2 id="auth-modal-title" class="auth-modal-title">登录</h2>' +
      '<button type="button" class="auth-modal-close" aria-label="关闭">&times;</button>' +
      '</div>' +
      '<div class="auth-tabs">' +
      '<button type="button" class="auth-tab is-active" data-tab="login">登录</button>' +
      '<button type="button" class="auth-tab" data-tab="register">注册</button>' +
      '</div>' +
      '<form id="auth-login-form" class="auth-form auth-form-login">' +
      '<div class="auth-field">' +
      '<label for="auth-login-account">账号或邮箱</label>' +
      '<input type="text" id="auth-login-account" class="auth-input" placeholder="请输入账号或邮箱" autocomplete="username">' +
      '</div>' +
      '<div class="auth-field">' +
      '<label for="auth-login-password">密码</label>' +
      '<input type="password" id="auth-login-password" class="auth-input" placeholder="请输入密码" autocomplete="current-password">' +
      '</div>' +
      '<p id="auth-login-msg" class="auth-msg" aria-live="polite"></p>' +
      '<button type="submit" class="auth-submit btn-primary">登录</button>' +
      '</form>' +
      '<form id="auth-register-form" class="auth-form auth-form-register" style="display:none">' +
      '<div class="auth-field">' +
      '<label for="auth-register-nickname">昵称</label>' +
      '<input type="text" id="auth-register-nickname" class="auth-input" placeholder="请输入昵称" autocomplete="nickname">' +
      '</div>' +
      '<div class="auth-field">' +
      '<label for="auth-register-account">账号或邮箱</label>' +
      '<input type="text" id="auth-register-account" class="auth-input" placeholder="请输入账号或邮箱" autocomplete="username">' +
      '</div>' +
      '<div class="auth-field">' +
      '<label for="auth-register-password">密码</label>' +
      '<input type="password" id="auth-register-password" class="auth-input" placeholder="请输入密码" autocomplete="new-password">' +
      '</div>' +
      '<div class="auth-field">' +
      '<label for="auth-register-confirm">确认密码</label>' +
      '<input type="password" id="auth-register-confirm" class="auth-input" placeholder="请再次输入密码" autocomplete="new-password">' +
      '</div>' +
      '<p id="auth-register-msg" class="auth-msg" aria-live="polite"></p>' +
      '<button type="submit" class="auth-submit btn-primary">注册</button>' +
      '</form>' +
      '</div>';
    document.body.appendChild(modal);
    return modal;
  }

  function openAuthModal(tab) {
    var modal = ensureAuthModal();
    var box = modal.querySelector('.auth-modal-box');
    var loginForm = document.getElementById('auth-login-form');
    var registerForm = document.getElementById('auth-register-form');
    var title = document.getElementById('auth-modal-title');
    modal.setAttribute('aria-hidden', 'false');
    modal.classList.add('is-open');
    if (tab === 'register') {
      title.textContent = '注册';
      loginForm.style.display = 'none';
      registerForm.style.display = 'block';
      modal.querySelectorAll('.auth-tab').forEach(function (t) {
        t.classList.toggle('is-active', t.getAttribute('data-tab') === 'register');
      });
    } else {
      title.textContent = '登录';
      loginForm.style.display = 'block';
      registerForm.style.display = 'none';
      modal.querySelectorAll('.auth-tab').forEach(function (t) {
        t.classList.toggle('is-active', t.getAttribute('data-tab') === 'login');
      });
    }
    if (tab === 'register' && document.getElementById('auth-register-nickname')) {
      document.getElementById('auth-register-nickname').focus();
    } else if (document.getElementById('auth-login-account')) {
      document.getElementById('auth-login-account').focus();
    }
  }

  function closeAuthModal() {
    var modal = document.getElementById('auth-modal');
    if (!modal) return;
    modal.setAttribute('aria-hidden', 'true');
    modal.classList.remove('is-open');
  }

  function refreshHeader() {
    if (!el) return;
    var u = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
    if (u) {
      if (renderTrigger(u)) bindPopoverAndAuth();
    }
    fetchUserInfo().then(function (u2) {
      if (renderTrigger(u2 || u)) bindPopoverAndAuth();
    });
  }

  function bindPopoverAndAuth() {
    if (!el) return;
    var trigger = el.querySelector('.header-user-trigger');
    var popover = document.getElementById('header-user-popover');
    if (!popover) return;

    function open() {
      if (!popover) return;
      popover.hidden = false;
      if (trigger) trigger.setAttribute('aria-expanded', 'true');
      document.addEventListener('click', closeOnOutside);
    }

    function close() {
      if (!popover) return;
      popover.hidden = true;
      if (trigger) trigger.setAttribute('aria-expanded', 'false');
      document.removeEventListener('click', closeOnOutside);
    }

    function closeOnOutside(e) {
      if (el && el.contains(e.target)) return;
      close();
    }

    if (trigger) {
      trigger.addEventListener('click', function (e) {
        e.stopPropagation();
        if (popover && popover.hidden) open(); else close();
      });
    }

    el.querySelector('.popover-btn-login') && el.querySelector('.popover-btn-login').addEventListener('click', function (e) {
      e.preventDefault();
      close();
      openAuthModal('login');
    });
    el.querySelector('.popover-btn-register') && el.querySelector('.popover-btn-register').addEventListener('click', function (e) {
      e.preventDefault();
      close();
      openAuthModal('register');
    });
    el.querySelector('.popover-btn-logout') && el.querySelector('.popover-btn-logout').addEventListener('click', function (e) {
      e.preventDefault();
      close();
      logout();
      refreshHeader();
    });
    var profileLink = el.querySelector('a[href="profile.html"]');
    var myArticlesLink = el.querySelector('a[href="my-articles.html"]');
    if (profileLink) {
      profileLink.addEventListener('click', function (e) {
        if (!window.BlogAPI || !window.BlogAPI.getToken || !window.BlogAPI.getToken()) {
          e.preventDefault();
          close();
          if (typeof window.blogTryOpenLogin === 'function') window.blogTryOpenLogin();
          else if (typeof window.openBlogLogin === 'function') window.openBlogLogin();
          else window.dispatchEvent(new CustomEvent('blog:openLogin'));
        }
      });
    }
    if (myArticlesLink) {
      myArticlesLink.addEventListener('click', function (e) {
        if (!window.BlogAPI || !window.BlogAPI.getToken || !window.BlogAPI.getToken()) {
          e.preventDefault();
          close();
          if (typeof window.blogTryOpenLogin === 'function') window.blogTryOpenLogin();
          else if (typeof window.openBlogLogin === 'function') window.openBlogLogin();
          else window.dispatchEvent(new CustomEvent('blog:openLogin'));
        }
      });
    }
    var myFavLink = el.querySelector('a[href="my-favorites.html"]');
    if (myFavLink) {
      myFavLink.addEventListener('click', function (e) {
        if (!window.BlogAPI || !window.BlogAPI.getToken || !window.BlogAPI.getToken()) {
          e.preventDefault();
          close();
          if (typeof window.blogTryOpenLogin === 'function') window.blogTryOpenLogin();
          else if (typeof window.openBlogLogin === 'function') window.openBlogLogin();
          else window.dispatchEvent(new CustomEvent('blog:openLogin'));
        }
      });
    }
  }

  var authModalEventsBound = false;

  function bindAuthModal() {
    var modal = document.getElementById('auth-modal');
    if (!modal || authModalEventsBound) return;
    authModalEventsBound = true;
    var backdrop = document.getElementById('auth-modal-backdrop');
    var closeBtn = modal.querySelector('.auth-modal-close');
    var loginForm = document.getElementById('auth-login-form');
    var registerForm = document.getElementById('auth-register-form');

    function closeModal() {
      closeAuthModal();
    }

    if (backdrop) backdrop.addEventListener('click', closeModal);
    if (closeBtn) closeBtn.addEventListener('click', closeModal);

    modal.querySelectorAll('.auth-tab').forEach(function (tab) {
      tab.addEventListener('click', function () {
        var t = this.getAttribute('data-tab');
        openAuthModal(t);
      });
    });

    if (loginForm) {
      loginForm.addEventListener('submit', function (e) {
        e.preventDefault();
        var account = (document.getElementById('auth-login-account').value || '').trim();
        var password = document.getElementById('auth-login-password').value;
        var msgEl = document.getElementById('auth-login-msg');
        msgEl.textContent = '';
        msgEl.className = 'auth-msg';
        if (!account) {
          msgEl.textContent = '请输入账号或邮箱';
          msgEl.className = 'auth-msg auth-msg-error';
          return;
        }
        if (!password) {
          msgEl.textContent = '请输入密码';
          msgEl.className = 'auth-msg auth-msg-error';
          return;
        }
        if (window.BlogAPI && typeof window.BlogAPI.login === 'function') {
          window.BlogAPI.login(account, password).then(function (d) {
            if (d.token && window.BlogAPI.setToken) window.BlogAPI.setToken(d.token);
            setCurrentUser(d.user || { nickname: account.indexOf('@') !== -1 ? account.split('@')[0] : account, avatar: '👤', bio: '' });
            closeModal();
            refreshHeader();
            window.dispatchEvent(new CustomEvent('blog:loginSuccess'));
          }).catch(function (err) {
            msgEl.textContent = (err && err.message) || '登录失败';
            msgEl.className = 'auth-msg auth-msg-error';
          });
        } else {
          setCurrentUser({ nickname: account.indexOf('@') !== -1 ? account.split('@')[0] : account, avatar: '👤', bio: '' });
          closeModal();
          refreshHeader();
          window.dispatchEvent(new CustomEvent('blog:loginSuccess'));
        }
      });
    }

    if (registerForm) {
      registerForm.addEventListener('submit', function (e) {
        e.preventDefault();
        var nickname = (document.getElementById('auth-register-nickname').value || '').trim();
        var account = (document.getElementById('auth-register-account').value || '').trim();
        var password = document.getElementById('auth-register-password').value;
        var confirm = document.getElementById('auth-register-confirm').value;
        var msgEl = document.getElementById('auth-register-msg');
        msgEl.textContent = '';
        msgEl.className = 'auth-msg';
        if (!nickname) {
          msgEl.textContent = '请输入昵称';
          msgEl.className = 'auth-msg auth-msg-error';
          return;
        }
        if (!account) {
          msgEl.textContent = '请输入账号或邮箱';
          msgEl.className = 'auth-msg auth-msg-error';
          return;
        }
        if (!password) {
          msgEl.textContent = '请输入密码';
          msgEl.className = 'auth-msg auth-msg-error';
          return;
        }
        if (password !== confirm) {
          msgEl.textContent = '两次输入的密码不一致';
          msgEl.className = 'auth-msg auth-msg-error';
          return;
        }
        if (window.BlogAPI && typeof window.BlogAPI.register === 'function') {
          window.BlogAPI.register(nickname, account, password).then(function (d) {
            if (d.token && window.BlogAPI.setToken) window.BlogAPI.setToken(d.token);
            setCurrentUser(d.user || { nickname: nickname, avatar: '👤', bio: '' });
            closeModal();
            refreshHeader();
            window.dispatchEvent(new CustomEvent('blog:loginSuccess'));
          }).catch(function (err) {
            msgEl.textContent = (err && err.message) || '注册失败';
            msgEl.className = 'auth-msg auth-msg-error';
          });
        } else {
          setCurrentUser({ nickname: nickname, avatar: '👤', bio: '' });
          closeModal();
          refreshHeader();
          window.dispatchEvent(new CustomEvent('blog:loginSuccess'));
        }
      });
    }
  }

  /** 打开登录弹窗（同步打开，避免 rAF/setTimeout 在部分环境下不触发导致「看起来没反应」） */
  function openBlogLoginModal() {
    ensureAuthModal();
    bindAuthModal();
    openAuthModal('login');
  }
  window.openBlogLogin = openBlogLoginModal;
  window.addEventListener('blog:openLogin', function () {
    openBlogLoginModal();
  });

  /* 写文章 publish.html：由 api.js 全局捕获统一拦跳转并弹登录窗（含过期 token） */

  window.addEventListener('blog:refreshHeader', function () {
    refreshHeader();
  });

  /* 尽早挂载登录弹窗；与 #header-user 无关，避免无顶栏页面无法弹窗 */
  ensureAuthModal();
  bindAuthModal();

  if (!el) return;

  /* 首屏直接渲染与最终接近的顶栏宽度，避免「空 → 加载中… → 按钮」两次变宽把中间搜索区挤偏 */
  var uInitial = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
  if (renderTrigger(uInitial)) bindPopoverAndAuth();

  fetchUserInfo()
    .then(function (u) {
      if (renderTrigger(u)) bindPopoverAndAuth();
      if (typeof location !== 'undefined' && location.search && location.search.indexOf('needLogin=1') !== -1) {
        openAuthModal('login');
      }
    })
    .catch(function () {
      if (renderTrigger(null)) bindPopoverAndAuth();
      if (typeof location !== 'undefined' && location.search && location.search.indexOf('needLogin=1') !== -1) {
        openAuthModal('login');
      }
    });
})();
