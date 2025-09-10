package log

import (
	"fmt"
	"os"
	"path/filepath"
	"time"

	"github.com/go-kratos/kratos/v2/log"
)

// globalLogger 全局日志对象
var globalLogger log.Logger

// InitGlobalLogger 初始化全局日志（写入文件）
func InitGlobalLogger(logDir string) (log.Logger, error) {
	// 确保日志目录存在
	if err := os.MkdirAll(logDir, 0o755); err != nil {
		return nil, err
	}

	// 日志文件名（带日期，便于按天分割）
	logFileName := time.Now().Format("2006-01-02") + ".log"
	logFilePath := filepath.Join(logDir, logFileName)

	// 打开日志文件（不存在则创建，存在则追加）
	file, err := os.OpenFile(logFilePath, os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0o644)
	if err != nil {
		return nil, err
	}

	// 创建文件日志写入器
	fileLogger := log.NewStdLogger(file)

	// 包装日志，添加全局字段（服务名、时间戳、调用位置）
	globalLogger = log.With(fileLogger,
		"service", "zk-web",
		"timestamp", log.DefaultTimestamp,
		"caller", log.DefaultCaller,
	)

	return globalLogger, nil
}

// 封装日志级别便捷方法（适配 Kratos 新版本日志接口）
func Debug(format string, a ...any) {
	_ = globalLogger.Log(log.LevelDebug, "DEBUG", fmt.Sprintf(format, a...))
	fmt.Sprintf("%d", 1)
}

func Info(format string, a ...any) {
	_ = globalLogger.Log(log.LevelInfo, "INFO", fmt.Sprintf(format, a...))
}

func Warn(format string, a ...any) {
	_ = globalLogger.Log(log.LevelWarn, "WARN", fmt.Sprintf(format, a...))
}

func Error(format string, a ...any) {
	_ = globalLogger.Log(log.LevelError, "WARN", fmt.Sprintf(format, a...))
}
