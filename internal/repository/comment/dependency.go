package comment

import (
	"context"

	"github.com/xiaomizhou28zk/zk_web/internal/domain/entity"
)

// CommentStorage 评论持久化（MySQL）
type CommentStorage interface {
	ListByArticleID(ctx context.Context, articleID int64) ([]*entity.Comment, error)
	GetByID(ctx context.Context, id int64) (*entity.Comment, error)
	Insert(ctx context.Context, c *entity.Comment) error
}

// ReplyStorage 回复持久化（MySQL）
type ReplyStorage interface {
	ListRepliesByCommentIDs(ctx context.Context, commentIDs []int64) ([]*entity.Reply, error)
	GetReplyByID(ctx context.Context, id int64) (*entity.Reply, error)
	InsertReply(ctx context.Context, r *entity.Reply) error
}
