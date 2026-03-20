package storage

import (
	"context"
	"fmt"
	"strconv"
	"strings"
	"time"

	"github.com/xiaomizhou28zk/zk_web/internal/clients/infra"
	"github.com/xiaomizhou28zk/zk_web/internal/domain/entity"
	"github.com/xiaomizhou28zk/zk_web/internal/repository/article"
	"github.com/xiaomizhou28zk/zk_web/internal/repository/article/factory"
	"github.com/xiaomizhou28zk/zk_web/internal/repository/article/po"
	userpo "github.com/xiaomizhou28zk/zk_web/internal/repository/user/po"
	"xorm.io/xorm"
)

type ArticleMysqlStorage struct {
	mysqlClient infra.BlogMysqlClient
}

var _ article.ArticleStorage = (*ArticleMysqlStorage)(nil)

func NewArticleMysqlStorage(mysqlClient infra.BlogMysqlClient) *ArticleMysqlStorage {
	return &ArticleMysqlStorage{mysqlClient: mysqlClient}
}

func intSQLPlaceholders(n int) string {
	if n <= 0 {
		return ""
	}
	var b strings.Builder
	b.WriteByte('?')
	for i := 1; i < n; i++ {
		b.WriteString(",?")
	}
	return b.String()
}

// fillEngagementCounts 批量填充点赞/收藏数（列表接口用）
func (s *ArticleMysqlStorage) fillEngagementCounts(ctx context.Context, list []*entity.Article) {
	if len(list) == 0 {
		return
	}
	args := make([]interface{}, len(list))
	for i, a := range list {
		args[i] = a.Id
	}
	ph := intSQLPlaceholders(len(args))
	likeTb := (&po.ArticleLike{}).TableName()
	favTb := (&po.ArticleFavorite{}).TableName()

	likeMap := make(map[int64]int64)
	sqlLike := "SELECT article_id, COUNT(1) AS c FROM " + likeTb + " WHERE article_id IN (" + ph + ") GROUP BY article_id"
	if rows, err := s.mysqlClient.Context(ctx).SQL(sqlLike, args...).QueryString(); err == nil {
		for _, r := range rows {
			aid, _ := strconv.ParseInt(r["article_id"], 10, 64)
			c, _ := strconv.ParseInt(r["c"], 10, 64)
			likeMap[aid] = c
		}
	}
	favMap := make(map[int64]int64)
	sqlFav := "SELECT article_id, COUNT(1) AS c FROM " + favTb + " WHERE article_id IN (" + ph + ") GROUP BY article_id"
	if rows, err := s.mysqlClient.Context(ctx).SQL(sqlFav, args...).QueryString(); err == nil {
		for _, r := range rows {
			aid, _ := strconv.ParseInt(r["article_id"], 10, 64)
			c, _ := strconv.ParseInt(r["c"], 10, 64)
			favMap[aid] = c
		}
	}
	for _, a := range list {
		a.LikeCount = likeMap[a.Id]
		a.FavoriteCount = favMap[a.Id]
	}
}

func (s *ArticleMysqlStorage) fillAuthors(ctx context.Context, list []*po.Article) []*entity.Article {
	if len(list) == 0 {
		return nil
	}
	seen := make(map[string]struct{})
	var accounts []string
	for _, a := range list {
		if _, ok := seen[a.Account]; ok {
			continue
		}
		seen[a.Account] = struct{}{}
		accounts = append(accounts, a.Account)
	}
	nameByAccount := make(map[string]string)
	avatarByAccount := make(map[string]string)
	var users []userpo.User
	_ = s.mysqlClient.Context(ctx).Table((&userpo.User{}).TableName()).In("account", accounts).Find(&users)
	for i := range users {
		nameByAccount[users[i].Account] = users[i].Name
		avatarByAccount[users[i].Account] = users[i].Avatar
	}
	out := make([]*entity.Article, 0, len(list))
	for _, p := range list {
		out = append(out, factory.Po2DoArticle(p, nameByAccount[p.Account], avatarByAccount[p.Account]))
	}
	return out
}

