package user

import (
	"context"
	"strconv"

	kerrors "github.com/go-kratos/kratos/v2/errors"

	pb "github.com/xiaomizhou28zk/zk_web/api/user"
	domainAuth "github.com/xiaomizhou28zk/zk_web/internal/domain/auth"
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

// GetCurrentUser 从 context 中 ReadUserContextInfo（由 JWT 中间件写入）取 account，查库后返回 proto User
func (u *UserService) GetCurrentUser(ctx context.Context, req *pb.GetCurrentUserRequest) (*pb.GetCurrentUserResponse, error) {
	rsp := &pb.GetCurrentUserResponse{}
	info, ok := domainAuth.ReadUserContextInfo(ctx)
	if !ok || info == nil || info.Account == "" {
		return rsp, nil
	}
	entityUser, err := u.userRepo.GetUserInfo(ctx, info.Account)
	if err != nil {
		return nil, err
	}
	if entityUser == nil {
		return nil, kerrors.Unauthorized("USER_NOT_FOUND", "用户不存在或已被禁用")
	}
	nickname := entityUser.Name
	if nickname == "" {
		nickname = entityUser.Account
	}
	avatar := entityUser.Avatar
	if avatar == "" {
		avatar = "👤"
	}
	rsp.User = &pb.User{
		Id:       strconv.FormatInt(entityUser.Id, 10),
		Nickname: nickname,
		Avatar:   avatar,
		Bio:      "",
	}
	return rsp, nil
}
