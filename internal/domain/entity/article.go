package entity

import "time"

// Article 文章领域模型
type Article struct {
	Id           int64
	Account      string
	Title        string
	Summary      string
	Cover        string
	BodyHTML     string
	Status       int32 // 1 草稿 2 已发布
	Visibility   int32 // 1 首页/推荐可见 2 隐藏
	PublishedAt  *time.Time
	CreateAt     time.Time
	UpdateAt     time.Time
	AuthorName   string
	AuthorAvatar string
}

// HotRankRow 热度榜一行
type HotRankRow struct {
	ArticleID int64
	Title     string
	Views     int64
}
