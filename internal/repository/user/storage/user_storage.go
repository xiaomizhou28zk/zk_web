package storage

import (
	"context"

	"github.com/xiaomizhou28zk/zk_web/internal/clients/infra"
	"github.com/xiaomizhou28zk/zk_web/internal/domain/entity"
	"github.com/xiaomizhou28zk/zk_web/internal/repository/user"
	"github.com/xiaomizhou28zk/zk_web/internal/repository/user/factory"
	"github.com/xiaomizhou28zk/zk_web/internal/repository/user/po"
)

type UserMysqlStorage struct {
	mysqlClient infra.UserMysqlClient
}

var _ user.UserStorage = (*UserMysqlStorage)(nil)

func NewUserMysqlStorage(mysqlClient infra.UserMysqlClient) *UserMysqlStorage {
	return &UserMysqlStorage{
		mysqlClient: mysqlClient,
	}
}

func (u *UserMysqlStorage) GetUserInfo(ctx context.Context, uid int64) (*entity.User, error) {
	poData := &po.User{}
	session := u.mysqlClient.Context(ctx).Table((*po.User)(nil).TableName()).
		Where("id = ?", uid).And("status = ?", 1)
	exist, err := session.Get(poData)
	if err != nil {
		return nil, err
	}
	if !exist {
		return nil, nil
	}
	return factory.Po2DoUser(poData), nil
}
