# 第一阶段：编译Golang程序
FROM golang:1.20-alpine AS builder

# 安装git工具（Alpine默认没有git）
RUN apk add --no-cache git

# 设置工作目录
WORKDIR /app

# 从Git仓库克隆代码
# 替换为你的Git仓库地址
RUN git clone https://github.com/your-username/your-repo.git .

# 可选：如果需要特定分支或标签
# RUN git checkout your-branch-or-tag

# 下载依赖
RUN go mod download

# 编译程序
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o server .

# 第二阶段：运行
FROM alpine:3.17

# 安装必要的运行时依赖（如果需要）
RUN apk add --no-cache ca-certificates

# 创建工作目录
WORKDIR /app

# 复制编译好的程序
COPY --from=builder /app/server /app/

# 复制所有其他文件（配置、证书等）
COPY --from=builder /app/ /app/

# 暴露端口
EXPOSE 8080 8443

# 运行程序（注意：这里要使用编译生成的可执行文件名server）
CMD ["/app/server"]
