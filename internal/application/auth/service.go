package auth

import (
	"context"

	pb "github.com/xiaomizhou28zk/zk_web/api/auth"
)

type Service struct{}

var _ pb.AuthServiceHTTPServer = (*Service)(nil)

func NewService() *Service {
	return &Service{}
}

func (s *Service) Login(ctx context.Context, request *pb.LoginRequest) (*pb.LoginResponse, error) {
	rsp := &pb.LoginResponse{}
	return rsp, nil
}

func (s *Service) Logout(ctx context.Context, request *pb.LogoutRequest) (*pb.LogoutResponse, error) {
	rsp := &pb.LogoutResponse{}
	return rsp, nil
}

func (s *Service) Register(ctx context.Context, request *pb.RegisterRequest) (*pb.RegisterResponse, error) {
	rsp := &pb.RegisterResponse{}
	return rsp, nil
}
