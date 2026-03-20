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
		return writeEnvelope(w, 0, "", emptyJSONObject)
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
	return writeEnvelope(w, 0, "", payload)
}

var emptyJSONObject = json.RawMessage("{}")

func writeEnvelope(w nethttp.ResponseWriter, code int, msg string, data json.RawMessage) error {
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
	w.WriteHeader(nethttp.StatusOK)
	return json.NewEncoder(w).Encode(env)
}

// unifiedErrorEncoder 错误也使用统一结构；HTTP 状态码固定 200，由 body.code 区分
func unifiedErrorEncoder(w nethttp.ResponseWriter, r *nethttp.Request, err error) {
	se := kerrors.FromError(err)
	bizCode := int(se.Code)
	if bizCode == 0 {
		bizCode = 500
	}
	msg := se.Message
	if msg == "" && err != nil {
		msg = err.Error()
	}
	_ = writeEnvelope(w, bizCode, msg, emptyJSONObject)
}
