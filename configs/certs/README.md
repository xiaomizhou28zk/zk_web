# TLS 开发证书

1. 在项目根目录执行：

   ```bash
   chmod +x scripts/gen-dev-cert.sh
   ./scripts/gen-dev-cert.sh
   ```

2. 在 `configs/debug/config.yaml` 中设置 **`server.https.enabled: true`**（为 `false` 时 **不会监听 8443**，会出现 `ERR_CONNECTION_REFUSED`）。仅 HTTPS 时再加 **`server.http.enabled: false`**。

3. 重启服务，控制台应出现 `[http] HTTPS 已启用，将监听 :8443…`。浏览器打开 **`https://127.0.0.1:8443/`**（须 **https**，不是 http）。

TLS 必须 **同时** 有 `server.crt`（证书）和 `server.key`（私钥）；只有 key 没有 crt 时也会跳过 HTTPS。`gen-dev-cert.sh` 会一次生成这两个文件。

若 `enabled=true` 但文件不齐，进程仍会启动，**仅监听 HTTP**；日志会标明 crt/key 各自是否存在。

`server.crt` / `server.key` 已加入 `.gitignore`，勿提交私钥到仓库。

生产环境请使用正规 CA 或内部 PKI 签发的证书，并配置 `cert_file` / `key_file` 路径。
