package auth

import (
	"github.com/golang-jwt/jwt/v5"
)

// Claims JWT 载体：account、版本号，以及标准声明（过期时间等）
type Claims struct {
	Account string `json:"account"`
	Version string `json:"version"` // 版本号，用于兼容或使旧 token 失效
	jwt.RegisteredClaims
}
