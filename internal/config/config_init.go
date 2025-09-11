package config

import (
	"errors"
	"fmt"
	"os"
	"sync"
	"time"

	"github.com/fsnotify/fsnotify"
	"github.com/xiaomizhou28zk/zk_web/internal/pkg/xmysql"
	"gopkg.in/yaml.v3"
)

// Config 配置结构体（与之前保持一致）
type Config struct {
	Mysql Mysql `yaml:"mysql"`
}

type Mysql struct {
	User xmysql.Config `yaml:"user"`
}

// 全局配置实例（通过指针原子更新）
var (
	globalConfig *Config
	rwMu         sync.RWMutex // 读写锁保护配置访问
)

// Load 加载配置并启动热加载监控
func Load(path string) error {
	// 首次加载配置
	cfg, err := parseConfig(path)
	if err != nil {
		return fmt.Errorf("首次加载配置失败: %w", err)
	}

	// 初始化全局配置
	rwMu.Lock()
	globalConfig = cfg
	rwMu.Unlock()

	// 启动文件监控（热加载）
	go watchConfig(path)
	return nil
}

// Get 获取当前配置（线程安全）
func Get() *Config {
	rwMu.RLock()
	defer rwMu.RUnlock()
	return globalConfig // 返回指针的副本（安全，因为结构体字段不会被直接修改）
}

// parseConfig 解析 YAML 配置文件
func parseConfig(path string) (*Config, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, fmt.Errorf("读取文件失败: %w", err)
	}

	var cfg Config
	if err := yaml.Unmarshal(data, &cfg); err != nil {
		return nil, fmt.Errorf("解析 YAML 失败: %w", err)
	}
	return &cfg, nil
}

// watchConfig 监控配置文件变化，触发热加载
func watchConfig(path string) error {
	// 创建监控器
	watcher, err := fsnotify.NewWatcher()
	if err != nil {
		return fmt.Errorf("创建监控器失败: %w", err)
	}
	defer watcher.Close()

	// 添加监控路径
	if err := watcher.Add(path); err != nil {
		return fmt.Errorf("添加监控文件失败: %w", err)
	}

	// 防抖动计时器（避免文件频繁修改导致多次加载）
	debounceTimer := time.NewTimer(0)
	defer debounceTimer.Stop()

	for {
		select {
		case event, ok := <-watcher.Events:
			if !ok {
				return errors.New("监控事件通道关闭")
			}

			// 只处理文件修改或写入完成事件
			if event.Op&fsnotify.Write == fsnotify.Write || event.Op&fsnotify.Remove == fsnotify.Remove {
				// 重置防抖动计时器（100ms 内多次修改只触发一次）
				debounceTimer.Reset(100 * time.Millisecond)
			}

		case err, ok := <-watcher.Errors:
			if !ok {
				return errors.New("监控错误通道关闭")
			}
			fmt.Printf("配置监控错误: %v\n", err)

		case <-debounceTimer.C:
			// 计时器触发，重新加载配置
			newCfg, err := parseConfig(path)
			if err != nil {
				fmt.Printf("热加载配置失败: %v\n", err)
				continue
			}

			// 原子更新全局配置（写锁保证线程安全）
			rwMu.Lock()
			globalConfig = newCfg
			rwMu.Unlock()

			fmt.Println("配置已热更新")
		}
	}
}
