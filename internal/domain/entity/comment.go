package entity

import "time"

// Comment 顶层评论领域模型（仅存于 comment 表）
type Comment struct {
	Id         int64
	ArticleID  int64
	Account    string
	Content    string
	CreateAt   time.Time
	AuthorName string
}
