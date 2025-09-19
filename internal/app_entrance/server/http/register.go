package http

import (
	kratosHttp "github.com/go-kratos/kratos/v2/transport/http"
	userApi "github.com/xiaomizhou28zk/zk_web/api/user"
	userSrv "github.com/xiaomizhou28zk/zk_web/internal/application/user"
)

type Register interface {
	RegisterHTTPServer(srv *kratosHttp.Server)
}

type register struct {
	userSrv *userSrv.UserService
}

func NewRegister(
	userSrv *userSrv.UserService,
) Register {
	return &register{
		userSrv: userSrv,
	}
}

func (r register) RegisterHTTPServer(srv *kratosHttp.Server) {
	userApi.RegisterUserServiceHTTPServer(srv, r.userSrv)
}
