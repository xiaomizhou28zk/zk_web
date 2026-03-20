package storage

import (
	"context"
	"time"

	"github.com/xiaomizhou28zk/zk_web/internal/clients/infra"
	"github.com/xiaomizhou28zk/zk_web/internal/domain/entity"
	"github.com/xiaomizhou28zk/zk_web/internal/repository/comment"
	"github.com/xiaomizhou28zk/zk_web/internal/repository/comment/factory"
	"github.com/xiaomizhou28zk/zk_web/internal/repository/comment/po"
	userpo "github.com/xiaomizhou28zk/zk_web/internal/repository/user/po"
)

type ReplyMysqlStorage struct {
	mysqlClient infra.BlogMysqlClient
}

var _ comment.ReplyStorage = (*ReplyMysqlStorage)(nil)

func NewReplyMysqlStorage(mysqlClient infra.BlogMysqlClient) *ReplyMysqlStorage {
	return &ReplyMysqlStorage{mysqlClient: mysqlClient}
}

func (s *ReplyMysqlStorage) fillAuthors(ctx context.Context, rows []*po.Reply) []*entity.Reply {
	if len(rows) == 0 {
		return nil
	}
	seen := make(map[string]struct{})
	var accounts []string
	for _, r := range rows {
		if _, ok := seen[r.Account]; ok {
			continue
		}
		seen[r.Account] = struct{}{}
		accounts = append(accounts, r.Account)
	}
	nameByAccount := make(map[string]string)
	var users []userpo.User
	_ = s.mysqlClient.Context(ctx).Table((&userpo.User{}).TableName()).In("account", accounts).Find(&users)
	for i := range users {
		nameByAccount[users[i].Account] = users[i].Name
		if nameByAccount[users[i].Account] == "" {
			nameByAccount[users[i].Account] = users[i].Account
		}
	}
	out := make([]*entity.Reply, 0, len(rows))
	for _, p := range rows {
		author := nameByAccount[p.Account]
		if author == "" {
			author = p.Account
		}
		out = append(out, factory.Po2DoReply(p, author))
	}
	return out
}

func (s *ReplyMysqlStorage) ListRepliesByCommentIDs(ctx context.Context, commentIDs []int64) ([]*entity.Reply, error) {
	if len(commentIDs) == 0 {
		return nil, nil
	}
	var rows []*po.Reply
	err := s.mysqlClient.Context(ctx).Table((&po.Reply{}).TableName()).
		In("comment_id", commentIDs).
		OrderBy("created_at ASC").
		Find(&rows)
	if err != nil {
		return nil, err
	}
	return s.fillAuthors(ctx, rows), nil
}

func (s *ReplyMysqlStorage) GetReplyByID(ctx context.Context, id int64) (*entity.Reply, error) {
	p := &po.Reply{}
	ok, err := s.mysqlClient.Context(ctx).Table((&po.Reply{}).TableName()).ID(id).Get(p)
	if err != nil {
		return nil, err
	}
	if !ok {
		return nil, nil
	}
	var u userpo.User
	_, _ = s.mysqlClient.Context(ctx).Table((&userpo.User{}).TableName()).Where("account = ?", p.Account).Get(&u)
	author := u.Name
	if author == "" {
		author = p.Account
	}
	return factory.Po2DoReply(p, author), nil
}

func (s *ReplyMysqlStorage) InsertReply(ctx context.Context, r *entity.Reply) error {
	p := factory.Do2PoReply(r)
	if p.CreatedAt.IsZero() {
		p.CreatedAt = time.Now()
	}
	_, err := s.mysqlClient.Context(ctx).Table((&po.Reply{}).TableName()).Insert(p)
	if err != nil {
		return err
	}
	r.Id = p.Id
	r.CreateAt = p.CreatedAt
	return nil
}
