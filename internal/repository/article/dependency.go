package article

import (
	"context"

	"github.com/xiaomizhou28zk/zk_web/internal/domain/entity"
)

type ArticleStorage interface {
	ListPublished(ctx context.Context, q string, cursor int64, pageSize int32) ([]*entity.Article, string, error)
	ListByIDs(ctx context.Context, ids []int64) ([]*entity.Article, error)
	GetByID(ctx context.Context, id int64) (*entity.Article, error)
	Insert(ctx context.Context, a *entity.Article) error
	UpdateByOwner(ctx context.Context, id int64, account string, title, summary, cover, body *string, status *int32, visibility *int8) (bool, error)
	ListByAccount(ctx context.Context, account string, page, pageSize int32) ([]*entity.Article, int32, error)
	Exists(ctx context.Context, id int64) (bool, error)
	InsertViewLog(ctx context.Context, articleID int64) error
	HotRanking(ctx context.Context, rankType int32, limit int32) ([]entity.HotRankRow, error)

	GetArticleEngagement(ctx context.Context, articleID int64, viewerAccount string) (likeCount, favoriteCount int64, liked, favorited bool, err error)
	ToggleArticleLike(ctx context.Context, articleID int64, account string) (likeCount int64, liked bool, err error)
	ToggleArticleFavorite(ctx context.Context, articleID int64, account string) (favoriteCount int64, favorited bool, err error)
	ListFavoritedPublished(ctx context.Context, account string, page, pageSize int32) ([]*entity.Article, int32, error)
}
