package po

import "time"

type ArticleLike struct {
	Id        int64     `xorm:"pk autoincr BIGINT"`
	ArticleId int64     `xorm:"not null BIGINT 'article_id'"`
	Account   string    `xorm:"not null VARCHAR(255)"`
	CreatedAt time.Time `xorm:"not null 'created_at' DATETIME"`
}

func (m *ArticleLike) TableName() string {
	return "article_like"
}
