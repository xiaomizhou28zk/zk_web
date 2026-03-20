package po

import (
	"time"
)

type User struct {
	Id       int64     `xorm:"pk autoincr comment('主键 id') BIGINT"`
	Account  string    `xorm:"not null default '' comment('账号，也可以是邮箱，全局唯一') unique VARCHAR(255)"`
	Name     string    `xorm:"not null default '' comment('用户名') VARCHAR(255)"`
	Avatar   string    `xorm:"not null default '' comment('用户头像') VARCHAR(255)"`
	Pwd      string    `xorm:"not null default '' comment('用户密码') VARCHAR(255)"`
	Status   int64     `xorm:"not null default 1 comment('用户状态：1 正常 2 禁用') TINYINT"`
	CreateAt time.Time `xorm:"not null comment('创建时间') index DATETIME"`
	UpdateAt time.Time `xorm:"not null comment('更新时间') index DATETIME"`
}

func (m *User) TableName() string {
	return "user"
}
