package wire

import (
	"os"

	"github.com/go-kratos/kratos/v2"
	kratosHttp "github.com/go-kratos/kratos/v2/transport/http"
	"github.com/google/wire"
	"github.com/xiaomizhou28zk/zk_web/internal/app_entrance/server/http"
	articleApp "github.com/xiaomizhou28zk/zk_web/internal/application/article"
	authApp "github.com/xiaomizhou28zk/zk_web/internal/application/auth"
	commentApp "github.com/xiaomizhou28zk/zk_web/internal/application/comment"
	rankApp "github.com/xiaomizhou28zk/zk_web/internal/application/rank"
	userApp "github.com/xiaomizhou28zk/zk_web/internal/application/user"
	"github.com/xiaomizhou28zk/zk_web/internal/clients"
	"github.com/xiaomizhou28zk/zk_web/internal/config"
	domainAuth "github.com/xiaomizhou28zk/zk_web/internal/domain/auth"
	articleRepo "github.com/xiaomizhou28zk/zk_web/internal/repository/article"
	articleStorage "github.com/xiaomizhou28zk/zk_web/internal/repository/article/storage"
	commentRepo "github.com/xiaomizhou28zk/zk_web/internal/repository/comment"
	commentStorage "github.com/xiaomizhou28zk/zk_web/internal/repository/comment/storage"
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
	config.GetBlogMysqlConfig,
	config.GetAuthConfig,
)

var BaseClientProviderSet = wire.NewSet(
	clients.NewBlogMysqlClient,
)

var RepositoryProviderSet = wire.NewSet(
	userStorage.NewUserMysqlStorage,
	wire.Bind(new(userRepo.UserStorage), new(*userStorage.UserMysqlStorage)),
	userRepo.NewRepository,
	wire.Bind(new(userApp.UserRepository), new(*userRepo.Repository)),
	wire.Bind(new(authApp.UserRepository), new(*userRepo.Repository)),
	articleStorage.NewArticleMysqlStorage,
	wire.Bind(new(articleRepo.ArticleStorage), new(*articleStorage.ArticleMysqlStorage)),
	articleRepo.NewRepository,
	wire.Bind(new(articleApp.ArticleRepository), new(*articleRepo.Repository)),
	wire.Bind(new(rankApp.ArticleRankingQuery), new(*articleRepo.Repository)),
	commentStorage.NewCommentMysqlStorage,
	wire.Bind(new(commentRepo.CommentStorage), new(*commentStorage.CommentMysqlStorage)),
	commentStorage.NewReplyMysqlStorage,
	wire.Bind(new(commentRepo.ReplyStorage), new(*commentStorage.ReplyMysqlStorage)),
	commentRepo.NewRepository,
	wire.Bind(new(commentApp.CommentRepository), new(*commentRepo.Repository)),
)

var DomainServiceProviderSet = wire.NewSet(
	NewAuthManager,
)

// NewAuthManager 从配置创建 domain auth 的 JWT 管理器（供 wire 注入）
func NewAuthManager(authCfg config.Auth) *domainAuth.Manager {
	return domainAuth.NewManager(authCfg.JWTSecret, authCfg.TokenVersion)
}

var APPServiceProviderSet = wire.NewSet(
	userApp.NewUserService,
	authApp.NewService,
	rankApp.NewService,
	commentApp.NewService,
	articleApp.NewService,
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
