package storage

import (
	"context"
	"time"

	"github.com/xiaomizhou28zk/zk_web/internal/clients/infra"
	"github.com/xiaomizhou28zk/zk_web/internal/domain/entity"
	"github.com/xiaomizhou28zk/zk_web/internal/repository/user"
	"github.com/xiaomizhou28zk/zk_web/internal/repository/user/factory"
	"github.com/xiaomizhou28zk/zk_web/internal/repository/user/po"
)

type UserMysqlStorage struct {
	mysqlClient infra.BlogMysqlClient
}

var _ user.UserStorage = (*UserMysqlStorage)(nil)

func NewUserMysqlStorage(mysqlClient infra.BlogMysqlClient) *UserMysqlStorage {
	return &UserMysqlStorage{
		mysqlClient: mysqlClient,
	}
}

func (u *UserMysqlStorage) GetUserInfo(ctx context.Context, account string) (*entity.User, error) {
	poData := &po.User{}
	session := u.mysqlClient.Context(ctx).Table((*po.User)(nil).TableName()).
		Where("account = ?", account).And("status = ?", 1)
	exist, err := session.Get(poData)
	if err != nil {
		return nil, err
	}
	if !exist {
		return nil, nil
	}
	return factory.Po2DoUser(poData), nil
}

func (u *UserMysqlStorage) UpdateUserProfile(ctx context.Context, account, name, avatar string) error {
	_, err := u.mysqlClient.Context(ctx).Table((*po.User)(nil).TableName()).
		Where("account = ?", account).And("status = ?", 1).
		Update(map[string]interface{}{
			"name":      name,
			"avatar":    avatar,
			"update_at": time.Now(),
		})
	return err
}

func (u *UserMysqlStorage) UpdateUserPasswordHash(ctx context.Context, account, passwordHash string) error {
	_, err := u.mysqlClient.Context(ctx).Table((*po.User)(nil).TableName()).
		Where("account = ?", account).And("status = ?", 1).
		Update(map[string]interface{}{
			"pwd":       passwordHash,
			"update_at": time.Now(),
		})
	return err
}

func (u *UserMysqlStorage) InsertUser(ctx context.Context, user *entity.User) error {
	poData := factory.Do2PoUser(user)
	now := time.Now()
	if poData.CreateAt.IsZero() {
		poData.CreateAt = now
	}
	if poData.UpdateAt.IsZero() {
		poData.UpdateAt = now
	}
	_, err := u.mysqlClient.Context(ctx).Table((*po.User)(nil).TableName()).Insert(poData)
	if err != nil {
		return err
	}
	user.Id = poData.Id
	user.CreateAt = poData.CreateAt
	user.UpdateAt = poData.UpdateAt
	return nil
}
