#!/usr/bin/make -f

# 源文件目录（存放.proto文件）
API_PROTO_DIR := ./api
# 查找所有.proto文件
API_PROTO_FILES := $(shell find $(API_PROTO_DIR) -name "*.proto")

# 第三方依赖目录（如google/api/annotations.proto）
THIRD_PARTY_DIR := ./third_party

# 默认目标：生成所有代码
all: api

# 生成代码目标
api:
	@echo "Generating code from proto files in $(API_PROTO_DIR)..."
	protoc \
		--proto_path=$(API_PROTO_DIR) \           # 源文件根目录
		--proto_path=$(THIRD_PARTY_DIR) \         # 第三方依赖目录
		--go_out=paths=source_relative:$(API_PROTO_DIR) \  # 生成Go结构体代码（同目录）
		--go-http_out=paths=source_relative:$(API_PROTO_DIR) \  # 生成HTTP接口代码（同目录）
		--openapi_out=fq_schema_naming=true,naming=proto,default_response=false:$(API_PROTO_DIR) \  # OpenAPI文档
		--validate_out=paths=source_relative,lang=go:$(API_PROTO_DIR) \  # 验证逻辑代码
		$(API_PROTO_FILES)

	@echo "Post-processing generated files..."
	# 移除生成代码中的omitempty标签（可选，根据需求调整）
	@find $(API_PROTO_DIR) -name '*.pb.go' -not -path '*/vendor/*' | xargs -n1 -IX bash -c 'sed s/,omitempty// X > X.tmp && mv X{.tmp,}'

	@echo "Code generation completed. Files are in $(API_PROTO_DIR) with source-relative paths."

# 启动Web服务
run:
	@echo "Starting Gin web server..."
	go run main.go server

# 清理生成的代码
clean:
	@echo "Cleaning generated files..."
	# 删除所有.pb.go和.http.go文件（保留源.proto）
	@find $(API_PROTO_DIR) -name '*.pb.go' -not -path '*/vendor/*' -delete
	@find $(API_PROTO_DIR) -name '*.http.go' -not -path '*/vendor/*' -delete
	@find $(API_PROTO_DIR) -name '*.validate.go' -not -path '*/vendor/*' -delete
	@rm -rf $(API_PROTO_DIR)/*.openapi.json  # 删除OpenAPI文档
	@echo "Clean completed."

# 伪目标声明
.PHONY: all generate run clean
