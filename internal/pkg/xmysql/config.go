package xmysql

import (
	"errors"
)

type Config struct {
	DBName      string `json:"db_name" yaml:"db_name"`
	GroupConfig `yaml:"config"`
}

func (c Config) Validate() error {
	if c.DBName == "" {
		return errors.New("db_name not allow empty")
	}
	return nil
}
