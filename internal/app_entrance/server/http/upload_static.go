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

// noDirListingFS 包装 http.Dir：拒绝打开目录，从而禁用 net/http.FileServer 的目录列表；
// 仅允许直接访问具体文件（如 /static/images/xxx.jpg）。目录 URL 返回 403。
type noDirListingFS struct {
	root nethttp.Dir
}

func (fs noDirListingFS) Open(name string) (nethttp.File, error) {
	f, err := fs.root.Open(name)
	if err != nil {
		return nil, err
	}
	st, err := f.Stat()
	if err != nil {
		f.Close()
		return nil, err
	}
	if st.IsDir() {
		f.Close()
		return nil, os.ErrPermission
	}
	return f, nil
}

func articleStaticsRoot() string {
	return filepath.Join("frontend", "statics")
}

func articleCoverUploadDir() string {
	return filepath.Join(articleStaticsRoot(), "images")
}

func articleVideoUploadDir() string {
	return filepath.Join(articleStaticsRoot(), "videos")
}

func frontendSiteRoot() string {
	return filepath.Join("frontend")
}

// RegisterFrontendSite 开放多页前端（HTML/CSS/JS）。须在 /static/、/api/* 等更具体路由注册之后再调用，
// 以便由专用路由优先匹配；根路径 / 会解析为 frontend/index.html。
//
// 注意：此处不能使用 noDirListingFS。访问 / 时 FileServer 必须先打开站点根目录才能查找 index.html；
// 若一律禁止打开目录，根路径会固定返回 403。
func RegisterFrontendSite(srv *kratosHttp.Server) {
	root := frontendSiteRoot()
	fs := nethttp.FileServer(nethttp.Dir(root))
	srv.HandlePrefix("/", fs)
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
		host = "127.0.0.1:8080"
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

	if err := os.MkdirAll(spec.dir, 0o755); err != nil {
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

// registerStaticPathMisunderstandingRedirects 将易混淆的 URL 指到真正的前端首页。
// 说明：本项目中 /static/ 表示「上传文件根目录」frontend/statics（images、videos），
// 不是一般意义上的「整站静态资源前缀」；直接访问 /static/ 会落到目录，noDirListingFS 会 403。
func registerStaticPathMisunderstandingRedirects(srv *kratosHttp.Server) {
	redirect := func(target string) nethttp.HandlerFunc {
		return func(w nethttp.ResponseWriter, r *nethttp.Request) {
			if r.Method != nethttp.MethodGet && r.Method != nethttp.MethodHead {
				w.WriteHeader(nethttp.StatusMethodNotAllowed)
				return
			}
			nethttp.Redirect(w, r, target, nethttp.StatusFound)
		}
	}
	// 须在 PathPrefix("/static/") 之前注册，精确路径优先匹配
	srv.HandleFunc("/static/index.html", redirect("/index.html"))
	srv.HandleFunc("/static/", redirect("/"))
	srv.HandleFunc("/static", redirect("/"))
}

// RegisterUploadRoutesAndStatic 注册：GET /static/... ；POST 封面上传、正文视频上传。
func RegisterUploadRoutesAndStatic(srv *kratosHttp.Server, authMgr *domainAuth.Manager) {
	staticRoot := articleStaticsRoot()
	_ = os.MkdirAll(articleCoverUploadDir(), 0o755)
	_ = os.MkdirAll(articleVideoUploadDir(), 0o755)

	registerStaticPathMisunderstandingRedirects(srv)

	staticHandler := nethttp.FileServer(noDirListingFS{root: nethttp.Dir(staticRoot)})
	srv.HandlePrefix("/static/", nethttp.StripPrefix("/static/", staticHandler))

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
