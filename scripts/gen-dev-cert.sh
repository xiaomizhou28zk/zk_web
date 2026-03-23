#!/usr/bin/env bash
# 生成本地开发用自签名证书（RSA 2048，365 天），写入 configs/certs/
# 注意：openssl -subj 用 / 分隔 RDN，Organization 等取值里不要写未转义的 /
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/configs/certs"
mkdir -p "$OUT"
openssl req -x509 -newkey rsa:2048 -sha256 -days 365 -nodes \
  -keyout "$OUT/server.key" \
  -out "$OUT/server.crt" \
  -subj "/CN=127.0.0.1/O=zk_web"
echo "已写入: $OUT/server.crt  $OUT/server.key"
echo "请在 configs/debug/config.yaml 中将 server.https.enabled 设为 true"
