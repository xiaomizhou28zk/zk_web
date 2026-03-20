package user

import (
	"context"
	"strconv"
	"strings"
	"unicode/utf8"

	kerrors "github.com/go-kratos/kratos/v2/errors"

	pb "github.com/xiaomizhou28zk/zk_web/api/user"
	domainAuth "github.com/xiaomizhou28zk/zk_web/internal/domain/auth"
	"github.com/xiaomizhou28zk/zk_web/internal/domain/entity"
)

type UserService struct {
	userRepo UserRepository
}

var _ pb.UserServiceHTTPServer = (*UserService)(nil)

// maxProfileNicknameRunes 资料页昵称最大长度（按 Unicode 码点计，与前端 maxlength 一致）
const maxProfileNicknameRunes = 15

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
	rsp.User = entityToProtoUser(entityUser)
	return rsp, nil
}

func entityToProtoUser(entityUser *entity.User) *pb.User {
	if entityUser == nil {
		return nil
	}
	nickname := entityUser.Name
	if nickname == "" {
		nickname = entityUser.Account
	}
	avatar := entityUser.Avatar
	if avatar == "" {
		avatar = "👤"
	}
	return &pb.User{
		Id:       strconv.FormatInt(entityUser.Id, 10),
		Nickname: nickname,
		Avatar:   avatar,
		Bio:      "",
	}
}

// UpdateProfile 更新当前用户昵称、头像（需已登录）
func (u *UserService) UpdateProfile(ctx context.Context, req *pb.UpdateProfileRequest) (*pb.UpdateProfileResponse, error) {
	if req == nil {
		return nil, kerrors.BadRequest("INVALID_REQUEST", "请求体无效")
	}
	info, ok := domainAuth.ReadUserContextInfo(ctx)
	if !ok || info == nil || info.Account == "" {
		return nil, kerrors.Unauthorized("UNAUTHORIZED", "请先登录")
	}
	nickname := strings.TrimSpace(req.GetNickname())
	if nickname == "" {
		return nil, kerrors.BadRequest("INVALID_NICKNAME", "昵称不能为空")
	}
	if utf8.RuneCountInString(nickname) > maxProfileNicknameRunes {
		return nil, kerrors.BadRequest("INVALID_NICKNAME", "昵称最多 15 个字")
	}
	avatar := strings.TrimSpace(req.GetAvatar())
	if avatar == "" {
		avatar = "👤"
	}
	if len(avatar) > 2048 {
		return nil, kerrors.BadRequest("INVALID_AVATAR", "头像内容过长")
	}
	if err := u.userRepo.UpdateUserProfile(ctx, info.Account, nickname, avatar); err != nil {
		return nil, err
	}
	entityUser, err := u.userRepo.GetUserInfo(ctx, info.Account)
	if err != nil {
		return nil, err
	}
	if entityUser == nil {
		return nil, kerrors.Unauthorized("USER_NOT_FOUND", "用户不存在")
	}
	return &pb.UpdateProfileResponse{User: entityToProtoUser(entityUser)}, nil
}
