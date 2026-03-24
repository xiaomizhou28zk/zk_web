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
	Mysql    Mysql    `yaml:"mysql"`
	Auth     Auth     `yaml:"auth"`
	Featured Featured `yaml:"featured"`
	Server   Server   `yaml:"server"`
}

// Server HTTP/HTTPS 监听；明文见 HTTP，TLS 见 HTTPS
type Server struct {
	HTTP  HTTPPlain `yaml:"http"`
	HTTPS *HTTPSTLS `yaml:"https"`
}

// HTTPPlain 明文 HTTP；未写 enabled 时默认开启（兼容旧配置不写 http 段）
type HTTPPlain struct {
	Addr    string // 监听地址，如 :8080，空则 GetServerConfig 中默认 :8080
	Enabled *bool  // nil=默认 true；显式 false 时关闭明文 HTTP（须 https 可用）
}

// UnmarshalYAML 修正 gopkg.in/yaml.v3 将 enabled: false 解到 *bool 时常得到 nil 的问题，
// 导致 PlainHTTPOn 误判为「未配置」而默认开启 8080。
func (h *HTTPPlain) UnmarshalYAML(n *yaml.Node) error {
	var m map[string]interface{}
	if err := n.Decode(&m); err != nil {
		return err
	}
	if v, ok := m["addr"]; ok {
		h.Addr = fmt.Sprint(v)
	}
	if v, ok := m["enabled"]; ok {
		switch b := v.(type) {
		case bool:
			x := b
			h.Enabled = &x
		default:
			return fmt.Errorf("server.http.enabled 须为布尔值，当前为 %T", v)
		}
	}
	return nil
}

// PlainHTTPOn 是否启动明文 HTTP 端口
func (h HTTPPlain) PlainHTTPOn() bool {
	if h.Enabled == nil {
		return true
	}
	return *h.Enabled
}

// HTTPSTLS 启用后会在 Addr 上监听 TLS（如 :8443），需有效 cert/key 文件
type HTTPSTLS struct {
	Enabled  bool   `yaml:"enabled"`
	Addr     string `yaml:"addr"`      // 如 :8443，空则默认 :8443
	CertFile string `yaml:"cert_file"` // PEM 证书
	KeyFile  string `yaml:"key_file"`  // PEM 私钥
}

type Mysql struct {
	Blog xmysql.Config `yaml:"blog"`
}

// Featured 推荐精选配置
type Featured struct {
	ArticleIDs []int64 `yaml:"article_ids"` // 精选文章 ID 列表，如 [91,92,...,100]
}

// Auth 鉴权相关配置
type Auth struct {
	JWTSecret    string `yaml:"jwt_secret"`    // JWT 签名密钥
	TokenVersion string `yaml:"token_version"` // Token 载体版本号，默认 "1"
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

// GetServerConfig 供 Wire 注入；带默认值，避免 yaml 未写 server 段时行为异常
func GetServerConfig() Server {
	c := Get()
	if c == nil {
		return defaultServerConfig()
	}
	s := c.Server
	if s.HTTP.Addr == "" {
		s.HTTP.Addr = ":8080"
	}
	if s.HTTPS != nil && s.HTTPS.Enabled && s.HTTPS.Addr == "" {
		s.HTTPS.Addr = ":8443"
	}
	return s
}

func defaultServerConfig() Server {
	return Server{HTTP: HTTPPlain{Addr: ":8080"}}
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
