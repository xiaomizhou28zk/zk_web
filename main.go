package main

import (
	"github.com/go-kratos/kratos/v2"
	"github.com/go-kratos/kratos/v2/log"
	"github.com/go-kratos/kratos/v2/transport/http"
	pb "github.com/xiaomizhou28zk/zk_web/api/user"
	"github.com/xiaomizhou28zk/zk_web/internal/application/user"
	pkgLog "github.com/xiaomizhou28zk/zk_web/internal/pkg/log"
)

func main() {
	globalLogger, err := pkgLog.InitGlobalLogger("./log")
	if err != nil {
		log.Fatal(err)
	}

	userService := user.NewUserService()

	httpSrv := http.NewServer(http.Address(":8080"))

	pb.RegisterUserServiceHTTPServer(httpSrv, userService)

	app := kratos.New(
		kratos.Name("user-service"),
		kratos.Logger(globalLogger),
		kratos.Server(
			httpSrv,
		),
	)

	if err = app.Run(); err != nil {
		pkgLog.Error("failed to run app: %v", err)
	}
}
