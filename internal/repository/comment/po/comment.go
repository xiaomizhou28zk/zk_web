package po

import "time"

type Comment struct {
	Id        int64     `xorm:"pk autoincr BIGINT"`
	ArticleId int64     `xorm:"not null index BIGINT"`
	Account   string    `xorm:"not null default '' VARCHAR(255)"`
	Content   string    `xorm:"not null TEXT"`
	CreatedAt time.Time `xorm:"not null 'created_at' DATETIME"`
}

func (m *Comment) TableName() string {
	return "comment"
}
