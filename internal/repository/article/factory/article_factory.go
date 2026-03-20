package factory

import (
	"github.com/xiaomizhou28zk/zk_web/internal/domain/entity"
	"github.com/xiaomizhou28zk/zk_web/internal/repository/article/po"
)

func Po2DoArticle(p *po.Article, authorName, authorAvatar string) *entity.Article {
	if p == nil {
		return nil
	}
	return &entity.Article{
		Id:           p.Id,
		Account:      p.Account,
		Title:        p.Title,
		Summary:      p.Summary,
		Cover:        p.Cover,
		BodyHTML:     p.BodyHtml,
		Status:       int32(p.Status),
		Visibility:   visibilityFromPO(p.Visibility),
		PublishedAt:  p.PublishedAt,
		CreateAt:     p.CreatedAt,
		UpdateAt:     p.UpdatedAt,
		AuthorName:   authorName,
		AuthorAvatar: authorAvatar,
	}
}

func visibilityFromPO(v int8) int32 {
	if v == 0 {
		return 1
	}
	return int32(v)
}

func Do2PoArticle(d *entity.Article) *po.Article {
	if d == nil {
		return nil
	}
	vis := int8(d.Visibility)
	if vis == 0 {
		vis = 1
	}
	return &po.Article{
		Id:          d.Id,
		Account:     d.Account,
		Title:       d.Title,
		Summary:     d.Summary,
		Cover:       d.Cover,
		BodyHtml:    d.BodyHTML,
		Status:      int8(d.Status),
		Visibility:  vis,
		PublishedAt: d.PublishedAt,
		CreatedAt:   d.CreateAt,
		UpdatedAt:   d.UpdateAt,
	}
}
