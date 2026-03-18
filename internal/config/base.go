package config

import (
	"github.com/xiaomizhou28zk/zk_web/internal/pkg/xmysql"
)

type (
	BlogMysqlConfig xmysql.Config
)

func GetBlogMysqlConfig() BlogMysqlConfig {
	return BlogMysqlConfig(globalConfig.Mysql.Blog)
}
