package user

import (
	"context"

	"github.com/xiaomizhou28zk/zk_web/internal/domain/entity"
)

type UserStorage interface {
	GetUserInfo(ctx context.Context, uid int64) (*entity.User, error)
}
