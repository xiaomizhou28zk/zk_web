package factory

import (
	"github.com/xiaomizhou28zk/zk_web/internal/domain/entity"
	"github.com/xiaomizhou28zk/zk_web/internal/repository/user/po"
)

func Do2PoUser(d *entity.User) *po.User {
	return &po.User{
		Id:       d.Id,
		Name:     d.Name,
		Pwd:      d.Pwd,
		Avatar:   d.Avatar,
		Status:   d.Status,
		CreateAt: d.CreateAt,
		UpdateAt: d.UpdateAt,
	}
}

func Po2DoUser(p *po.User) *entity.User {
	return &entity.User{
		Id:       p.Id,
		Name:     p.Name,
		Pwd:      p.Pwd,
		Avatar:   p.Avatar,
		Status:   p.Status,
		CreateAt: p.CreateAt,
		UpdateAt: p.UpdateAt,
	}
}
