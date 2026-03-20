package factory

import (
	"github.com/xiaomizhou28zk/zk_web/internal/domain/entity"
	"github.com/xiaomizhou28zk/zk_web/internal/repository/comment/po"
)

func Po2DoComment(p *po.Comment, authorName string) *entity.Comment {
	if p == nil {
		return nil
	}
	return &entity.Comment{
		Id:         p.Id,
		ArticleID:  p.ArticleId,
		Account:    p.Account,
		Content:    p.Content,
		CreateAt:   p.CreatedAt,
		AuthorName: authorName,
	}
}

func Do2PoComment(d *entity.Comment) *po.Comment {
	if d == nil {
		return nil
	}
	return &po.Comment{
		Id:        d.Id,
		ArticleId: d.ArticleID,
		Account:   d.Account,
		Content:   d.Content,
		CreatedAt: d.CreateAt,
	}
}

