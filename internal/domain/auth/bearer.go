package auth

import (
	"strings"

	nethttp "net/http"
)

// BearerTokenFromRequest 从 Authorization 头解析 Bearer token，无则返回空串
func BearerTokenFromRequest(r *nethttp.Request) string {
	if r == nil {
		return ""
	}
	h := r.Header.Get("Authorization")
	if h == "" {
		return ""
	}
	const prefix = "Bearer "
	if len(h) > len(prefix) && strings.EqualFold(h[:len(prefix)], prefix) {
		return strings.TrimSpace(h[len(prefix):])
	}
	return ""
}
