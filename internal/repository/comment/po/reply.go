package po

import "time"

type Reply struct {
	Id              int64     `xorm:"pk autoincr BIGINT"`
	CommentId       int64     `xorm:"not null index BIGINT"`
	ReplyToReplyId  *int64    `xorm:"index BIGINT"`
	Account         string    `xorm:"not null default '' VARCHAR(255)"`
	Content         string    `xorm:"not null TEXT"`
	CreatedAt       time.Time `xorm:"not null 'created_at' DATETIME"`
}

func (m *Reply) TableName() string {
	return "reply"
}
