(function () {
  var loadingEl = document.getElementById('profile-loading');
  var contentEl = document.getElementById('profile-content');
  var cardAvatar = document.getElementById('card-avatar');
  var cardNickname = document.getElementById('card-nickname');
  var cardBio = document.getElementById('card-bio');

  var form = document.getElementById('profile-form');
  var nicknameInput = document.getElementById('profile-nickname');
  var avatarText = document.getElementById('profile-avatar-text');
  var avatarPreview = document.getElementById('profile-avatar-preview');
  var avatarFile = document.getElementById('profile-avatar-file');
  var avatarUploadBtn = document.getElementById('profile-avatar-upload-btn');
  var saveBtn = document.getElementById('profile-save-btn');
  var formMsg = document.getElementById('profile-form-msg');

  var pwdModal = document.getElementById('profile-password-modal');
  var pwdBackdrop = document.getElementById('profile-password-backdrop');
  var pwdClose = document.getElementById('profile-password-close');
  var pwdCancel = document.getElementById('profile-password-cancel');
  var pwdForm = document.getElementById('profile-password-form');
  var pwdOld = document.getElementById('profile-old-password');
  var pwdNew = document.getElementById('profile-new-password');
  var pwdNew2 = document.getElementById('profile-new-password2');
  var pwdMsg = document.getElementById('profile-password-msg');
  var openPwdBtn = document.getElementById('profile-open-password-btn');

  var editModal = document.getElementById('profile-edit-modal');
  var editBackdrop = document.getElementById('profile-edit-backdrop');
  var editClose = document.getElementById('profile-edit-close');
  var editCancel = document.getElementById('profile-edit-cancel');
  var openEditBtn = document.getElementById('profile-open-edit-btn');

  /** @type {object|null} */
  var lastUser = null;

  function escapeHtml(s) {
    var div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }

  function setAvatarEl(el, avatar) {
    if (!el) return;
    var a = avatar != null && String(avatar).trim() ? String(avatar).trim() : '👤';
    if (/^https?:\/\/.+/i.test(a)) {
      var src = a.replace(/"/g, '&quot;');
      el.innerHTML = '<img class="user-avatar-img" src="' + src + '" alt="" referrerpolicy="no-referrer" loading="lazy" />';
    } else {
      el.textContent = a;
    }
  }

  function showFormMsg(text, isError) {
    if (!formMsg) return;
    formMsg.textContent = text || '';
    formMsg.className =
      'profile-msg profile-msg-modal' +
      (isError ? ' profile-msg-error' : text ? ' profile-msg-ok' : '');
  }

  function syncBodyOverflow() {
    var anyOpen =
      (editModal && editModal.classList.contains('is-open')) ||
      (pwdModal && pwdModal.classList.contains('is-open'));
    document.body.style.overflow = anyOpen ? 'hidden' : '';
  }

  function openEditModal() {
    if (!editModal) return;
    if (pwdModal && pwdModal.classList.contains('is-open')) closePasswordModal();
    if (lastUser) applyUserToForm(lastUser);
    showFormMsg('');
    editModal.classList.add('is-open');
    editModal.setAttribute('aria-hidden', 'false');
    syncBodyOverflow();
    window.setTimeout(function () {
      if (nicknameInput) nicknameInput.focus();
    }, 0);
  }

  function closeEditModal() {
    if (!editModal) return;
    editModal.classList.remove('is-open');
    editModal.setAttribute('aria-hidden', 'true');
    syncBodyOverflow();
  }

  function openPasswordModal() {
    if (!pwdModal) return;
    if (editModal && editModal.classList.contains('is-open')) closeEditModal();
    pwdModal.classList.add('is-open');
    pwdModal.setAttribute('aria-hidden', 'false');
    syncBodyOverflow();
    if (pwdMsg) {
      pwdMsg.textContent = '';
      pwdMsg.className = 'auth-msg';
    }
    if (pwdForm) pwdForm.reset();
    window.setTimeout(function () {
      if (pwdOld) pwdOld.focus();
    }, 0);
  }

  function closePasswordModal() {
    if (!pwdModal) return;
    pwdModal.classList.remove('is-open');
    pwdModal.setAttribute('aria-hidden', 'true');
    syncBodyOverflow();
  }

  function applyUserToCard(u) {
    setAvatarEl(cardAvatar, u && u.avatar);
    if (cardNickname) cardNickname.textContent = (u && u.nickname) || '未设置昵称';
    if (cardBio) {
      cardBio.textContent = escapeHtml((u && u.bio) || '');
      cardBio.style.display = u && u.bio ? 'block' : 'none';
    }
  }

  function applyUserToForm(u) {
    if (nicknameInput) nicknameInput.value = (u && u.nickname) || '';
    var av = (u && u.avatar) || '👤';
    if (avatarText) {
      if (/^https?:\/\//i.test(String(av))) {
        avatarText.value = String(av);
      } else {
        avatarText.value = av === '👤' ? '' : String(av);
      }
    }
    setAvatarEl(avatarPreview, av);
  }

  function readAvatarForSubmit() {
    var t = avatarText ? String(avatarText.value || '').trim() : '';
    if (t) return t;
    return '👤';
  }

  function refreshAvatarPreviewFromInput() {
    setAvatarEl(avatarPreview, readAvatarForSubmit());
  }

  /** 与后端 utf8.RuneCountInString 一致：按 Unicode 码点计数 */
  function nicknameRuneCount(s) {
    return Array.from(s || '').length;
  }

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
    if (loadingEl) {
      loadingEl.style.display = 'block';
      loadingEl.textContent = '请先登录后查看个人信息。';
    }
    if (contentEl) contentEl.style.display = 'none';
    window.addEventListener('blog:loginSuccess', function onLogin() {
      window.removeEventListener('blog:loginSuccess', onLogin);
      location.reload();
    });
  }

  if (avatarUploadBtn && avatarFile) {
    avatarUploadBtn.addEventListener('click', function () {
      avatarFile.click();
    });
    avatarFile.addEventListener('change', function () {
      var f = avatarFile.files && avatarFile.files[0];
      if (!f) return;
      if (!window.BlogAPI || typeof BlogAPI.uploadArticleCover !== 'function') {
        if (window.BlogToast) BlogToast.show('当前环境不支持上传');
        return;
      }
      BlogAPI.uploadArticleCover(f)
        .then(function (d) {
          var url = (d && (d.url || d.Url)) || '';
          if (!url) throw new Error('未返回地址');
          if (avatarText) avatarText.value = url;
          setAvatarEl(avatarPreview, url);
          if (window.BlogToast) BlogToast.show('头像已更新，请保存资料');
        })
        .catch(function (e) {
          if (window.BlogToast) BlogToast.show((e && e.message) || '上传失败');
        });
      avatarFile.value = '';
    });
  }

  if (avatarText) {
    avatarText.addEventListener('input', refreshAvatarPreviewFromInput);
    avatarText.addEventListener('blur', refreshAvatarPreviewFromInput);
  }

  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      showFormMsg('');
      var nick = nicknameInput ? String(nicknameInput.value || '').trim() : '';
      if (!nick) {
        showFormMsg('请填写昵称', true);
        return;
      }
      if (nicknameRuneCount(nick) > 15) {
        showFormMsg('昵称最多 15 个字', true);
        return;
      }
      if (!window.BlogAPI || typeof BlogAPI.updateProfile !== 'function') {
        showFormMsg('当前环境不支持保存', true);
        return;
      }
      if (saveBtn) saveBtn.disabled = true;
      var avatarVal = readAvatarForSubmit();
      BlogAPI.updateProfile(nick, avatarVal)
        .then(function (data) {
          var user = (data && data.user) || { nickname: nick, avatar: avatarVal };
          lastUser = user;
          if (typeof setCurrentUser === 'function') setCurrentUser(user);
          applyUserToCard(user);
          showFormMsg('已保存');
          if (window.BlogToast) BlogToast.show('资料已更新');
          window.dispatchEvent(new CustomEvent('blog:refreshHeader'));
          closeEditModal();
        })
        .catch(function (err) {
          showFormMsg((err && err.message) || '保存失败', true);
        })
        .finally(function () {
          if (saveBtn) saveBtn.disabled = false;
        });
    });
  }

  if (openEditBtn) openEditBtn.addEventListener('click', openEditModal);
  if (editBackdrop) editBackdrop.addEventListener('click', closeEditModal);
  if (editClose) editClose.addEventListener('click', closeEditModal);
  if (editCancel) editCancel.addEventListener('click', closeEditModal);

  if (openPwdBtn) openPwdBtn.addEventListener('click', openPasswordModal);
  if (pwdBackdrop) pwdBackdrop.addEventListener('click', closePasswordModal);
  if (pwdClose) pwdClose.addEventListener('click', closePasswordModal);
  if (pwdCancel) pwdCancel.addEventListener('click', closePasswordModal);

  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (editModal && editModal.classList.contains('is-open')) {
      e.preventDefault();
      closeEditModal();
      return;
    }
    if (pwdModal && pwdModal.classList.contains('is-open')) {
      e.preventDefault();
      closePasswordModal();
    }
  });

  var pwdRe = /^[a-zA-Z0-9!@#$%^&*()\-_=+?<>;:'",./\\|[\]{}]{6,50}$/;

  if (pwdForm) {
    pwdForm.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!pwdMsg) return;
      pwdMsg.textContent = '';
      pwdMsg.className = 'auth-msg';
      var o = pwdOld ? pwdOld.value : '';
      var n1 = pwdNew ? pwdNew.value : '';
      var n2 = pwdNew2 ? pwdNew2.value : '';
      if (!o || !n1 || !n2) {
        pwdMsg.textContent = '请填写完整';
        pwdMsg.className = 'auth-msg auth-msg-error';
        return;
      }
      if (n1 !== n2) {
        pwdMsg.textContent = '两次新密码不一致';
        pwdMsg.className = 'auth-msg auth-msg-error';
        return;
      }
      if (!pwdRe.test(n1)) {
        pwdMsg.textContent = '新密码需 6–50 位，且仅含允许的字符';
        pwdMsg.className = 'auth-msg auth-msg-error';
        return;
      }
      if (!window.BlogAPI || typeof BlogAPI.changePassword !== 'function') {
        pwdMsg.textContent = '当前环境不支持修改密码';
        pwdMsg.className = 'auth-msg auth-msg-error';
        return;
      }
      var submitBtn = document.getElementById('profile-password-submit');
      if (submitBtn) submitBtn.disabled = true;
      BlogAPI.changePassword(o, n1)
        .then(function () {
          if (window.BlogToast) BlogToast.show('密码已修改');
          closePasswordModal();
        })
        .catch(function (err) {
          pwdMsg.textContent = (err && err.message) || '修改失败';
          pwdMsg.className = 'auth-msg auth-msg-error';
        })
        .finally(function () {
          if (submitBtn) submitBtn.disabled = false;
        });
    });
  }

  if (!trimToken()) {
    showGuest();
  } else if (typeof fetchUserInfo === 'function') {
    fetchUserInfo()
      .then(function (u) {
        if (!u) {
          showGuest();
          return;
        }
        lastUser = u || null;
        if (loadingEl) loadingEl.style.display = 'none';
        if (contentEl) contentEl.style.display = 'block';
        applyUserToCard(u);
      })
      .catch(function () {
        if (loadingEl) loadingEl.textContent = '加载失败，请稍后再试';
      });
  } else {
    showGuest();
  }
})();
