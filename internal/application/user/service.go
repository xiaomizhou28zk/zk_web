package user

import (
	"context"

	pb "github.com/xiaomizhou28zk/zk_web/api/user"
	pkgLog "github.com/xiaomizhou28zk/zk_web/internal/pkg/log"
)

type UserService struct{}

var _ pb.UserServiceHTTPServer = (*UserService)(nil)

func NewUserService() *UserService {
	return &UserService{}
}

func (u UserService) GetUserInfo(ctx context.Context, request *pb.GetUserInfoRequest) (*pb.GetUserInfoResponse, error) {
	resp := &pb.GetUserInfoResponse{
		Name:   "张可",
		Email:  "134qq.com",
		Avatar: "1111.png",
	}
	pkgLog.Debug("我的测试日志%d", 1)
	return resp, nil
}

func (u UserService) Login(ctx context.Context, request *pb.LoginRequest) (*pb.LoginResponse, error) {
	// TODO implement me
	panic("implement me")
}
