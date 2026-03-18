package comment

import (
	"context"

	pb "github.com/xiaomizhou28zk/zk_web/api/comment"
)

type Service struct{}

var _ pb.CommentServiceHTTPServer = (*Service)(nil)

func NewService() *Service {
	return &Service{}
}

func (s *Service) AddComment(ctx context.Context, request *pb.AddCommentRequest) (*pb.AddCommentResponse, error) {
	rsp := &pb.AddCommentResponse{}
	return rsp, nil
}

func (s *Service) AddReply(ctx context.Context, request *pb.AddReplyRequest) (*pb.AddReplyResponse, error) {
	rsp := &pb.AddReplyResponse{}
	return rsp, nil
}

func (s *Service) ListComments(ctx context.Context, request *pb.ListCommentsRequest) (*pb.ListCommentsResponse, error) {
	rsp := &pb.ListCommentsResponse{}
	return rsp, nil
}
