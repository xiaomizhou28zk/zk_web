package rank

import (
	"context"

	pb "github.com/xiaomizhou28zk/zk_web/api/rank"
)

type Service struct{}

var _ pb.RankingServiceHTTPServer = (*Service)(nil)

func NewService() *Service {
	return &Service{}
}

func (s Service) GetHotRanking(ctx context.Context, request *pb.GetHotRankingRequest) (*pb.GetHotRankingResponse, error) {
	rsp := &pb.GetHotRankingResponse{}
	return rsp, nil
}
