(function () {
  var form = document.getElementById('publish-form');
  var titleInput = document.getElementById('publish-title');
  var summaryInput = document.getElementById('publish-summary');
  var coverInput = document.getElementById('publish-cover');
  var editorEl = document.getElementById('quill-editor');
  var submitBtn = document.getElementById('publish-submit');
  var draftBtn = document.getElementById('publish-draft');
  var cancelLink = document.getElementById('publish-cancel');
  var msgEl = document.getElementById('publish-msg');

  var quill = null;
  var editId = null;

  function getEditId() {
    var params = new URLSearchParams(location.search);
    var id = parseInt(params.get('id'), 10);
    return isNaN(id) ? null : id;
  }

  function timeStr() {
    var now = new Date();
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

  function showMsg(text, isError) {
    if (!msgEl) return;
    msgEl.textContent = text;
    msgEl.className = 'publish-msg' + (isError ? ' publish-msg-error' : ' publish-msg-ok');
  }

  function getFormData() {
    var title = titleInput ? titleInput.value.trim() : '';
    var summary = summaryInput ? summaryInput.value.trim() : '';
    var cover = coverInput ? coverInput.value.trim() || '📝' : '📝';
    var bodyHtml = quill ? quill.root.innerHTML : '';
    var bodyText = quill ? quill.getText().trim() : '';
    return { title: title, summary: summary, cover: cover, bodyHtml: bodyHtml, bodyText: bodyText };
  }

  function validateForPublish(data) {
    if (!data.title) {
      showMsg('请填写标题', true);
      if (titleInput) titleInput.focus();
      return false;
    }
    if (!data.summary) {
      showMsg('请填写简介', true);
      if (summaryInput) summaryInput.focus();
      return false;
    }
    if (!data.bodyText) {
      showMsg('请填写正文', true);
      if (quill) quill.focus();
      return false;
    }
    return true;
  }

  function validateForDraft(data) {
    if (!data.title && !data.bodyText) {
      showMsg('请至少填写标题或正文', true);
      return false;
    }
    return true;
  }

  if (coverInput) {
    coverInput.addEventListener('input', function () {
      var el = document.getElementById('cover-preview');
      if (el) el.textContent = coverInput.value.trim() || '📝';
    });
  }

  if (editorEl) {
    quill = new Quill('#quill-editor', {
      theme: 'snow',
      placeholder: '开始写作… 支持加粗、标题、列表等格式',
      modules: {
        toolbar: [
          [{ header: [1, 2, 3, false] }],
          ['bold', 'italic', 'underline', 'strike'],
          [{ list: 'ordered' }, { list: 'bullet' }],
          ['blockquote', 'code-block'],
          ['link'],
          ['clean'],
        ],
      },
    });
  }

  editId = getEditId();
  if (cancelLink) {
    cancelLink.href = editId ? 'my-articles.html' : 'index.html';
  }

  var loadedArticle = null;

  fetchUserInfo().then(function (user) {
    if (editId && typeof getArticle === 'function') {
      getArticle(editId).then(function (result) {
        var article = result && result.article;
        var bodyHtml = (result && result.bodyHtml) || '';
        if (article && (article.author || {}).name === (user && user.nickname)) {
          loadedArticle = article;
          document.title = '编辑文章 - 技术博客';
          var titleH1 = document.getElementById('publish-page-title');
          if (titleH1) titleH1.textContent = '编辑文章';
          if (titleInput) titleInput.value = article.title || '';
          if (summaryInput) summaryInput.value = article.summary || '';
          if (coverInput) {
            coverInput.value = article.cover || '';
            var prev = document.getElementById('cover-preview');
            if (prev) prev.textContent = (article.cover || '📝').trim() || '📝';
          }
          if (quill && bodyHtml) quill.root.innerHTML = bodyHtml;
        } else {
          editId = null;
          if (article) showMsg('只能编辑自己的文章', true);
        }
        bindSubmitHandlers(user);
      }).catch(function () { showMsg('加载文章失败', true); bindSubmitHandlers(user); });
    } else {
      bindSubmitHandlers(user);
    }
  });

  function bindSubmitHandlers(user) {
    if (form && submitBtn) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var data = getFormData();
        if (!validateForPublish(data)) return;
        submitBtn.disabled = true;
        var art = {
          title: data.title,
          summary: data.summary,
          author: { name: (user && user.nickname) || '匿名', avatar: (user && user.avatar) || '👤' },
          cover: data.cover,
        };
        submitBtn.disabled = true;
        if (editId) {
          art.publishedAt = (loadedArticle && loadedArticle.publishedAt) || timeStr();
          updateArticle(editId, art, data.bodyHtml, 'published').then(function () {
            showMsg('发布成功，正在跳转到我的文章…');
            setTimeout(function () { location.href = 'my-articles.html'; }, 400);
          }).catch(function () { showMsg('发布失败，请重试', true); submitBtn.disabled = false; });
        } else {
          art.publishedAt = timeStr();
          addArticle(art, data.bodyHtml, 'published').then(function () {
            showMsg('发布成功，正在跳转到我的文章…');
            setTimeout(function () { location.href = 'my-articles.html'; }, 400);
          }).catch(function () { showMsg('发布失败，请重试', true); submitBtn.disabled = false; });
        }
      });
    }

    if (draftBtn) {
      draftBtn.addEventListener('click', function () {
        var data = getFormData();
        if (!validateForDraft(data)) return;
        draftBtn.disabled = true;
        var art = {
          title: data.title || '未命名草稿',
          summary: data.summary || '',
          author: { name: (user && user.nickname) || '匿名', avatar: (user && user.avatar) || '👤' },
          cover: data.cover,
        };
        if (editId) {
          art.publishedAt = (loadedArticle && loadedArticle.publishedAt) ? loadedArticle.publishedAt : timeStr();
          updateArticle(editId, art, data.bodyHtml, 'draft').then(function () {
            showMsg('草稿已保存');
            setTimeout(function () { location.href = 'my-articles.html'; }, 600);
          }).catch(function () { showMsg('保存失败，请重试', true); draftBtn.disabled = false; });
        } else {
          art.publishedAt = timeStr();
          addArticle(art, data.bodyHtml, 'draft').then(function () {
            showMsg('草稿已保存，正在跳转到我的文章…');
            setTimeout(function () { location.href = 'my-articles.html'; }, 600);
          }).catch(function () { showMsg('保存失败，请重试', true); draftBtn.disabled = false; });
        }
      });
    }
  }
})();
