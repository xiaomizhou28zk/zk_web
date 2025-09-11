# 第一阶段：编译Golang程序
FROM golang:1.24-alpine AS builder

# 设置工作目录
WORKDIR /app

# 复制当前目录下的所有文件到工作目录
COPY . .

RUN ls -la /app

# 编译程序
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o server .

# 第二阶段：运行
FROM alpine:3.17

# 创建工作目录
WORKDIR /app

# 复制编译好的程序
COPY --from=builder /app/server /app/

# 复制所有其他文件（包括证书等）
COPY --from=builder /app/ /app/

# 暴露端口
EXPOSE 8080 8443

# 运行程序
CMD ["/app/hello-world"]