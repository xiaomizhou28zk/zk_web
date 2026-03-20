package po

import "time"

type ArticleViewLog struct {
	Id        int64     `xorm:"pk autoincr BIGINT"`
	ArticleId int64     `xorm:"not null index BIGINT"`
	ViewAt    time.Time `xorm:"not null 'view_at' DATETIME"`
}

func (m *ArticleViewLog) TableName() string {
	return "article_view_log"
}