func (s *ArticleMysqlStorage) ListPublished(ctx context.Context, q string, cursor int64, pageSize int32) ([]*entity.Article, string, error) {
	if pageSize <= 0 {
		pageSize = 15
	}
	q = strings.TrimSpace(q)
	var rows []*po.Article
	var err error
	if q == "" {
		sess := s.mysqlClient.Context(ctx).Table((&po.Article{}).TableName()).Where("status = ? AND visibility = ?", 2, 1)
		if cursor > 0 {
			sess = sess.And("id < ?", cursor)
		}
		err = sess.OrderBy("id DESC").Limit(int(pageSize)).Find(&rows)
	} else {
		like := "%" + strings.ToLower(q) + "%"
		sess := s.mysqlClient.Context(ctx).Table("article").Alias("a").
			Join("INNER", []string{"user", "u"}, "a.account = u.account").
			Where("a.status = ? AND a.visibility = ?", 2, 1).
			And("(LOWER(a.title) LIKE ? OR LOWER(a.summary) LIKE ? OR LOWER(u.name) LIKE ?)", like, like, like)
		if cursor > 0 {
			sess = sess.And("a.id < ?", cursor)
		}
		err = sess.Select("a.*").OrderBy("a.id DESC").Limit(int(pageSize)).Find(&rows)
	}
	if err != nil {
		return nil, "", err
	}
	list := s.fillAuthors(ctx, rows)
	s.fillEngagementCounts(ctx, list)
	var next string
	if len(list) > 0 {
		next = fmt.Sprint(list[len(list)-1].Id)
	}
	return list, next, nil
}

func (s *ArticleMysqlStorage) ListByIDs(ctx context.Context, ids []int64) ([]*entity.Article, error) {
	if len(ids) == 0 {
		return nil, nil
	}
	var rows []*po.Article
	err := s.mysqlClient.Context(ctx).Table((&po.Article{}).TableName()).In("id", ids).Find(&rows)
	if err != nil {
		return nil, err
	}
	list := s.fillAuthors(ctx, rows)
	// 按配置的 ids 顺序排列
	idToArt := make(map[int64]*entity.Article)
	for _, a := range list {
		idToArt[a.Id] = a
	}
	out := make([]*entity.Article, 0, len(ids))
	for _, id := range ids {
		if a := idToArt[id]; a != nil {
			out = append(out, a)
		}
	}
	s.fillEngagementCounts(ctx, out)
	return out, nil
}

func (s *ArticleMysqlStorage) GetByID(ctx context.Context, id int64) (*entity.Article, error) {
	p := &po.Article{}
	ok, err := s.mysqlClient.Context(ctx).Table((&po.Article{}).TableName()).ID(id).Get(p)
	if err != nil {
		return nil, err
	}
	if !ok {
		return nil, nil
	}
	var u userpo.User
	_, _ = s.mysqlClient.Context(ctx).Table((&userpo.User{}).TableName()).Where("account = ?", p.Account).Get(&u)
	return factory.Po2DoArticle(p, u.Name, u.Avatar), nil
}

func (s *ArticleMysqlStorage) Insert(ctx context.Context, a *entity.Article) error {
	p := factory.Do2PoArticle(a)
	now := time.Now()
	if p.CreatedAt.IsZero() {
		p.CreatedAt = now
	}
	if p.UpdatedAt.IsZero() {
		p.UpdatedAt = now
	}
	if p.Status == 2 && p.PublishedAt == nil {
		p.PublishedAt = &now
	}
	_, err := s.mysqlClient.Context(ctx).Table((&po.Article{}).TableName()).Insert(p)
	if err != nil {
		return err
	}
	a.Id = p.Id
	a.CreateAt = p.CreatedAt
	a.UpdateAt = p.UpdatedAt
	a.PublishedAt = p.PublishedAt
	return nil
}

func (s *ArticleMysqlStorage) UpdateByOwner(ctx context.Context, id int64, account string, title, summary, cover, body *string, status *int32, visibility *int8) (bool, error) {
	p := &po.Article{}
	ok, err := s.mysqlClient.Context(ctx).Table((&po.Article{}).TableName()).
		Where("id = ? AND account = ?", id, account).Get(p)
	if err != nil {
		return false, err
	}
	if !ok {
		return false, nil
	}
	cols := make(map[string]interface{})
	if title != nil {
		cols["title"] = *title
	}
	if summary != nil {
		cols["summary"] = *summary
	}
	if cover != nil {
		cols["cover"] = *cover
	}
	if body != nil {
		cols["body_html"] = *body
	}
	if status != nil && *status != 0 {
		cols["status"] = int8(*status)
		if int8(*status) == 2 && p.PublishedAt == nil {
			now := time.Now()
			cols["published_at"] = &now
		}
	}
	if visibility != nil {
		cols["visibility"] = *visibility
	}
	if len(cols) == 0 {
		return true, nil
	}
	cols["updated_at"] = time.Now()
	affected, err := s.mysqlClient.Context(ctx).Table((&po.Article{}).TableName()).
		Where("id = ? AND account = ?", id, account).Update(cols)
	if err != nil {
		return false, err
	}
	return affected > 0, nil
}

