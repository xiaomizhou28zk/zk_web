package user

import (
	"context"

	pb "github.com/xiaomizhou28zk/zk_web/api/user"
	"github.com/xiaomizhou28zk/zk_web/internal/pkg/log"
)

type UserService struct {
	userRepo UserRepository
}

var _ pb.UserServiceHTTPServer = (*UserService)(nil)

func NewUserService(userRepo UserRepository) *UserService {
	return &UserService{
		userRepo: userRepo,
	}
}

func (u *UserService) GetUserInfo(ctx context.Context, request *pb.GetUserInfoRequest) (*pb.GetUserInfoResponse, error) {
	resp := &pb.GetUserInfoResponse{}
	uid := int64(10000001)

	user, err := u.userRepo.GetUserInfo(ctx, uid)
	if err != nil {
		log.Error("获取用户信息失败 uid:%d, user:%v", uid, user)
		return nil, err
	}
	log.Info("获取用户信息成功 uid:%d", uid)
	if user == nil {
		log.Info("用户不存在 uid:%d", uid)
		return nil, nil
	}
	resp.Name = user.Name
	resp.Avatar = user.Avatar
	return resp, nil
}

func (u *UserService) Login(ctx context.Context, request *pb.LoginRequest) (*pb.LoginResponse, error) {
	// TODO implement me
	panic("implement me")
}
