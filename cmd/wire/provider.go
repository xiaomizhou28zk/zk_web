package wire

import (
	"os"

	"github.com/go-kratos/kratos/v2"
	kratosHttp "github.com/go-kratos/kratos/v2/transport/http"
	"github.com/google/wire"
	"github.com/xiaomizhou28zk/zk_web/internal/app_entrance/server/http"
	"github.com/xiaomizhou28zk/zk_web/internal/application/user"
)

var (
	// Name is the name of the compiled software.
	Name string
	// Version is the version of the compiled software.
	Version string
	id, _   = os.Hostname()
)

var ConfigProviderSet = wire.NewSet()

var BaseClientProviderSet = wire.NewSet()

var RepositoryProviderSet = wire.NewSet()

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
