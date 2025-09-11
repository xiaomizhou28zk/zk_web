#!/usr/bin/make -f

# 项目根目录（scripts的上级目录）
ROOT_DIR := $(abspath $(dir $(lastword $(MAKEFILE_LIST)))/..)

# 源文件和输出目录
API_PROTO_DIR := $(ROOT_DIR)/api
THIRD_PARTY_DIR := $(ROOT_DIR)/third_party

# 第三方依赖URL
GOOGLE_API_URL := https://raw.githubusercontent.com/googleapis/googleapis/master/google/api
VALIDATE_PROTO_URL := https://raw.githubusercontent.com/envoyproxy/protoc-gen-validate/main/validate

# 查找所有.proto文件
API_PROTO_FILES := $(shell find $(API_PROTO_DIR) -name "*.proto" 2>/dev/null)

# 检查必要的工具是否存在
CHECK_TOOLS := protoc protoc-gen-go protoc-gen-go-http protoc-gen-openapi protoc-gen-validate curl

# 默认目标
all: check-tools install-deps api


init:
	go install google.golang.org/protobuf/cmd/protoc-gen-go@v1.28.1
	go install google.golang.org/grpc/cmd/protoc-gen-go-grpc@v1.2.0
	go install github.com/go-kratos/kratos/cmd/kratos/v2@latest
	go install github.com/go-kratos/kratos/cmd/protoc-gen-go-http/v2@latest
	go install github.com/favadi/protoc-go-inject-tag@latest
	go install github.com/google/gnostic/cmd/protoc-gen-openapi@v0.6.9
	go install github.com/golang/mock/mockgen@v1.6.0
	go install xorm.io/reverse@latest
	go install github.com/hisheng/xormmodel@latest
	go install github.com/envoyproxy/protoc-gen-validate@latest
	go install mvdan.cc/gofumpt@latest
	go install codeup.aliyun.com/qimao/go-contrib/protoc-gen-go-enum@latest
	go install github.com/pseudomuto/protoc-gen-doc/cmd/protoc-gen-doc@latest

# 检查工具是否安装
check-tools:
	@echo "Checking required tools..."
	@for tool in $(CHECK_TOOLS); do \
		if ! command -v $$tool &> /dev/null; then \
			echo "Error: $$tool is not installed. Please install it first."; \
			exit 1; \
		fi \
	done
	@echo "All required tools are installed."

# 安装第三方proto依赖
install-deps:
	@echo "Installing third-party proto dependencies..."
	@mkdir -p $(THIRD_PARTY_DIR)/google/api $(THIRD_PARTY_DIR)/validate
	@curl -sSL $(GOOGLE_API_URL)/annotations.proto -o $(THIRD_PARTY_DIR)/google/api/annotations.proto
	@curl -sSL $(GOOGLE_API_URL)/http.proto -o $(THIRD_PARTY_DIR)/google/api/http.proto
	@curl -sSL $(VALIDATE_PROTO_URL)/validate.proto -o $(THIRD_PARTY_DIR)/validate/validate.proto
	@echo "Third-party dependencies installed successfully."

# 生成代码目标
api: $(API_PROTO_FILES)
	@if [ -z "$(API_PROTO_FILES)" ]; then \
		echo "Error: No .proto files found in $(API_PROTO_DIR)"; \
		exit 1; \
	fi
	@echo "Generating code from proto files..."
	protoc \
		--proto_path=$(API_PROTO_DIR) \
		--proto_path=$(THIRD_PARTY_DIR) \
		--go_out=paths=source_relative:$(API_PROTO_DIR) \
		--go-http_out=paths=source_relative:$(API_PROTO_DIR) \
		--openapi_out=fq_schema_naming=true,naming=proto,default_response=false:$(API_PROTO_DIR) \
		--validate_out=paths=source_relative,lang=go:$(API_PROTO_DIR) \
		$(API_PROTO_FILES)

	@echo "Post-processing generated files..."
	@find $(API_PROTO_DIR) -name '*.pb.go' -not -path '*/vendor/*' | xargs -n1 -IX bash -c 'sed s/,omitempty// X > X.tmp && mv X{.tmp,}' 2>/dev/null

	@echo "Code generation completed successfully."

# 启动服务
run:
	@echo "Starting Gin web server..."
	@cd $(ROOT_DIR) && go run main.go server

# 清理生成文件
clean:
	@echo "Cleaning generated files..."
	@find $(API_PROTO_DIR) -name '*.pb.go' -not -path '*/vendor/*' -delete 2>/dev/null
	@find $(API_PROTO_DIR) -name '*.http.go' -not -path '*/vendor/*' -delete 2>/dev/null
	@find $(API_PROTO_DIR) -name '*.validate.go' -not -path '*/vendor/*' -delete 2>/dev/null
	@rm -rf $(API_PROTO_DIR)/*.openapi.json 2>/dev/null
	@echo "Clean completed."

# 清理依赖
clean-deps:
	@echo "Removing third-party dependencies..."
	@rm -rf $(THIRD_PARTY_DIR)
	@echo "Third-party dependencies removed."

# generate
generate:
	go mod tidy
	GOFLAGS=-mod=mod go generate ./...
	#make fmt

# generate 缩写
gen:
	make generate


# 伪目标声明
.PHONY: all check-tools install-deps api run clean clean-deps generate gen
