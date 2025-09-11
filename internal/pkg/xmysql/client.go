package xmysql

import (
	"fmt"
)

type GClient GroupClient

type client struct {
	cfg Config
	GroupClient
}

func NewClient(cfg Config) (GClient, func(), error) {
	c := &client{cfg: cfg}
	if err := c.cfg.Validate(); err != nil {
		return nil, nil, fmt.Errorf("xmysql new client failed. %s,cfg %+v", err.Error(), cfg)
	}
	defer func() {
	}()
	var (
		cleanup func()
		err     error
	)
	c.GroupClient, cleanup, err = NewGroupClient(cfg.GroupConfig)
	if err != nil {
		return nil, nil, err
	}
	return c, cleanup, nil
}
