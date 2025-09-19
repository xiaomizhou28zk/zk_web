package http

import (
	kratosHttp "github.com/go-kratos/kratos/v2/transport/http"
)

func NewServer(register Register) *kratosHttp.Server {
	srv := kratosHttp.NewServer(
		kratosHttp.Address(":8080"),
	)
	register.RegisterHTTPServer(srv)
	return srv
}
