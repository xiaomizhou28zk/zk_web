package auth

import (
	"errors"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

const defaultTokenExpiration = 12 * time.Hour

var (
	ErrInvalidToken = errors.New("invalid token")
)

// Manager JWT 的创建、验证、解析
type Manager struct {
	secret  []byte
	version string
	expiry  time.Duration
}

// NewManager 创建 auth 模块的 JWT 管理器
func NewManager(secret string, version string) *Manager {
	if version == "" {
		version = "1"
	}
	key := []byte(secret)
	if len(key) == 0 {
		key = []byte("dev-secret-change-in-production")
	}
	return &Manager{
		secret:  key,
		version: version,
		expiry:  defaultTokenExpiration,
	}
}

// CreateToken 签发 JWT，载体包含 account、版本号，过期时间 12 小时
func (m *Manager) CreateToken(account string) (string, error) {
	now := time.Now()
	claims := Claims{
		Account: account,
		Version: m.version,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(now.Add(m.expiry)),
			IssuedAt:  jwt.NewNumericDate(now),
			NotBefore: jwt.NewNumericDate(now),
		},
	}
	tok := jwt.NewWithClaims(jwt.SigningMethodHS256, &claims)
	return tok.SignedString(m.secret)
}

// VerifyToken 验证 token 签名与有效期，无效返回错误
func (m *Manager) VerifyToken(tokenString string) error {
	_, err := m.ParseToken(tokenString)
	return err
}

// ParseToken 解析 token 并返回载体；若签名或有效期无效则返回错误
func (m *Manager) ParseToken(tokenString string) (*Claims, error) {
	tok, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(t *jwt.Token) (interface{}, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, ErrInvalidToken
		}
		return m.secret, nil
	})
	if err != nil {
		return nil, err
	}
	claims, ok := tok.Claims.(*Claims)
	if !ok || !tok.Valid {
		return nil, ErrInvalidToken
	}
	return claims, nil
}
