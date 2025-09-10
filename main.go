package main

import (
	"github.com/xiaomizhou28zk/zk_web/cmd/wire"
	_ "github.com/xiaomizhou28zk/zk_web/internal/pkg/log"
)

func main() {
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
