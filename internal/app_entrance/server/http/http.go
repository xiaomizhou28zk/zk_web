package http

import (
	nethttp "net/http"

	kratosHttp "github.com/go-kratos/kratos/v2/transport/http"
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

func NewServer(register Register) *kratosHttp.Server {
	srv := kratosHttp.NewServer(
		kratosHttp.Address(":30080"),
		kratosHttp.Filter(corsFilter),
	)
	register.RegisterHTTPServer(srv)
	return srv
}
