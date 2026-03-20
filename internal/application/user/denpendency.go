package user

import (
	"context"

	"github.com/xiaomizhou28zk/zk_web/internal/domain/entity"
)

type UserRepository interface {
	GetUserInfo(ctx context.Context, account string) (*entity.User, error)
	InsertUser(ctx context.Context, user *entity.User) error
	UpdateUserProfile(ctx context.Context, account, name, avatar string) error
	UpdateUserPasswordHash(ctx context.Context, account, passwordHash string) error
}
