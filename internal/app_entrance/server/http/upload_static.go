package http

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"io"
	nethttp "net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	kratosHttp "github.com/go-kratos/kratos/v2/transport/http"

	domainAuth "github.com/xiaomizhou28zk/zk_web/internal/domain/auth"
)

func articleStaticsRoot() string {
	return filepath.Join("frontend", "statics")
}

func articleCoverUploadDir() string {
	return filepath.Join(articleStaticsRoot(), "images")
}

func articleVideoUploadDir() string {
	return filepath.Join(articleStaticsRoot(), "videos")
}

func randomHex(nBytes int) string {
	b := make([]byte, nBytes)
	if _, err := rand.Read(b); err != nil {
		return fmt.Sprintf("%d", time.Now().UnixNano())
	}
	return hex.EncodeToString(b)
}

func publicBaseURL(r *nethttp.Request) string {
	proto := "http"
	if r.TLS != nil {
		proto = "https"
	}
	host := r.Host
	if host == "" {
		host = "127.0.0.1:30080"
	}
	return proto + "://" + host
}

type uploadSpec struct {
	dir        string
	urlPrefix  string // e.g. "/static/images/"
	maxBytes   int64
	allowedExt map[string]bool
}

func saveUploadedFile(w nethttp.ResponseWriter, r *nethttp.Request, authMgr *domainAuth.Manager, spec uploadSpec) bool {
	raw := domainAuth.BearerTokenFromRequest(r)
	if raw == "" {
		_ = WriteEnvelopeJSON(w, 401, "请先登录", nil)
		return false
	}
	if _, err := authMgr.ParseToken(raw); err != nil {
		_ = WriteEnvelopeJSON(w, 401, "登录已失效，请重新登录", nil)
		return false
	}

	if err := os.MkdirAll(spec.dir, 0755); err != nil {
		_ = WriteEnvelopeJSON(w, 500, "创建目录失败", nil)
		return false
	}

	if err := r.ParseMultipartForm(spec.maxBytes); err != nil {
		_ = WriteEnvelopeJSON(w, 400, "文件过大或无法解析", nil)
		return false
	}
	fh, header, err := r.FormFile("file")
	if err != nil {
		_ = WriteEnvelopeJSON(w, 400, "请选择文件", nil)
		return false
	}
	defer fh.Close()

	ext := strings.ToLower(filepath.Ext(header.Filename))
	if ext == "" || !spec.allowedExt[ext] {
		_ = WriteEnvelopeJSON(w, 400, "不支持的文件类型", nil)
		return false
	}

	name := fmt.Sprintf("%d_%s%s", time.Now().UnixNano(), randomHex(6), ext)
	dstPath := filepath.Join(spec.dir, name)
	out, err := os.Create(dstPath)
	if err != nil {
		_ = WriteEnvelopeJSON(w, 500, "保存文件失败", nil)
		return false
	}
	defer out.Close()

	n, err := io.Copy(out, io.LimitReader(fh, spec.maxBytes+1))
	if err != nil {
		_ = os.Remove(dstPath)
		_ = WriteEnvelopeJSON(w, 500, "写入文件失败", nil)
		return false
	}
	if n > spec.maxBytes {
		_ = os.Remove(dstPath)
		_ = WriteEnvelopeJSON(w, 400, "文件过大", nil)
		return false
	}

	publicPath := spec.urlPrefix + name
	publicURL := publicBaseURL(r) + publicPath
	_ = WriteEnvelopeJSON(w, 0, "", map[string]string{
		"url":  publicURL,
		"path": publicPath,
	})
	return true
}

// RegisterUploadRoutesAndStatic 注册：GET /static/... ；POST 封面上传、正文视频上传。
func RegisterUploadRoutesAndStatic(srv *kratosHttp.Server, authMgr *domainAuth.Manager) {
	staticRoot := articleStaticsRoot()
	_ = os.MkdirAll(articleCoverUploadDir(), 0755)
	_ = os.MkdirAll(articleVideoUploadDir(), 0755)

	srv.HandlePrefix("/static/", nethttp.StripPrefix("/static/", nethttp.FileServer(nethttp.Dir(staticRoot))))

	srv.HandleFunc("/api/upload/cover", func(w nethttp.ResponseWriter, r *nethttp.Request) {
		if r.Method != nethttp.MethodPost {
			w.WriteHeader(nethttp.StatusMethodNotAllowed)
			return
		}
		saveUploadedFile(w, r, authMgr, uploadSpec{
			dir:       articleCoverUploadDir(),
			urlPrefix: "/static/images/",
			maxBytes:  6 << 20,
			allowedExt: map[string]bool{
				".jpg": true, ".jpeg": true, ".png": true, ".gif": true, ".webp": true,
			},
		})
	})

	srv.HandleFunc("/api/upload/editor-video", func(w nethttp.ResponseWriter, r *nethttp.Request) {
		if r.Method != nethttp.MethodPost {
			w.WriteHeader(nethttp.StatusMethodNotAllowed)
			return
		}
		saveUploadedFile(w, r, authMgr, uploadSpec{
			dir:       articleVideoUploadDir(),
			urlPrefix: "/static/videos/",
			maxBytes:  80 << 20, // 80MB
			allowedExt: map[string]bool{
				".mp4": true, ".webm": true, ".mov": true,
			},
		})
	})
}
