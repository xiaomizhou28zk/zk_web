//go:build wireinject
// +build wireinject

package wire

import (
	"github.com/go-kratos/kratos/v2"
	"github.com/google/wire"
)

// WireServer init kratos application.
func WireServer() (*kratos.App, func(), error) {
	panic(wire.Build(
		ConfigProviderSet,
		BaseClientProviderSet,
		RepositoryProviderSet,
		DomainServiceProviderSet,
		APPServiceProviderSet,
		ServerProviderSet,
		newServer,
	))
}
