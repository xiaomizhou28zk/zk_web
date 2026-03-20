(function () {
  if (!window.BlogAPI || !window.BlogAPI.getToken || !window.BlogAPI.getToken()) {
    location.href = 'index.html?needLogin=1';
    return;
  }
  var loadingEl = document.getElementById('profile-loading');
  var cardEl = document.getElementById('profile-card');
  var cardAvatar = document.getElementById('card-avatar');
  var cardNickname = document.getElementById('card-nickname');
  var cardBio = document.getElementById('card-bio');

  function escapeHtml(s) {
    var div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }

  function setAvatarEl(el, avatar) {
    if (!el) return;
    var a = (avatar != null && String(avatar).trim()) ? String(avatar).trim() : '👤';
    if (/^https?:\/\/.+/i.test(a)) {
      var src = a.replace(/"/g, '&quot;');
      el.innerHTML = '<img class="user-avatar-img" src="' + src + '" alt="" referrerpolicy="no-referrer" loading="lazy" />';
    } else {
      el.textContent = a;
    }
  }

  fetchUserInfo()
    .then(function (u) {
      if (loadingEl) loadingEl.style.display = 'none';
      if (cardEl) cardEl.style.display = 'flex';
      setAvatarEl(cardAvatar, u && u.avatar);
      if (cardNickname) cardNickname.textContent = u.nickname || '未设置昵称';
      if (cardBio) {
        cardBio.textContent = escapeHtml(u.bio || '');
        cardBio.style.display = u.bio ? 'block' : 'none';
      }
    })
    .catch(function () {
      if (loadingEl) loadingEl.textContent = '加载失败，请稍后再试';
    });
})();
