package config

import (
	"github.com/xiaomizhou28zk/zk_web/internal/pkg/xmysql"
)

type (
	UserMysqlConfig xmysql.Config
)

func GetUserMysqlConfig() UserMysqlConfig {
	return UserMysqlConfig(globalConfig.Mysql.User)
}
