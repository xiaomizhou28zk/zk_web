package xmysql

import (
	"time"

	_ "github.com/go-sql-driver/mysql"
	"github.com/pkg/errors"
	"xorm.io/xorm"
)

// Client 单实例客户端
type Client interface {
	xorm.EngineInterface
	Transaction(f func(*xorm.Session) (interface{}, error)) (interface{}, error)
	GetEngine() *xorm.Engine
}

// GroupClient 主从集群客户端
type GroupClient interface {
	xorm.EngineInterface
	Transaction(f func(*xorm.Session) (interface{}, error)) (interface{}, error)
	GetEngineGroup() *xorm.EngineGroup
	Master() *xorm.Engine
	Slave() *xorm.Engine
	Slaves() []*xorm.Engine
}

type simpleClient struct {
	*xorm.Engine
}

func (cli *simpleClient) GetEngine() *xorm.Engine {
	return cli.Engine
}

func (cli *simpleClient) Transaction(f func(*xorm.Session) (interface{}, error)) (interface{}, error) {
	return cli.Engine.Transaction(f)
}

type SimpleConfig struct {
	MaxIdle     int    `json:"max_idle" mapstructure:"max_idle"`
	MaxOpen     int    `json:"max_open" mapstructure:"max_open"`
	MaxLifetime int    `json:"max_lifetime" mapstructure:"max_lifetime"`
	Dsn         string `json:"dsn" mapstructure:"dsn"`
	IsDebug     bool   `json:"is_debug" mapstructure:"is_debug"`
}

func newEngine(cfg SimpleConfig) (*xorm.Engine, error) {
	engine, err := xorm.NewEngine("mysql", cfg.Dsn)
	if err != nil {
		return nil, errors.WithStack(err)
	}
	if err := engine.Ping(); err != nil {
		return nil, errors.WithStack(err)
	}
	if cfg.IsDebug {
		engine.ShowSQL(true)
	}
	if cfg.MaxIdle > 0 {
		engine.SetMaxIdleConns(cfg.MaxIdle)
	}
	if cfg.MaxOpen > 0 {
		engine.SetMaxOpenConns(cfg.MaxOpen)
	}
	if cfg.MaxLifetime > 0 {
		engine.SetConnMaxLifetime(time.Duration(cfg.MaxLifetime) * time.Second)
	}
	// dsnCfg, _ := mysql.ParseDSN(cfg.Dsn)
	// dsnCfg.Passwd = ""
	// engine.AddHook(hooks.NewTracingHook(dsnCfg.FormatDSN()))
	return engine, nil
}

func NewSimpleClient(cfg SimpleConfig) (Client, func(), error) {
	engine, err := newEngine(cfg)
	if err != nil {
		return nil, nil, err
	}
	client := &simpleClient{Engine: engine}
	return client, func() {
		_ = client.Close()
	}, nil
}

type groupClient struct {
	*xorm.EngineGroup
}

func (cli *groupClient) GetEngineGroup() *xorm.EngineGroup {
	return cli.EngineGroup
}

func (cli *groupClient) Transaction(f func(*xorm.Session) (interface{}, error)) (interface{}, error) {
	return cli.EngineGroup.Transaction(f)
}

func (cli *groupClient) Master() *xorm.Engine {
	return cli.EngineGroup.Master()
}

func (cli *groupClient) Slave() *xorm.Engine {
	return cli.EngineGroup.Slave()
}

func (cli *groupClient) Slaves() []*xorm.Engine {
	return cli.EngineGroup.Slaves()
}

type GroupConfig struct {
	MaxIdle     int `json:"max_idle" mapstructure:"max_idle" yaml:"max_idle"`
	MaxOpen     int `json:"max_open" mapstructure:"max_open" yaml:"max_open"`
	MaxLifetime int `json:"max_lifetime" mapstructure:"max_lifetime" yaml:"max_lifetime"`
	Master      struct {
		Dsn string `json:"dsn" mapstructure:"dsn" yaml:"dsn"`
	} `json:"master" mapstructure:"master" yaml:"master"`
	Slaves []struct {
		Dsn string `json:"dsn" mapstructure:"dsn" yaml:"dsn"`
	} `json:"slaves" mapstructure:"slaves" yaml:"slaves"`
	IsDebug bool `json:"is_debug" mapstructure:"is_debug" yaml:"is_debug"`
}

func newEngineGroup(cfg GroupConfig) (*xorm.EngineGroup, error) {
	masterEngine, err := xorm.NewEngine("mysql", cfg.Master.Dsn)
	if err != nil {
		return nil, errors.WithStack(err)
	}
	if err := masterEngine.Ping(); err != nil {
		return nil, errors.WithStack(err)
	}
	if cfg.IsDebug {
		masterEngine.ShowSQL(true)
	}
	var slaveEngines []*xorm.Engine
	for _, slave := range cfg.Slaves {
		slaveEngine, err := xorm.NewEngine("mysql", slave.Dsn)
		if err != nil {
			return nil, errors.WithStack(err)
		}
		if err := slaveEngine.Ping(); err != nil {
			return nil, errors.WithStack(err)
		}
		if cfg.IsDebug {
			slaveEngine.ShowSQL(true)
		}
		slaveEngines = append(slaveEngines, slaveEngine)
	}
	engineGroup, err := xorm.NewEngineGroup(masterEngine, slaveEngines, xorm.RandomPolicy())
	if err != nil {
		return nil, errors.WithStack(err)
	}
	if cfg.MaxIdle > 0 {
		engineGroup.SetMaxIdleConns(cfg.MaxIdle)
	}
	if cfg.MaxOpen > 0 {
		engineGroup.SetMaxOpenConns(cfg.MaxOpen)
	}
	if cfg.MaxLifetime > 0 {
		engineGroup.SetConnMaxLifetime(time.Duration(cfg.MaxLifetime) * time.Second)
	}
	// dsnCfg, _ := mysql.ParseDSN(cfg.Master.Dsn)
	// dsnCfg.Passwd = ""
	// engineGroup.AddHook(hooks.NewTracingHook(dsnCfg.FormatDSN()))
	return engineGroup, nil
}

func NewGroupClient(cfg GroupConfig) (GroupClient, func(), error) {
	engineGroup, err := newEngineGroup(cfg)
	if err != nil {
		return nil, nil, err
	}
	client := &groupClient{EngineGroup: engineGroup}
	return client, func() {
		_ = engineGroup.Close()
	}, nil
}
