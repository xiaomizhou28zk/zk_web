package po

import "time"

type Article struct {
	Id          int64      `xorm:"pk autoincr BIGINT"`
	Account     string     `xorm:"not null default '' index VARCHAR(255)"`
	Title       string     `xorm:"not null default '' VARCHAR(500)"`
	Summary     string     `xorm:"not null default '' VARCHAR(2000)"`
	Cover       string     `xorm:"not null default '' VARCHAR(500)"`
	BodyHtml    string     `xorm:"text 'body_html'"`
	Status      int8       `xorm:"not null default 1 index TINYINT"`
	Visibility  int8       `xorm:"not null default 1 TINYINT"`
	PublishedAt *time.Time `xorm:"datetime null 'published_at'"`
	CreatedAt   time.Time  `xorm:"not null 'created_at' DATETIME"`
	UpdatedAt   time.Time  `xorm:"not null 'updated_at' DATETIME"`
}

func (m *Article) TableName() string {
	return "article"
}