func (s *ArticleMysqlStorage) ListByAccount(ctx context.Context, account string, page, pageSize int32) ([]*entity.Article, int32, error) {
	if page <= 0 {
		page = 1
	}
	if pageSize <= 0 {
		pageSize = 10
	}
	tb := (&po.Article{}).TableName()
	total, err := s.mysqlClient.Context(ctx).Table(tb).Where("account = ?", account).Count(&po.Article{})
	if err != nil {
		return nil, 0, err
	}
	var rows []*po.Article
	err = s.mysqlClient.Context(ctx).Table(tb).Where("account = ?", account).
		OrderBy("updated_at DESC").
		Limit(int(pageSize), int((page-1)*pageSize)).
		Find(&rows)
	if err != nil {
		return nil, 0, err
	}
	list := s.fillAuthors(ctx, rows)
	s.fillEngagementCounts(ctx, list)
	return list, int32(total), nil
}

func (s *ArticleMysqlStorage) Exists(ctx context.Context, id int64) (bool, error) {
	return s.mysqlClient.Context(ctx).Table((&po.Article{}).TableName()).Where("id = ?", id).Exist()
}

func (s *ArticleMysqlStorage) InsertViewLog(ctx context.Context, articleID int64) error {
	row := &po.ArticleViewLog{
		ArticleId: articleID,
		ViewAt:    time.Now(),
	}
	_, err := s.mysqlClient.Context(ctx).Table((&po.ArticleViewLog{}).TableName()).Insert(row)
	return err
}

func (s *ArticleMysqlStorage) HotRanking(ctx context.Context, rankType int32, limit int32) ([]entity.HotRankRow, error) {
	if limit <= 0 {
		limit = 10
	}
	var since time.Time
	switch rankType {
	case 2: // WEEK
		since = time.Now().Add(-7 * 24 * time.Hour)
	case 3: // DAY
		since = time.Now().Add(-24 * time.Hour)
	}
	sql := `SELECT l.article_id, a.title, COUNT(1) AS views FROM article_view_log l
INNER JOIN article a ON a.id = l.article_id AND a.status = 2 AND a.visibility = 1`
	args := make([]interface{}, 0)
	if !since.IsZero() {
		sql += ` WHERE l.view_at >= ?`
		args = append(args, since)
	}
	// 浏览次数相同时必须固定次序，否则总榜/周榜/日榜在并列时可能因执行计划不同而顺序不一致
	sql += ` GROUP BY l.article_id ORDER BY views DESC, l.article_id ASC LIMIT ?`
	args = append(args, limit)

	results, err := s.mysqlClient.Context(ctx).SQL(sql, args...).QueryString()
	if err != nil {
		return nil, err
	}
	out := make([]entity.HotRankRow, 0, len(results))
	for _, row := range results {
		aid, _ := strconv.ParseInt(row["article_id"], 10, 64)
		v, _ := strconv.ParseInt(row["views"], 10, 64)
		title := row["title"]
		out = append(out, entity.HotRankRow{ArticleID: aid, Title: title, Views: v})
	}
	return out, nil
}

func (s *ArticleMysqlStorage) GetArticleEngagement(ctx context.Context, articleID int64, viewerAccount string) (likeCount, favoriteCount int64, liked, favorited bool, err error) {
	likeTb := (&po.ArticleLike{}).TableName()
	favTb := (&po.ArticleFavorite{}).TableName()
	n, err := s.mysqlClient.Context(ctx).Table(likeTb).Where("article_id = ?", articleID).Count(&po.ArticleLike{})
	if err != nil {
		return 0, 0, false, false, err
	}
	likeCount = n
	n, err = s.mysqlClient.Context(ctx).Table(favTb).Where("article_id = ?", articleID).Count(&po.ArticleFavorite{})
	if err != nil {
		return 0, 0, false, false, err
	}
	favoriteCount = n
	if viewerAccount == "" {
		return likeCount, favoriteCount, false, false, nil
	}
	liked, err = s.mysqlClient.Context(ctx).Table(likeTb).Where("article_id = ? AND account = ?", articleID, viewerAccount).Exist(&po.ArticleLike{})
	if err != nil {
		return 0, 0, false, false, err
	}
	favorited, err = s.mysqlClient.Context(ctx).Table(favTb).Where("article_id = ? AND account = ?", articleID, viewerAccount).Exist(&po.ArticleFavorite{})
	if err != nil {
		return 0, 0, false, false, err
	}
	return likeCount, favoriteCount, liked, favorited, nil
}

