package entity

import "time"

type User struct {
	Id       int64
	Name     string
	Avatar   string
	Pwd      string
	Status   int64
	CreateAt time.Time
	UpdateAt time.Time
}
