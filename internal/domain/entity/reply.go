package entity

import "time"

// Reply 回复领域模型
type Reply struct {
	Id             int64
	CommentID      int64
	ReplyToReplyID *int64
	Account        string
	Content        string
	CreateAt       time.Time
	AuthorName     string
}
