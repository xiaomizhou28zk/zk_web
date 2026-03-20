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

// GetFeaturedArticleIds 返回推荐精选文章 ID 列表；未配置时返回空切片
func GetFeaturedArticleIds() []int64 {
	if globalConfig == nil {
		return nil
	}
	return globalConfig.Featured.ArticleIDs
}

// GetAuthConfig 返回鉴权配置；未配置时使用默认值
func GetAuthConfig() Auth {
	if globalConfig == nil {
		return Auth{TokenVersion: "1"}
	}
	auth := globalConfig.Auth
	if auth.TokenVersion == "" {
		auth.TokenVersion = "1"
	}
	return auth
}
