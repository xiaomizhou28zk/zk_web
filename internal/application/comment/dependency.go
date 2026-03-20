package comment

import (
	"context"

	"github.com/xiaomizhou28zk/zk_web/internal/domain/entity"
)

// CommentRepository 评论仓储接口（application 层通过此接口调用）
type CommentRepository interface {
	ListByArticleID(ctx context.Context, articleID int64) ([]*entity.Comment, error)
	GetByID(ctx context.Context, id int64) (*entity.Comment, error)
	Insert(ctx context.Context, c *entity.Comment) error
	ListRepliesByCommentIDs(ctx context.Context, commentIDs []int64) ([]*entity.Reply, error)
	GetReplyByID(ctx context.Context, id int64) (*entity.Reply, error)
	InsertReply(ctx context.Context, r *entity.Reply) error
}
