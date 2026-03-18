(function () {
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

  fetchUserInfo()
    .then(function (u) {
      if (loadingEl) loadingEl.style.display = 'none';
      if (cardEl) cardEl.style.display = 'flex';
      if (cardAvatar) cardAvatar.textContent = u.avatar || '👤';
      if (cardNickname) cardNickname.textContent = escapeHtml(u.nickname || '未设置昵称');
      if (cardBio) {
        cardBio.textContent = escapeHtml(u.bio || '');
        cardBio.style.display = u.bio ? 'block' : 'none';
      }
    })
    .catch(function () {
      if (loadingEl) loadingEl.textContent = '加载失败，请稍后再试';
    });
})();
