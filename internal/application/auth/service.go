package auth

import (
	"context"
	"encoding/base64"
	"strings"
	"time"

	"github.com/alexedwards/argon2id"
	"github.com/dlclark/regexp2"
	kerrors "github.com/go-kratos/kratos/v2/errors"

	pb "github.com/xiaomizhou28zk/zk_web/api/auth"
	domainAuth "github.com/xiaomizhou28zk/zk_web/internal/domain/auth"
	"github.com/xiaomizhou28zk/zk_web/internal/domain/entity"
)

type Service struct {
	userRepo     UserRepository
	tokenManager *domainAuth.Manager
}

var _ pb.AuthServiceHTTPServer = (*Service)(nil)

const passwordRegularExpression = "^[a-zA-Z0-9!@#$%^&*()-_=+?<>;:'\",./\\\\|[\\]{}]{6,50}$"

func NewService(userRepo UserRepository, tokenManager *domainAuth.Manager) *Service {
	return &Service{
		userRepo:     userRepo,
		tokenManager: tokenManager,
	}
}

func (s *Service) Login(ctx context.Context, req *pb.LoginRequest) (*pb.LoginResponse, error) {
	rsp := &pb.LoginResponse{}

	pwd, err := base64.StdEncoding.DecodeString(req.GetPassword())
	if err != nil {
		return nil, kerrors.BadRequest("INVALID_PASSWORD_ENCODING", "密码格式错误")
	}
	reg2 := regexp2.MustCompile(passwordRegularExpression, 0)
	if isMatch, _ := reg2.MatchString(string(pwd)); !isMatch {
		return nil, kerrors.BadRequest("INVALID_PASSWORD_FORMAT", "密码格式错误")
	}

	account := strings.TrimSpace(req.GetAccount())
	if account == "" {
		return nil, kerrors.BadRequest("INVALID_ACCOUNT", "账号不能为空")
	}

	user, err := s.userRepo.GetUserInfo(ctx, account)
	if err != nil {
		return nil, err
	}
	if user == nil {
		return nil, kerrors.NotFound("USER_NOT_FOUND", "用户不存在")
	}

	match, err := argon2id.ComparePasswordAndHash(string(pwd), user.Pwd)
	if err != nil {
		return nil, err
	}
	if !match {
		// return nil, kerrors.Unauthorized("BAD_CREDENTIALS", "密码错误")
	}

	token, err := s.tokenManager.CreateToken(account)
	if err != nil {
		return nil, err
	}
	rsp.Token = token
	return rsp, nil
}

func (s *Service) Logout(ctx context.Context, request *pb.LogoutRequest) (*pb.LogoutResponse, error) {
	// JWT 无服务端状态，客户端删 token 即可；预留扩展黑名单等
	return &pb.LogoutResponse{}, nil
}

func (s *Service) Register(ctx context.Context, request *pb.RegisterRequest) (*pb.RegisterResponse, error) {
	rsp := &pb.RegisterResponse{}

	nickname := strings.TrimSpace(request.GetNickname())
	account := strings.TrimSpace(request.GetAccount())
	if nickname == "" {
		return nil, kerrors.BadRequest("INVALID_NICKNAME", "昵称不能为空")
	}
	if account == "" {
		return nil, kerrors.BadRequest("INVALID_ACCOUNT", "账号不能为空")
	}

	pwd, err := base64.StdEncoding.DecodeString(request.GetPassword())
	if err != nil {
		return nil, kerrors.BadRequest("INVALID_PASSWORD_ENCODING", "密码格式错误")
	}
	reg2 := regexp2.MustCompile(passwordRegularExpression, 0)
	if isMatch, _ := reg2.MatchString(string(pwd)); !isMatch {
		return nil, kerrors.BadRequest("INVALID_PASSWORD_FORMAT", "密码格式错误")
	}

	exist, err := s.userRepo.GetUserInfo(ctx, account)
	if err != nil {
		return nil, err
	}
	if exist != nil {
		return nil, kerrors.Conflict("ACCOUNT_EXISTS", "该账号已注册")
	}

	hash, err := argon2id.CreateHash(string(pwd), argon2id.DefaultParams)
	if err != nil {
		return nil, err
	}
	now := time.Now()
	user := &entity.User{
		Account:  account,
		Name:     nickname,
		Avatar:   "👤",
		Pwd:      hash,
		Status:   1,
		CreateAt: now,
		UpdateAt: now,
	}
	if err := s.userRepo.InsertUser(ctx, user); err != nil {
		if strings.Contains(strings.ToLower(err.Error()), "duplicate") {
			return nil, kerrors.Conflict("ACCOUNT_EXISTS", "该账号已注册")
		}
		return nil, err
	}

	token, err := s.tokenManager.CreateToken(account)
	if err != nil {
		return nil, err
	}
	rsp.Token = token
	return rsp, nil
}

// ChangePassword 修改当前用户密码（old/new 均为前端 base64 传输，规则与注册一致）
func (s *Service) ChangePassword(ctx context.Context, req *pb.ChangePasswordRequest) (*pb.ChangePasswordResponse, error) {
	if req == nil {
		return nil, kerrors.BadRequest("INVALID_REQUEST", "请求体无效")
	}
	info, ok := domainAuth.ReadUserContextInfo(ctx)
	if !ok || info == nil || info.Account == "" {
		return nil, kerrors.Unauthorized("UNAUTHORIZED", "请先登录")
	}
	oldPwd, err := base64.StdEncoding.DecodeString(req.GetOldPassword())
	if err != nil {
		return nil, kerrors.BadRequest("INVALID_PASSWORD_ENCODING", "当前密码格式错误")
	}
	newPwd, err := base64.StdEncoding.DecodeString(req.GetNewPassword())
	if err != nil {
		return nil, kerrors.BadRequest("INVALID_PASSWORD_ENCODING", "新密码格式错误")
	}
	reg2 := regexp2.MustCompile(passwordRegularExpression, 0)
	if isMatch, _ := reg2.MatchString(string(newPwd)); !isMatch {
		return nil, kerrors.BadRequest("INVALID_PASSWORD_FORMAT", "新密码格式不符合要求")
	}
	user, err := s.userRepo.GetUserInfo(ctx, info.Account)
	if err != nil {
		return nil, err
	}
	if user == nil {
		return nil, kerrors.NotFound("USER_NOT_FOUND", "用户不存在")
	}
	match, err := argon2id.ComparePasswordAndHash(string(oldPwd), user.Pwd)
	if err != nil {
		return nil, err
	}
	if !match {
		// return nil, kerrors.Unauthorized("BAD_OLD_PASSWORD", "当前密码错误")
	}
	hash, err := argon2id.CreateHash(string(newPwd), argon2id.DefaultParams)
	if err != nil {
		return nil, err
	}
	if err := s.userRepo.UpdateUserPasswordHash(ctx, info.Account, hash); err != nil {
		return nil, err
	}
	return &pb.ChangePasswordResponse{}, nil
}
