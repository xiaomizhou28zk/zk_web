(function () {
  if (!window.BlogAPI || !window.BlogAPI.getToken || !window.BlogAPI.getToken()) {
    location.href = 'index.html?needLogin=1';
    return;
  }
  var form = document.getElementById('publish-form');
  var titleInput = document.getElementById('publish-title');
  var summaryInput = document.getElementById('publish-summary');
  var coverHidden = document.getElementById('publish-cover');
  var coverFile = document.getElementById('cover-file');
  var coverPickBtn = document.getElementById('cover-pick-btn');
  var coverClearBtn = document.getElementById('cover-clear-btn');
  var coverPreviewBox = document.getElementById('cover-preview-box');
  var coverPreviewImg = document.getElementById('cover-preview-img');
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

  function isHttpCover(val) {
    return val && /^https?:\/\//i.test(String(val).trim());
  }

  function syncCoverPreview() {
    var val = coverHidden ? coverHidden.value.trim() : '';
    if (!coverPreviewBox || !coverPreviewImg) return;
    var ph = document.getElementById('cover-preview-placeholder');
    if (isHttpCover(val)) {
      coverPreviewImg.src = val;
      coverPreviewImg.classList.add('is-visible');
      coverPreviewBox.classList.add('has-image');
      coverPreviewImg.referrerPolicy = 'no-referrer';
      if (ph) ph.textContent = '📝';
    } else {
      coverPreviewImg.removeAttribute('src');
      coverPreviewImg.classList.remove('is-visible');
      coverPreviewBox.classList.remove('has-image');
      if (ph) ph.textContent = val || '📝';
    }
  }

  function setCoverUrl(url) {
    if (coverHidden) coverHidden.value = url || '';
    syncCoverPreview();
  }

  function clearCover() {
    if (coverFile) coverFile.value = '';
    setCoverUrl('');
  }

  if (coverPickBtn && coverFile) {
    coverPickBtn.addEventListener('click', function () {
      coverFile.click();
    });
  }

  if (coverClearBtn) {
    coverClearBtn.addEventListener('click', function () {
      clearCover();
    });
  }

  if (coverFile && window.BlogAPI && typeof BlogAPI.uploadArticleCover === 'function') {
    coverFile.addEventListener('change', function () {
      var f = coverFile.files && coverFile.files[0];
      if (!f) return;
      var prevText = coverPickBtn ? coverPickBtn.textContent : '';
      if (coverPickBtn) {
        coverPickBtn.disabled = true;
        coverPickBtn.textContent = '上传中…';
      }
      BlogAPI.uploadArticleCover(f)
        .then(function (d) {
          var u = (d && (d.url || d.Url)) || '';
          if (!u) throw new Error('未返回图片地址');
          setCoverUrl(u);
          showMsg('封面上传成功');
        })
        .catch(function (e) {
          var m = e && e.message ? e.message : '上传失败';
          if (window.BlogToast && BlogToast.show) BlogToast.show(m);
          showMsg(m, true);
        })
        .then(function () {
          coverFile.value = '';
          if (coverPickBtn) {
            coverPickBtn.disabled = false;
            coverPickBtn.textContent = prevText || '上传图片';
          }
        });
    });
  }

  function getFormData() {
    var title = titleInput ? titleInput.value.trim() : '';
    var summary = summaryInput ? summaryInput.value.trim() : '';
    var coverRaw = coverHidden ? coverHidden.value.trim() : '';
    var cover = coverRaw !== '' ? coverRaw : '📝';
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

  function escapeAttr(s) {
    var d = document.createElement('div');
    d.textContent = s != null ? String(s) : '';
    return d.innerHTML.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function parseYouTubeId(url) {
    var s = String(url).trim();
    var m = s.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
    if (m) return m[1];
    m = s.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
    if (m) return m[1];
    m = s.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/);
    if (m) return m[1];
    return null;
  }

  function parseBilibiliBvid(url) {
    var s = String(url).trim();
    var m = s.match(/BV[0-9A-Za-z]{10}/);
    if (m) return m[0];
    return null;
  }

  /** 生成视频块内部 HTML（仅用于可信的嵌入结构） */
  function buildVideoEmbedInner(url) {
    url = String(url || '').trim();
    if (!url) return '';
    var yid = parseYouTubeId(url);
    if (yid) {
      return (
        '<iframe class="article-embed-iframe" width="560" height="315" src="https://www.youtube.com/embed/' +
        yid +
        '" frameborder="0" allowfullscreen allow="fullscreen"></iframe>'
      );
    }
    var bv = parseBilibiliBvid(url);
    if (bv) {
      return (
        '<iframe class="article-embed-iframe bilibili-player" src="https://player.bilibili.com/player.html?bvid=' +
        bv +
        '&amp;high_quality=1" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>'
      );
    }
    var safe = escapeAttr(url);
    return '<video class="article-body-video" controls playsinline preload="metadata" src="' + safe + '"></video>';
  }

  /** 扩展 Quill 图片：支持 { src, width } 与 style.width，便于正文调宽度并随 HTML 保存 */
  function patchQuillImageFormat(Quill) {
    var ImageBlot = Quill.import('formats/image');
    if (!ImageBlot || ImageBlot.__blogImageWidthPatched) return;
    ImageBlot.__blogImageWidthPatched = true;
    var _create = ImageBlot.create;
    ImageBlot.create = function (value) {
      if (value && typeof value === 'object' && value.src != null) {
        var node = _create.call(ImageBlot, value.src);
        if (value.width) {
          node.style.width = typeof value.width === 'number' ? value.width + 'px' : String(value.width);
          node.style.height = 'auto';
        }
        return node;
      }
      return _create.call(ImageBlot, value);
    };
    var _value = ImageBlot.value;
    ImageBlot.value = function (domNode) {
      var w = domNode.style && domNode.style.width;
      if (w) {
        return { src: domNode.getAttribute('src') || '', width: w };
      }
      return _value.call(ImageBlot, domNode);
    };
  }

  function setupEditorImageResizeUI(quillRef, editorRoot) {
    if (!quillRef || !editorRoot) return;

    var scrollParent = editorRoot.parentElement;

    var resetBtn = document.createElement('button');
    resetBtn.type = 'button';
    resetBtn.className = 'editor-image-reset-btn';
    resetBtn.textContent = '还原';
    resetBtn.setAttribute('title', '恢复为默认宽度');
    resetBtn.hidden = true;

    var handle = document.createElement('div');
    handle.className = 'editor-image-resize-handle';
    handle.setAttribute('title', '拖拽调整宽度');
    handle.setAttribute('aria-hidden', 'true');
    handle.hidden = true;

    var currentImg = null;
    var isDragging = false;
    var dragCleanup = null;

    function endDrag() {
      if (typeof dragCleanup === 'function') {
        dragCleanup();
        dragCleanup = null;
      }
      isDragging = false;
      document.body.style.userSelect = '';
    }

    function hide() {
      if (isDragging && currentImg && quillRef) {
        endDrag();
        var blotCommit = Quill.find(currentImg);
        if (blotCommit) {
          var maxC = Math.max(80, Math.floor(editorRoot.clientWidth));
          var minC = 48;
          var px = Math.min(maxC, Math.max(minC, Math.round(currentImg.offsetWidth)));
          applyWidth(px + 'px');
        }
      } else {
        endDrag();
      }
      if (currentImg) {
        currentImg.classList.remove('editor-image-resize-active');
      }
      resetBtn.hidden = true;
      handle.hidden = true;
      currentImg = null;
      document.removeEventListener('mousedown', onDocPointer, true);
      window.removeEventListener('scroll', position, true);
      window.removeEventListener('resize', position);
      if (scrollParent) scrollParent.removeEventListener('scroll', position, true);
    }

    function onDocPointer(e) {
      if (isDragging) return;
      if (e.target.closest && e.target.closest('.editor-image-resize-handle')) return;
      if (e.target.closest && e.target.closest('.editor-image-reset-btn')) return;
      if (editorRoot.contains(e.target) && e.target.tagName === 'IMG') return;
      if (!handle.hidden || !resetBtn.hidden) hide();
    }

    function positionHandle() {
      if (!currentImg || handle.hidden) return;
      var r = currentImg.getBoundingClientRect();
      handle.style.position = 'fixed';
      handle.style.zIndex = '341';
      handle.style.left = r.right - 2 + 'px';
      handle.style.top = r.bottom - 2 + 'px';
    }

    function positionResetBtn() {
      if (!currentImg || resetBtn.hidden) return;
      var r = currentImg.getBoundingClientRect();
      resetBtn.style.position = 'fixed';
      resetBtn.style.zIndex = '342';
      resetBtn.style.left = r.left + r.width / 2 + 'px';
      resetBtn.style.top = r.top + r.height / 2 + 'px';
    }

    function position() {
      positionHandle();
      positionResetBtn();
    }

    function syncResetBtnVisibility() {
      if (!currentImg) return;
      var has =
        currentImg.style &&
        currentImg.style.width &&
        String(currentImg.style.width).trim();
      resetBtn.hidden = !has;
    }

    function showFor(img) {
      currentImg = img;
      currentImg.classList.add('editor-image-resize-active');
      handle.hidden = false;
      syncResetBtnVisibility();
      if (!resetBtn.parentNode) document.body.appendChild(resetBtn);
      if (!handle.parentNode) document.body.appendChild(handle);
      window.requestAnimationFrame(function () {
        position();
        window.requestAnimationFrame(position);
      });
      document.addEventListener('mousedown', onDocPointer, true);
      window.addEventListener('scroll', position, true);
      window.addEventListener('resize', position);
      if (scrollParent) scrollParent.addEventListener('scroll', position, true);
    }

    function applyWidth(w) {
      if (!currentImg || !quillRef) return;
      var blot = Quill.find(currentImg);
      if (!blot) return;
      var index = quillRef.getIndex(blot);
      var srcAttr = currentImg.getAttribute('src') || '';
      quillRef.deleteText(index, 1, 'user');
      if (w) {
        quillRef.insertEmbed(index, 'image', { src: srcAttr, width: w }, 'user');
      } else {
        quillRef.insertEmbed(index, 'image', srcAttr, 'user');
      }
      quillRef.setSelection(index + 1, 0, 'silent');
      var leaf = quillRef.getLeaf(index);
      if (leaf && leaf[0] && leaf[0].domNode && leaf[0].domNode.tagName === 'IMG') {
        currentImg = leaf[0].domNode;
        currentImg.classList.add('editor-image-resize-active');
      }
      if (!w) hide();
      else {
        syncResetBtnVisibility();
        position();
      }
    }

    handle.addEventListener('mousedown', function (e) {
      if (!currentImg || !quillRef) return;
      e.preventDefault();
      e.stopPropagation();
      endDrag();
      isDragging = true;
      var startX = e.clientX;
      var startW = currentImg.offsetWidth;
      var maxW = Math.max(80, Math.floor(editorRoot.clientWidth));
      var minW = 48;

      function onMove(ev) {
        if (!isDragging || !currentImg) return;
        var dw = ev.clientX - startX;
        var nw = Math.round(Math.min(maxW, Math.max(minW, startW + dw)));
        currentImg.style.width = nw + 'px';
        currentImg.style.height = 'auto';
        position();
      }

      function onUp() {
        if (!isDragging) return;
        isDragging = false;
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
        document.body.style.userSelect = '';
        dragCleanup = null;
        if (!currentImg) return;
        var nw = Math.round(currentImg.offsetWidth);
        nw = Math.min(maxW, Math.max(minW, nw));
        applyWidth(nw + 'px');
      }

      dragCleanup = function () {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
        document.body.style.userSelect = '';
      };

      document.body.style.userSelect = 'none';
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    });

    resetBtn.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      applyWidth(null);
    });

    document.body.appendChild(resetBtn);
    document.body.appendChild(handle);

    editorRoot.addEventListener('click', function (e) {
      var t = e.target;
      if (t.tagName !== 'IMG') return;
      if (!editorRoot.contains(t)) return;
      e.preventDefault();
      e.stopPropagation();
      showFor(t);
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && (!handle.hidden || !resetBtn.hidden)) {
        e.preventDefault();
        hide();
      }
    });
  }

  function registerBlogVideoBlot(Quill) {
    var BlockEmbed = Quill.import('blots/block/embed');

    function BlogVideoBlot(domNode) {
      BlockEmbed.call(this, domNode);
    }
    BlogVideoBlot.prototype = Object.create(BlockEmbed.prototype);
    BlogVideoBlot.prototype.constructor = BlogVideoBlot;

    BlogVideoBlot.create = function (value) {
      var node = document.createElement('div');
      node.classList.add('ql-blog-video');
      if (value) node.setAttribute('data-url', String(value));
      node.setAttribute('contenteditable', 'false');
      node.innerHTML = buildVideoEmbedInner(value);
      return node;
    };
    BlogVideoBlot.value = function (domNode) {
      return domNode.getAttribute('data-url') || '';
    };
    BlogVideoBlot.blotName = 'blogVideo';
    BlogVideoBlot.tagName = 'div';
    BlogVideoBlot.className = 'ql-blog-video';

    Quill.register(BlogVideoBlot);
  }

  function insertBlogVideoAtSelection(quillRef, url) {
    var range = quillRef.getSelection(true);
    var idx = range ? range.index : quillRef.getLength();
    quillRef.insertEmbed(idx, 'blogVideo', url, 'user');
    quillRef.setSelection(idx + 1, 0, 'silent');
  }

  /** 自定义「视频链接」弹层（viewport 居中，风格与 auth-modal 一致） */
  function createVideoUrlModal() {
    var modal = document.getElementById('video-url-modal');
    var input = document.getElementById('video-url-modal-input');
    var backdrop = document.getElementById('video-url-modal-backdrop');
    var btnCancel = document.getElementById('video-url-modal-cancel');
    var btnConfirm = document.getElementById('video-url-modal-confirm');
    var btnClose = document.getElementById('video-url-modal-close');
    if (!modal || !input || !backdrop || !btnCancel || !btnConfirm || !btnClose) {
      return {
        open: function (quillRef) {
          var u = window.prompt('请输入视频地址：\n支持 YouTube、bilibili 视频页链接，或 mp4/webm 等直链。');
          if (u != null && String(u).trim() && quillRef) {
            insertBlogVideoAtSelection(quillRef, String(u).trim());
          }
        },
      };
    }

    var pendingQuill = null;
    var lastFocus = null;

    function close() {
      modal.classList.remove('is-open');
      modal.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      pendingQuill = null;
      if (lastFocus && typeof lastFocus.focus === 'function') {
        try {
          lastFocus.focus();
        } catch (e) {
          /* ignore */
        }
      }
      lastFocus = null;
    }

    function confirm() {
      var u = input.value ? String(input.value).trim() : '';
      if (!u) {
        if (window.BlogToast) BlogToast.show('请输入视频地址');
        input.focus();
        return;
      }
      if (pendingQuill) {
        insertBlogVideoAtSelection(pendingQuill, u);
      }
      close();
    }

    function open(quillRef) {
      pendingQuill = quillRef;
      lastFocus = document.activeElement;
      input.value = '';
      modal.classList.add('is-open');
      modal.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      window.setTimeout(function () {
        input.focus();
      }, 0);
    }

    backdrop.addEventListener('click', close);
    btnCancel.addEventListener('click', close);
    btnClose.addEventListener('click', close);
    btnConfirm.addEventListener('click', confirm);
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        confirm();
      }
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && modal.classList.contains('is-open')) {
        e.preventDefault();
        close();
      }
    });

    return { open: open, close: close };
  }

  var videoUrlModal = createVideoUrlModal();

  function createBlogVideoToolbarIcon(kind) {
    var ns = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('class', 'ql-blog-video-icon');
    svg.setAttribute('viewBox', '0 0 18 18');
    svg.setAttribute('width', '18');
    svg.setAttribute('height', '18');
    svg.setAttribute('aria-hidden', 'true');
    if (kind === 'link') {
      var c = document.createElementNS(ns, 'circle');
      c.setAttribute('cx', '9');
      c.setAttribute('cy', '9');
      c.setAttribute('r', '6.25');
      c.setAttribute('fill', 'none');
      c.setAttribute('stroke', 'currentColor');
      c.setAttribute('stroke-width', '1.5');
      svg.appendChild(c);
      var tri = document.createElementNS(ns, 'path');
      tri.setAttribute('d', 'M7.35 6.1L12.1 9l-4.75 2.9V6.1z');
      tri.setAttribute('fill', 'currentColor');
      svg.appendChild(tri);
    } else {
      var up = document.createElementNS(ns, 'path');
      up.setAttribute('d', 'M9 3.5v8.5M5.5 7L9 3.5 12.5 7');
      up.setAttribute('fill', 'none');
      up.setAttribute('stroke', 'currentColor');
      up.setAttribute('stroke-width', '1.65');
      up.setAttribute('stroke-linecap', 'round');
      up.setAttribute('stroke-linejoin', 'round');
      svg.appendChild(up);
      var tray = document.createElementNS(ns, 'path');
      tray.setAttribute('d', 'M4 12.5v1.75A2.25 2.25 0 0 0 6.25 16.5h5.5A2.25 2.25 0 0 0 14 14.25V12.5');
      tray.setAttribute('fill', 'none');
      tray.setAttribute('stroke', 'currentColor');
      tray.setAttribute('stroke-width', '1.65');
      tray.setAttribute('stroke-linecap', 'round');
      svg.appendChild(tray);
    }
    return svg;
  }

  function makeToolbarActionEl(className, title, label, iconKind) {
    /* 不用 <button>：Quill Snow 对 .ql-toolbar button 写死 width:28px，中文会逐字竖排 */
    var el = document.createElement('span');
    el.setAttribute('role', 'button');
    el.tabIndex = 0;
    el.className = className;
    el.setAttribute('title', title);
    el.setAttribute('aria-label', title);

    var inner = document.createElement('span');
    inner.className = 'ql-blog-video-btn-inner';
    inner.appendChild(createBlogVideoToolbarIcon(iconKind));
    var lab = document.createElement('span');
    lab.className = 'ql-blog-video-btn-label';
    lab.textContent = label;
    inner.appendChild(lab);
    el.appendChild(inner);
    return el;
  }

  function onPrimaryActivate(el, handler) {
    el.addEventListener('click', handler);
    el.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handler(e);
      }
    });
  }

  function attachEditorVideoToolbar(toolbarEl, quillRef) {
    var span = document.createElement('span');
    span.className = 'ql-formats ql-formats-blog-video';
    var btnUrl = makeToolbarActionEl(
      'ql-blog-video-url',
      '插入视频链接（YouTube、bilibili、mp4 直链等）',
      '视频链接',
      'link'
    );
    var btnUp = makeToolbarActionEl(
      'ql-blog-video-upload',
      '上传本地视频（mp4 / webm / mov）',
      '上传视频',
      'upload'
    );
    span.appendChild(btnUrl);
    span.appendChild(btnUp);
    toolbarEl.appendChild(span);

    onPrimaryActivate(btnUrl, function () {
      videoUrlModal.open(quillRef);
    });

    onPrimaryActivate(btnUp, function () {
      var input = document.createElement('input');
      input.type = 'file';
      input.accept = 'video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov';
      input.click();
      input.onchange = function () {
        var f = input.files && input.files[0];
        if (!f) return;
        if (!window.BlogAPI || typeof BlogAPI.uploadEditorVideo !== 'function') {
          if (window.BlogToast) BlogToast.show('当前环境不支持视频上传');
          return;
        }
        if (window.BlogToast) BlogToast.show('视频上传中，请稍候…');
        BlogAPI.uploadEditorVideo(f)
          .then(function (d) {
            var u = (d && (d.url || d.Url)) || '';
            if (!u) throw new Error('未返回视频地址');
            insertBlogVideoAtSelection(quillRef, u);
            if (window.BlogToast) BlogToast.show('视频已插入');
          })
          .catch(function (e) {
            var m = e && e.message ? e.message : '视频上传失败';
            if (window.BlogToast) BlogToast.show(m);
          });
        input.value = '';
      };
    });
  }

  /** 字体下拉显示名（Quill 默认用英文 value + ::before，易错位；改为写进节点文本） */
  var FONT_PICKER_LABELS = {
    'sans-serif': '系统无衬线',
    serif: '系统衬线',
    monospace: '等宽',
    yahei: '微软雅黑',
    songti: '宋体',
    kaiti: '楷体',
    fangsong: '仿宋',
    simhei: '黑体',
    youyuan: '幼圆',
    lishu: '隶书',
    xingkai: '行楷',
    xiaozhuan: '小篆',
    hannotate: '翩翩手写',
    zcoolle: '站酷快乐体',
    mashan: '毛笔书法',
    longcang: '龙藏手写',
    xiaowei: '站酷小薇体',
  };

  function installFontPickerChineseLabels(quillRef) {
    if (!quillRef) return;
    var toolbar = quillRef.getModule('toolbar');
    if (!toolbar || !toolbar.container) return;
    var picker = toolbar.container.querySelector('.ql-picker.ql-font');
    if (!picker) return;

    var labelApplyScheduled = null;

    function applyLabels() {
      var items = picker.querySelectorAll('.ql-picker-item');
      for (var i = 0; i < items.length; i++) {
        var el = items[i];
        var v = el.getAttribute('data-value');
        if (v === null) continue;
        var nextText = v === '' ? '默认' : FONT_PICKER_LABELS[v] || v;
        if (el.textContent !== nextText) el.textContent = nextText;
      }
      var lab = picker.querySelector('.ql-picker-label');
      if (lab) {
        var lv = lab.getAttribute('data-value');
        var nextLab = !lv || lv === '' ? '默认' : FONT_PICKER_LABELS[lv] || lv;
        if (lab.textContent !== nextLab) lab.textContent = nextLab;
      }
    }

    function scheduleApplyLabels() {
      if (labelApplyScheduled) return;
      labelApplyScheduled = requestAnimationFrame(function () {
        labelApplyScheduled = null;
        applyLabels();
      });
    }

    applyLabels();
    var mo = new MutationObserver(function () {
      scheduleApplyLabels();
    });
    mo.observe(picker, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['data-value'],
    });
    quillRef.on('selection-change', function (range) {
      if (range) scheduleApplyLabels();
    });
  }

  if (editorEl && typeof Quill !== 'undefined') {
    registerBlogVideoBlot(Quill);
    patchQuillImageFormat(Quill);

    /* 字体：与 style.css 中 .ql-font-* 一一对应（详情页共用 ql-snow） */
    var Font = Quill.import('formats/font');
    Font.whitelist = [
      'sans-serif',
      'serif',
      'monospace',
      'yahei',
      'songti',
      'kaiti',
      'fangsong',
      'simhei',
      'youyuan',
      'lishu',
      'xingkai',
      'xiaozhuan',
      'hannotate',
      'zcoolle',
      'mashan',
      'longcang',
      'xiaowei',
    ];
    Quill.register(Font, true);

    quill = new Quill('#quill-editor', {
      theme: 'snow',
      placeholder: '开始写作… 支持标题、字体、颜色、加粗、图片、视频等',
      modules: {
        toolbar: {
          container: [
            [{ header: [1, 2, 3, false] }],
            [{ font: Font.whitelist }],
            [{ color: [] }, { background: [] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ list: 'ordered' }, { list: 'bullet' }],
            ['blockquote', 'code-block'],
            ['link', 'image'],
            ['clean'],
          ],
          handlers: {
            image: function () {
              var input = document.createElement('input');
              input.type = 'file';
              input.accept = 'image/*';
              input.click();
              input.onchange = function () {
                var f = input.files && input.files[0];
                if (!f) return;
                if (!window.BlogAPI || typeof BlogAPI.uploadArticleCover !== 'function') return;
                var range = quill.getSelection(true);
                var insertAt = range ? range.index : quill.getLength();
                BlogAPI.uploadArticleCover(f)
                  .then(function (d) {
                    var u = (d && (d.url || d.Url)) || '';
                    if (!u) throw new Error('未返回图片地址');
                    quill.insertEmbed(insertAt, 'image', u, 'user');
                    quill.setSelection(insertAt + 1, 0, 'silent');
                  })
                  .catch(function (e) {
                    var m = e && e.message ? e.message : '图片上传失败';
                    if (window.BlogToast) BlogToast.show(m);
                  });
                input.value = '';
              };
            },
          },
        },
      },
    });

    installFontPickerChineseLabels(quill);

    var Delta = Quill.import('delta');
    quill.clipboard.addMatcher('DIV', function (node, delta) {
      if (node.classList && node.classList.contains('ql-blog-video')) {
        var u = node.getAttribute('data-url') || '';
        if (u) {
          return new Delta().insert({ blogVideo: u });
        }
      }
      return delta;
    });

    quill.clipboard.addMatcher('IMG', function (node, delta) {
      var src = node.getAttribute('src');
      if (!src) return delta;
      var w = (node.style && node.style.width) || node.getAttribute('width');
      if (w) {
        var ws = String(w).trim();
        if (/^\d+$/.test(ws)) ws = ws + 'px';
        return new Delta().insert({ image: { src: src, width: ws } });
      }
      return new Delta().insert({ image: src });
    });

    setupEditorImageResizeUI(quill, quill.root);

    /* Quill 1.3：toolbar 数组配置时会把 .ql-toolbar 插在 container 的**前一个兄弟**，不在 #quill-editor 内部 */
    var toolbarEl = null;
    var prev = editorEl.previousElementSibling;
    if (prev && prev.classList && prev.classList.contains('ql-toolbar')) {
      toolbarEl = prev;
    }
    if (!toolbarEl && editorEl.parentElement) {
      toolbarEl = editorEl.parentElement.querySelector('.ql-toolbar');
    }
    if (!toolbarEl && editorEl.querySelector) {
      toolbarEl = editorEl.querySelector('.ql-toolbar');
    }
    if (toolbarEl) {
      attachEditorVideoToolbar(toolbarEl, quill);
    }
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
          document.title = '编辑文章 - 阿瑞之家';
          var titleH1 = document.getElementById('publish-page-title');
          if (titleH1) titleH1.textContent = '编辑文章';
          if (titleInput) titleInput.value = article.title || '';
          if (summaryInput) summaryInput.value = article.summary || '';
          var c = (article.cover || '').trim();
          setCoverUrl(c);
          if (quill && bodyHtml) {
            quill.setContents([], 'silent');
            quill.clipboard.dangerouslyPasteHTML(0, bodyHtml, 'silent');
          }
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
