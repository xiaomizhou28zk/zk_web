package auth

import "context"

// UserContextInfo 中间件解析 JWT 后写入 context，供各 API 读取当前登录账号等信息
type UserContextInfo struct {
	Account string // 登录账号（与 JWT claim 一致）
	Version string // Token 载体版本号
}

type userContextKey struct{}

// WriteUserContextInfo 将用户信息写入 context（中间件在解析成功 JWT 后调用）
func WriteUserContextInfo(ctx context.Context, info *UserContextInfo) context.Context {
	if info == nil {
		return ctx
	}
	return context.WithValue(ctx, userContextKey{}, info)
}

// ReadUserContextInfo 从 context 读取用户信息；未写入或不存在时 ok 为 false
func ReadUserContextInfo(ctx context.Context) (info *UserContextInfo, ok bool) {
	v, ok := ctx.Value(userContextKey{}).(*UserContextInfo)
	return v, ok
}
