package http

import (
	"crypto/tls"
	"errors"
	"log"
	nethttp "net/http"
	"os"
	"time"

	kratosHttp "github.com/go-kratos/kratos/v2/transport/http"

	"github.com/xiaomizhou28zk/zk_web/internal/config"
	domainAuth "github.com/xiaomizhou28zk/zk_web/internal/domain/auth"
)

// corsFilter 添加 CORS 头，允许前端从 localhost/127.0.0.1 跨域访问 API
func corsFilter(next nethttp.Handler) nethttp.Handler {
	return nethttp.HandlerFunc(func(w nethttp.ResponseWriter, r *nethttp.Request) {
		origin := r.Header.Get("Origin")
		if origin == "" {
			origin = "*"
		}
		w.Header().Set("Access-Control-Allow-Origin", origin)
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		w.Header().Set("Access-Control-Max-Age", "86400")
		if r.Method == nethttp.MethodOptions {
			w.WriteHeader(nethttp.StatusNoContent)
			return
		}
		next.ServeHTTP(w, r)
	})
}

func serverOptions(tokenManager *domainAuth.Manager) []kratosHttp.ServerOption {
	return []kratosHttp.ServerOption{
		kratosHttp.Timeout(2 * time.Minute), // 避免 DB 查询或调试断点停留时 context deadline exceeded
		kratosHttp.Filter(corsFilter),
		kratosHttp.Middleware(JWTAuthMiddleware(tokenManager)),
		kratosHttp.ResponseEncoder(unifiedResponseEncoder),
		kratosHttp.ErrorEncoder(unifiedErrorEncoder),
	}
}

// ServerPair 明文 HTTP + 可选 TLS，供 Wire 注入（避免两个 *kratosHttp.Server 绑定冲突）
type ServerPair struct {
	HTTP  *kratosHttp.Server
	HTTPS *kratosHttp.Server
}

// NewServerPair 构建明文 HTTP（可关）与 TLS HTTPS（可选）的 Kratos Server，路由相同。
// 仅 HTTPS：server.http.enabled: false 且 server.https 启用并配置有效证书。
func NewServerPair(register Register, tokenManager *domainAuth.Manager, sc config.Server) (*ServerPair, error) {
	pair := &ServerPair{}
	if sc.HTTP.PlainHTTPOn() {
		pair.HTTP = newPlainHTTPServer(register, tokenManager, sc)
	}
	var err error
	pair.HTTPS, err = newTLSHTTPServer(register, tokenManager, sc)
	if err != nil {
		return nil, err
	}
	if pair.HTTP == nil && pair.HTTPS == nil {
		return nil, errors.New("未启动任何 HTTP 服务：若关闭明文请设 server.http.enabled: false 并启用 server.https 且配置有效证书")
	}
	return pair, nil
}

// newPlainHTTPServer 明文 HTTP（默认 :8080，由配置 server.http.addr 覆盖）
func newPlainHTTPServer(register Register, tokenManager *domainAuth.Manager, sc config.Server) *kratosHttp.Server {
	addr := sc.HTTP.Addr
	if addr == "" {
		addr = ":8080"
	}
	opts := append([]kratosHttp.ServerOption{kratosHttp.Address(addr)}, serverOptions(tokenManager)...)
	srv := kratosHttp.NewServer(opts...)
	register.RegisterHTTPServer(srv)
	return srv
}

// newTLSHTTPServer 当 server.https.enabled 为 false 或未配置时返回 (nil, nil)；
// 启用时在 server.https.addr（默认 :8443）监听 TLS，证书为 PEM。
func newTLSHTTPServer(register Register, tokenManager *domainAuth.Manager, sc config.Server) (*kratosHttp.Server, error) {
	h := sc.HTTPS
	if h == nil || !h.Enabled {
		return nil, nil
	}
	if h.CertFile == "" || h.KeyFile == "" {
		return nil, errors.New("server.https 已启用但未配置 cert_file / key_file")
	}
	_, errCert := os.Stat(h.CertFile)
	_, errKey := os.Stat(h.KeyFile)
	if errCert != nil || errKey != nil {
		log.Printf(
			"[http] HTTPS 需要同时存在 **证书(.crt) 与私钥(.key)**。配置: cert=%q key=%q；存在: crt=%v key=%v。缺任一都会跳过 HTTPS。请执行 ./scripts/gen-dev-cert.sh 重新生成一对，或将 enabled 设为 false",
			h.CertFile, h.KeyFile, errCert == nil, errKey == nil,
		)
		return nil, nil
	}
	cert, err := tls.LoadX509KeyPair(h.CertFile, h.KeyFile)
	if err != nil {
		return nil, err
	}
	addr := h.Addr
	if addr == "" {
		addr = ":8443"
	}
	tlsCfg := &tls.Config{
		MinVersion:   tls.VersionTLS12,
		Certificates: []tls.Certificate{cert},
	}
	opts := append([]kratosHttp.ServerOption{
		kratosHttp.Address(addr),
		kratosHttp.TLSConfig(tlsCfg),
	}, serverOptions(tokenManager)...)
	srv := kratosHttp.NewServer(opts...)
	register.RegisterHTTPServer(srv)
	log.Printf("[http] HTTPS 已启用，将监听 %s（请用 https:// 访问，勿用 http://）", addr)
	return srv, nil
}
