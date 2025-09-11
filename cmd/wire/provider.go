package wire

import (
	"os"

	"github.com/go-kratos/kratos/v2"
	kratosHttp "github.com/go-kratos/kratos/v2/transport/http"
	"github.com/google/wire"
	"github.com/xiaomizhou28zk/zk_web/internal/app_entrance/server/http"
	"github.com/xiaomizhou28zk/zk_web/internal/application/user"
	userApp "github.com/xiaomizhou28zk/zk_web/internal/application/user"
	"github.com/xiaomizhou28zk/zk_web/internal/clients"
	"github.com/xiaomizhou28zk/zk_web/internal/config"
	userRepo "github.com/xiaomizhou28zk/zk_web/internal/repository/user"
	userStorage "github.com/xiaomizhou28zk/zk_web/internal/repository/user/storage"
)

var (
	// Name is the name of the compiled software.
	Name string
	// Version is the version of the compiled software.
	Version string
	id, _   = os.Hostname()
)

var ConfigProviderSet = wire.NewSet(
	config.GetUserMysqlConfig,
)

var BaseClientProviderSet = wire.NewSet(
	clients.NewUserMysqlClient,
)

var RepositoryProviderSet = wire.NewSet(
	userStorage.NewUserMysqlStorage,
	wire.Bind(new(userRepo.UserStorage), new(*userStorage.UserMysqlStorage)),
	userRepo.NewRepository,
	wire.Bind(new(userApp.UserRepository), new(*userRepo.Repository)),
)

var DomainServiceProviderSet = wire.NewSet()

var APPServiceProviderSet = wire.NewSet(
	user.NewUserService,
)

var ServerProviderSet = wire.NewSet(
	http.NewServer,
	http.NewRegister,
)

func newServer(hs *kratosHttp.Server) *kratos.App {
	return kratos.New(
		kratos.ID(id),
		kratos.Name(Name),
		kratos.Version(Version),
		kratos.Metadata(map[string]string{}),
		kratos.Server(
			hs,
		),
	)
}
