package main

import (
	"github.com/xiaomizhou28zk/zk_web/cmd/wire"
	"github.com/xiaomizhou28zk/zk_web/internal/config"
	_ "github.com/xiaomizhou28zk/zk_web/internal/pkg/log"
)

func main() {
	err := config.Load("configs/debug/config.yaml")
	if err != nil {
		panic(err)
	}

	app, cleanup, err := wire.WireServer()
	if err != nil {
		panic(err)
	}
	defer func() {
		cleanup()
	}()

	if err = app.Run(); err != nil {
		panic(err)
	}
}
