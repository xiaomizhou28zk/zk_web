package rank

import (
	"context"

	pb "github.com/xiaomizhou28zk/zk_web/api/rank"
)

type Service struct {
	rankQuery ArticleRankingQuery
}

var _ pb.RankingServiceHTTPServer = (*Service)(nil)

func NewService(rankQuery ArticleRankingQuery) *Service {
	return &Service{rankQuery: rankQuery}
}

func (s *Service) GetHotRanking(ctx context.Context, request *pb.GetHotRankingRequest) (*pb.GetHotRankingResponse, error) {
	typ := request.GetType()
	if typ == pb.HotRankType_HOT_RANK_UNSPECIFIED {
		typ = pb.HotRankType_TOTAL
	}
	rows, err := s.rankQuery.HotRanking(ctx, int32(typ), request.GetLimit())
	if err != nil {
		return nil, err
	}
	items := make([]*pb.HotRankItem, 0, len(rows))
	for _, r := range rows {
		items = append(items, &pb.HotRankItem{ArticleId: r.ArticleID, Title: r.Title, Views: r.Views})
	}
	return &pb.GetHotRankingResponse{Items: items}, nil
}
