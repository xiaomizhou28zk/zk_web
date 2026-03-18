package user

import (
	"context"

	pb "github.com/xiaomizhou28zk/zk_web/api/user"
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

func (u *UserService) GetCurrentUser(ctx context.Context, req *pb.GetCurrentUserRequest) (*pb.GetCurrentUserResponse, error) {
	rsp := &pb.GetCurrentUserResponse{}
	return rsp, nil
}
