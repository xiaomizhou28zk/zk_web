package rank

import (
	"context"

	"github.com/xiaomizhou28zk/zk_web/internal/domain/entity"
)

// ArticleRankingQuery 文章热度榜查询接口（rank 服务只需 HotRanking）
type ArticleRankingQuery interface {
	HotRanking(ctx context.Context, rankType int32, limit int32) ([]entity.HotRankRow, error)
}
