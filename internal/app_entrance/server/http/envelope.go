package http

import (
	"encoding/json"
	nethttp "net/http"

	kerrors "github.com/go-kratos/kratos/v2/errors"
	kratosHttp "github.com/go-kratos/kratos/v2/transport/http"
)

// unifiedResponseEncoder 将 handler 返回值包进 { code, msg, data }
func unifiedResponseEncoder(w nethttp.ResponseWriter, r *nethttp.Request, v any) error {
	if v == nil {
		return writeEnvelopeWithHTTP(w, nethttp.StatusOK, 0, "", emptyJSONObject)
	}
	if rd, ok := v.(kratosHttp.Redirector); ok {
		url, code := rd.Redirect()
		nethttp.Redirect(w, r, url, code)
		return nil
	}
	payload, err := json.Marshal(v)
	if err != nil {
		return err
	}
	return writeEnvelopeWithHTTP(w, nethttp.StatusOK, 0, "", payload)
}

var emptyJSONObject = json.RawMessage("{}")

// WriteEnvelopeJSON 自定义 Handler 写入与统一 API 相同的 { code, msg, data }；bizCode≠0 时 data 可为 nil（输出空对象）。
func WriteEnvelopeJSON(w nethttp.ResponseWriter, bizCode int, msg string, data any) error {
	httpStatus := nethttp.StatusOK
	if bizCode != 0 && bizCode >= 400 && bizCode <= 599 {
		httpStatus = bizCode
	}
	if bizCode != 0 {
		if msg == "" {
			msg = "请求失败"
		}
		return writeEnvelopeWithHTTP(w, httpStatus, bizCode, msg, emptyJSONObject)
	}
	if data == nil {
		return writeEnvelopeWithHTTP(w, httpStatus, 0, "", emptyJSONObject)
	}
	payload, err := json.Marshal(data)
	if err != nil {
		return err
	}
	return writeEnvelopeWithHTTP(w, httpStatus, 0, "", payload)
}

func writeEnvelopeWithHTTP(w nethttp.ResponseWriter, httpStatus int, code int, msg string, data json.RawMessage) error {
	env := struct {
		Code int             `json:"code"`
		Msg  string          `json:"msg"`
		Data json.RawMessage `json:"data"`
	}{
		Code: code,
		Msg:  msg,
		Data: data,
	}
	if len(env.Data) == 0 {
		env.Data = emptyJSONObject
	}
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(httpStatus)
	return json.NewEncoder(w).Encode(env)
}

// unifiedErrorEncoder 错误使用统一 JSON 外壳，HTTP 状态码与 Kratos 错误类型一致（400/401/404/500 等），body.code 同步便于前端兼容。
func unifiedErrorEncoder(w nethttp.ResponseWriter, r *nethttp.Request, err error) {
	se := kerrors.FromError(err)
	bizCode := int(se.Code)
	if bizCode == 0 {
		bizCode = 500
	}
	httpStatus := int(se.Code)
	if httpStatus < 400 || httpStatus > 599 {
		httpStatus = nethttp.StatusInternalServerError
	}
	msg := se.Message
	if msg == "" && err != nil {
		msg = err.Error()
	}
	_ = writeEnvelopeWithHTTP(w, httpStatus, bizCode, msg, emptyJSONObject)
}
