package http

import (
	"context"
	"strings"

	kerrors "github.com/go-kratos/kratos/v2/errors"
	"github.com/go-kratos/kratos/v2/middleware"
	kratosHttp "github.com/go-kratos/kratos/v2/transport/http"

	domainAuth "github.com/xiaomizhou28zk/zk_web/internal/domain/auth"
)

// 这些路径在携带无效/过期 JWT 时仍放行（避免带旧 token 调用登录/注册被 401 拦截）
var jwtRelaxedPaths = map[string]struct{}{
	"/api/auth/login":    {},
	"/api/auth/register": {},
	"/api/auth/logout":   {},
}

func pathWithoutQuery(path string) string {
	if i := strings.Index(path, "?"); i >= 0 {
		return path[:i]
	}
	return path
}

// JWTAuthMiddleware 校验并解析 Bearer JWT，成功则 WriteUserContextInfo；无 token 则直接放行。
// 除登录/注册/登出外，若带了 token 但校验失败则返回 401。
func JWTAuthMiddleware(m *domainAuth.Manager) middleware.Middleware {
	return func(next middleware.Handler) middleware.Handler {
		return func(ctx context.Context, req interface{}) (interface{}, error) {
			httpReq, ok := kratosHttp.RequestFromServerContext(ctx)
			if !ok || httpReq == nil {
				return next(ctx, req)
			}
			raw := domainAuth.BearerTokenFromRequest(httpReq)
			if raw == "" {
				return next(ctx, req)
			}
			claims, err := m.ParseToken(raw)
			if err != nil {
				p := pathWithoutQuery(httpReq.URL.Path)
				if _, relaxed := jwtRelaxedPaths[p]; relaxed {
					return next(ctx, req)
				}
				return nil, kerrors.Unauthorized("UNAUTHORIZED", "登录已失效，请重新登录")
			}
			info := &domainAuth.UserContextInfo{
				Account: claims.Account,
				Version: claims.Version,
			}
			ctx = domainAuth.WriteUserContextInfo(ctx, info)
			return next(ctx, req)
		}
	}
}