func (s *ArticleMysqlStorage) ToggleArticleLike(ctx context.Context, articleID int64, account string) (likeCount int64, liked bool, err error) {
	likeTb := (&po.ArticleLike{}).TableName()
	type toggleResult struct {
		n     int64
		liked bool
	}
	out, err := s.mysqlClient.Transaction(func(sess *xorm.Session) (interface{}, error) {
		sess = sess.Context(ctx)
		has, err := sess.Table(likeTb).Where("article_id = ? AND account = ?", articleID, account).Exist(&po.ArticleLike{})
		if err != nil {
			return nil, err
		}
		var likedNow bool
		if has {
			if _, err := sess.Table(likeTb).Where("article_id = ? AND account = ?", articleID, account).Delete(&po.ArticleLike{}); err != nil {
				return nil, err
			}
			likedNow = false
		} else {
			row := &po.ArticleLike{ArticleId: articleID, Account: account, CreatedAt: time.Now()}
			if _, err := sess.Table(likeTb).Insert(row); err != nil {
				return nil, err
			}
			likedNow = true
		}
		n, err := sess.Table(likeTb).Where("article_id = ?", articleID).Count(&po.ArticleLike{})
		if err != nil {
			return nil, err
		}
		return toggleResult{n: n, liked: likedNow}, nil
	})
	if err != nil {
		return 0, false, err
	}
	r := out.(toggleResult)
	return r.n, r.liked, nil
}

func (s *ArticleMysqlStorage) ToggleArticleFavorite(ctx context.Context, articleID int64, account string) (favoriteCount int64, favorited bool, err error) {
	favTb := (&po.ArticleFavorite{}).TableName()
	type toggleResult struct {
		n        int64
		favorited bool
	}
	out, err := s.mysqlClient.Transaction(func(sess *xorm.Session) (interface{}, error) {
		sess = sess.Context(ctx)
		has, err := sess.Table(favTb).Where("article_id = ? AND account = ?", articleID, account).Exist(&po.ArticleFavorite{})
		if err != nil {
			return nil, err
		}
		var favNow bool
		if has {
			if _, err := sess.Table(favTb).Where("article_id = ? AND account = ?", articleID, account).Delete(&po.ArticleFavorite{}); err != nil {
				return nil, err
			}
			favNow = false
		} else {
			row := &po.ArticleFavorite{ArticleId: articleID, Account: account, CreatedAt: time.Now()}
			if _, err := sess.Table(favTb).Insert(row); err != nil {
				return nil, err
			}
			favNow = true
		}
		n, err := sess.Table(favTb).Where("article_id = ?", articleID).Count(&po.ArticleFavorite{})
		if err != nil {
			return nil, err
		}
		return toggleResult{n: n, favorited: favNow}, nil
	})
	if err != nil {
		return 0, false, err
	}
	r := out.(toggleResult)
	return r.n, r.favorited, nil
}

func (s *ArticleMysqlStorage) ListFavoritedPublished(ctx context.Context, account string, page, pageSize int32) ([]*entity.Article, int32, error) {
	if page <= 0 {
		page = 1
	}
	if pageSize <= 0 {
		pageSize = 10
	}
	tb := (&po.Article{}).TableName()
	joinWhere := s.mysqlClient.Context(ctx).Table(tb).Alias("a").
		Join("INNER", []string{"article_favorite", "f"}, "f.article_id = a.id").
		Where("f.account = ? AND a.status = ?", account, 2)
	total, err := joinWhere.Count(&po.Article{})
	if err != nil {
		return nil, 0, err
	}
	var rows []*po.Article
	err = s.mysqlClient.Context(ctx).Table(tb).Alias("a").
		Join("INNER", []string{"article_favorite", "f"}, "f.article_id = a.id").
		Where("f.account = ? AND a.status = ?", account, 2).
		Select("a.*").OrderBy("f.created_at DESC").
		Limit(int(pageSize), int((page-1)*pageSize)).
		Find(&rows)
	if err != nil {
		return nil, 0, err
	}
	list := s.fillAuthors(ctx, rows)
	s.fillEngagementCounts(ctx, list)
	return list, int32(total), nil
}
