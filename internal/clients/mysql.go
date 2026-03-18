package clients

import (
	"github.com/xiaomizhou28zk/zk_web/internal/clients/infra"
	"github.com/xiaomizhou28zk/zk_web/internal/config"
	"github.com/xiaomizhou28zk/zk_web/internal/pkg/xmysql"
)

func NewBlogMysqlClient(cfg config.BlogMysqlConfig) (infra.BlogMysqlClient, func(), error) {
	client, cleanup, err := xmysql.NewClient(
		xmysql.Config(cfg),
	)
	if err != nil {
		return nil, nil, err
	}
	return client, cleanup, nil
}
