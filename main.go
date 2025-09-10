package main

import (
	//"book-demo/handler"
	pb "github.com/xiaomizhou28zk/zk_web/api/user" // 导入生成的路由代码
	"github.com/gin-gonic/gin"
)

func main() {
	r := gin.Default()

	// 注册生成的路由，并绑定实际处理器
	pb.RegisterBookServiceHandlers(r, &pb.BookServiceHandlers{
		GetBookList: handler.GetBookList, // 绑定获取列表的处理器
		GetBook:     handler.GetBook,     // 绑定获取单本书的处理器
	})

	// 启动HTTP服务
	r.Run(":8080")
}
