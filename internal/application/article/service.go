package article

import (
	"context"

	pb "github.com/xiaomizhou28zk/zk_web/api/article"
)

type Service struct{}

var _ pb.ArticleServiceHTTPServer = (*Service)(nil)

func NewService() *Service {
	return &Service{}
}

func (s *Service) CreateArticle(ctx context.Context, request *pb.CreateArticleRequest) (*pb.CreateArticleResponse, error) {
	rsp := &pb.CreateArticleResponse{}
	return rsp, nil
}

func (s *Service) GetArticle(ctx context.Context, request *pb.GetArticleRequest) (*pb.GetArticleResponse, error) {
	rsp := &pb.GetArticleResponse{}
	return rsp, nil
}

func (s *Service) ListArticles(ctx context.Context, request *pb.ListArticlesRequest) (*pb.ListArticlesResponse, error) {
	rsp := &pb.ListArticlesResponse{}
	return rsp, nil
}

func (s *Service) ListMyArticles(ctx context.Context, request *pb.ListMyArticlesRequest) (*pb.ListMyArticlesResponse, error) {
	rsp := &pb.ListMyArticlesResponse{}
	return rsp, nil
}

func (s *Service) RecordView(ctx context.Context, request *pb.RecordViewRequest) (*pb.RecordViewResponse, error) {
	rsp := &pb.RecordViewResponse{}
	return rsp, nil
}

func (s *Service) UpdateArticle(ctx context.Context, request *pb.UpdateArticleRequest) (*pb.UpdateArticleResponse, error) {
	rsp := &pb.UpdateArticleResponse{}
	return rsp, nil
}
