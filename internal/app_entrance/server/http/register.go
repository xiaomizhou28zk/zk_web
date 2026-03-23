package http

import (
	kratosHttp "github.com/go-kratos/kratos/v2/transport/http"
	articleApi "github.com/xiaomizhou28zk/zk_web/api/article"
	authApi "github.com/xiaomizhou28zk/zk_web/api/auth"
	commentApi "github.com/xiaomizhou28zk/zk_web/api/comment"
	rankApi "github.com/xiaomizhou28zk/zk_web/api/rank"
	userApi "github.com/xiaomizhou28zk/zk_web/api/user"
	articleSrv "github.com/xiaomizhou28zk/zk_web/internal/application/article"
	authSrv "github.com/xiaomizhou28zk/zk_web/internal/application/auth"
	commentSrv "github.com/xiaomizhou28zk/zk_web/internal/application/comment"
	rankSrv "github.com/xiaomizhou28zk/zk_web/internal/application/rank"
	userSrv 	"github.com/xiaomizhou28zk/zk_web/internal/application/user"
	domainAuth "github.com/xiaomizhou28zk/zk_web/internal/domain/auth"
)

type Register interface {
	RegisterHTTPServer(srv *kratosHttp.Server)
}

type register struct {
	userSrv    *userSrv.UserService
	authSrv    *authSrv.Service
	rankSrv    *rankSrv.Service
	commentSrv *commentSrv.Service
	articleSrv *articleSrv.Service
	authMgr    *domainAuth.Manager
}

func NewRegister(
	userSrv *userSrv.UserService,
	authSrv *authSrv.Service,
	rankSrv *rankSrv.Service,
	commentSrv *commentSrv.Service,
	articleSrv *articleSrv.Service,
	authMgr *domainAuth.Manager,
) Register {
	return &register{
		userSrv:    userSrv,
		authSrv:    authSrv,
		rankSrv:    rankSrv,
		commentSrv: commentSrv,
		articleSrv: articleSrv,
		authMgr:    authMgr,
	}
}

func (r register) RegisterHTTPServer(srv *kratosHttp.Server) {
	RegisterUploadRoutesAndStatic(srv, r.authMgr)
	userApi.RegisterUserServiceHTTPServer(srv, r.userSrv)
	authApi.RegisterAuthServiceHTTPServer(srv, r.authSrv)
	rankApi.RegisterRankingServiceHTTPServer(srv, r.rankSrv)
	commentApi.RegisterCommentServiceHTTPServer(srv, r.commentSrv)
	articleApi.RegisterArticleServiceHTTPServer(srv, r.articleSrv)
	RegisterFrontendSite(srv)
}
