(function () {
  var el = document.getElementById('header-user');
  if (!el) return;

  function escapeHtml(s) {
    var div = document.createElement('div');
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

  function renderTrigger(u) {
    var rawAvatar = u ? (u.avatar || '👤') : '👤';
    var avatarInner = avatarHtml(rawAvatar);
    var nick = u && u.nickname ? escapeHtml(u.nickname) : '未登录';
    var bio = u && u.bio ? escapeHtml(u.bio) : '';
    var actions =
      '<a href="profile.html" class="popover-link">个人资料</a>' +
      '<a href="my-articles.html" class="popover-link">我的文章</a>';
    if (u) {
      actions += '<button type="button" class="popover-btn popover-btn-logout">退出</button>';
    } else {
      actions += '<button type="button" class="popover-btn popover-btn-login">登录</button>';
      actions += '<button type="button" class="popover-btn popover-btn-register">注册</button>';
    }
    el.innerHTML =
      '<button type="button" class="header-user-trigger" aria-expanded="false" aria-haspopup="true" aria-controls="header-user-popover">' +
      '<span class="header-user-avatar">' + avatarInner + '</span>' +
      '<span class="header-user-nickname">' + nick + '</span>' +
      '</button>' +
      '<div class="header-user-popover" id="header-user-popover" role="dialog" aria-label="用户菜单" hidden>' +
      '<div class="popover-user">' +
      '<span class="popover-avatar" id="popover-avatar">' + avatarInner + '</span>' +
      '<span class="popover-nickname" id="popover-nickname">' + nick + '</span>' +
      '<p class="popover-bio" id="popover-bio">' + bio + '</p>' +
      '</div>' +
      '<div class="popover-actions">' + actions + '</div>' +
      '</div>';
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
    var u = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
    if (u) {
      renderTrigger(u);
      bindPopoverAndAuth();
    }
    fetchUserInfo().then(function (u2) {
      renderTrigger(u2 || u);
      bindPopoverAndAuth();
    });
  }

  function bindPopoverAndAuth() {
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
          location.href = 'index.html?needLogin=1';
        }
      });
    }
    if (myArticlesLink) {
      myArticlesLink.addEventListener('click', function (e) {
        if (!window.BlogAPI || !window.BlogAPI.getToken || !window.BlogAPI.getToken()) {
          e.preventDefault();
          location.href = 'index.html?needLogin=1';
        }
      });
    }
  }

  function bindAuthModal() {
    var modal = document.getElementById('auth-modal');
    if (!modal) return;
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
          }).catch(function (err) {
            msgEl.textContent = (err && err.message) || '登录失败';
            msgEl.className = 'auth-msg auth-msg-error';
          });
        } else {
          setCurrentUser({ nickname: account.indexOf('@') !== -1 ? account.split('@')[0] : account, avatar: '👤', bio: '' });
          closeModal();
          refreshHeader();
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
          }).catch(function (err) {
            msgEl.textContent = (err && err.message) || '注册失败';
            msgEl.className = 'auth-msg auth-msg-error';
          });
        } else {
          setCurrentUser({ nickname: nickname, avatar: '👤', bio: '' });
          closeModal();
          refreshHeader();
        }
      });
    }
  }

  (function bindPublishLink() {
    var publishLink = document.querySelector('.nav-add-dropdown a[href="publish.html"]');
    if (publishLink) {
      publishLink.addEventListener('click', function (e) {
        if (!window.BlogAPI || !window.BlogAPI.getToken || !window.BlogAPI.getToken()) {
          e.preventDefault();
          location.href = 'index.html?needLogin=1';
        }
      });
    }
  })();

  window.addEventListener('blog:openLogin', function () {
    ensureAuthModal();
    openAuthModal('login');
  });

  el.textContent = '加载中…';
  fetchUserInfo()
    .then(function (u) {
      renderTrigger(u);
      bindPopoverAndAuth();
      ensureAuthModal();
      bindAuthModal();
      if (typeof location !== 'undefined' && location.search && location.search.indexOf('needLogin=1') !== -1) {
        openAuthModal('login');
      }
    })
    .catch(function () {
      renderTrigger(null);
      bindPopoverAndAuth();
      ensureAuthModal();
      bindAuthModal();
      if (typeof location !== 'undefined' && location.search && location.search.indexOf('needLogin=1') !== -1) {
        openAuthModal('login');
      } else {
        el.textContent = '加载失败';
      }
    });
})();
