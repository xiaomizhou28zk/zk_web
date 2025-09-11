package xmysql

import "xorm.io/xorm"

func HandelTransaction(session *xorm.Session, transactionFunc func(session *xorm.Session) error) error {
	defer func() {
		_ = session.Close()
	}()
	if err := session.Begin(); err != nil {
		return err
	}
	if err := transactionFunc(session); err != nil {
		return err
	}
	return session.Commit()
}
