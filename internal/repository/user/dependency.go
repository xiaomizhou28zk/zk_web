package user

import (
	"context"

	"github.com/xiaomizhou28zk/zk_web/internal/domain/entity"
)

type UserStorage interface {
	GetUserInfo(ctx context.Context, account string) (*entity.User, error)
	InsertUser(ctx context.Context, user *entity.User) error
}
