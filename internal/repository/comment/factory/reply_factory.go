package factory

import (
	"github.com/xiaomizhou28zk/zk_web/internal/domain/entity"
	"github.com/xiaomizhou28zk/zk_web/internal/repository/comment/po"
)

func replyToReplyIDVal(p *int64) *int64 {
	return p
}

func replyToReplyIDPtr(v *int64) *int64 {
	return v
}

func Po2DoReply(p *po.Reply, authorName string) *entity.Reply {
	if p == nil {
		return nil
	}
	return &entity.Reply{
		Id:             p.Id,
		CommentID:      p.CommentId,
		ReplyToReplyID: replyToReplyIDVal(p.ReplyToReplyId),
		Account:        p.Account,
		Content:        p.Content,
		CreateAt:       p.CreatedAt,
		AuthorName:     authorName,
	}
}

func Do2PoReply(d *entity.Reply) *po.Reply {
	if d == nil {
		return nil
	}
	return &po.Reply{
		Id:             d.Id,
		CommentId:      d.CommentID,
		ReplyToReplyId: replyToReplyIDPtr(d.ReplyToReplyID),
		Account:        d.Account,
		Content:        d.Content,
		CreatedAt:      d.CreateAt,
	}
}
