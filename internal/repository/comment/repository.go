package comment

import (
	"context"

	"github.com/xiaomizhou28zk/zk_web/internal/domain/entity"
)

type Repository struct {
	commentStorage CommentStorage
	replyStorage   ReplyStorage
}

func NewRepository(commentSt CommentStorage, replySt ReplyStorage) *Repository {
	return &Repository{commentStorage: commentSt, replyStorage: replySt}
}

func (r *Repository) ListByArticleID(ctx context.Context, articleID int64) ([]*entity.Comment, error) {
	return r.commentStorage.ListByArticleID(ctx, articleID)
}

func (r *Repository) GetByID(ctx context.Context, id int64) (*entity.Comment, error) {
	return r.commentStorage.GetByID(ctx, id)
}

func (r *Repository) Insert(ctx context.Context, c *entity.Comment) error {
	return r.commentStorage.Insert(ctx, c)
}

func (r *Repository) ListRepliesByCommentIDs(ctx context.Context, commentIDs []int64) ([]*entity.Reply, error) {
	return r.replyStorage.ListRepliesByCommentIDs(ctx, commentIDs)
}

func (r *Repository) GetReplyByID(ctx context.Context, id int64) (*entity.Reply, error) {
	return r.replyStorage.GetReplyByID(ctx, id)
}

func (r *Repository) InsertReply(ctx context.Context, rep *entity.Reply) error {
	return r.replyStorage.InsertReply(ctx, rep)
}
