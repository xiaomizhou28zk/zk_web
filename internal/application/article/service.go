package article

import (
	"context"
	"strconv"
	"strings"

	kerrors "github.com/go-kratos/kratos/v2/errors"

	pb "github.com/xiaomizhou28zk/zk_web/api/article"
	userApp "github.com/xiaomizhou28zk/zk_web/internal/application/user"
	"github.com/xiaomizhou28zk/zk_web/internal/config"
	domainAuth "github.com/xiaomizhou28zk/zk_web/internal/domain/auth"
	"github.com/xiaomizhou28zk/zk_web/internal/domain/entity"
	"github.com/xiaomizhou28zk/zk_web/internal/pkg/log"
)

type Service struct {
	repo  ArticleRepository
	users userApp.UserRepository
}

var _ pb.ArticleServiceHTTPServer = (*Service)(nil)

func NewService(repo ArticleRepository, users userApp.UserRepository) *Service {
	return &Service{repo: repo, users: users}
}

func toProtoArticle(a *entity.Article) *pb.Article {
	if a == nil {
		return nil
	}
	avatar := a.AuthorAvatar
	if avatar == "" {
		avatar = "👤"
	}
	pubAt := ""
	if a.PublishedAt != nil {
		pubAt = a.PublishedAt.Format("2006-01-02 15:04")
	}
	vis := a.Visibility
	if vis == 0 {
		vis = 1
	}
	return &pb.Article{
		Id:          a.Id,
		Title:       a.Title,
		Summary:     a.Summary,
		Author:      &pb.Author{Name: a.AuthorName, Avatar: avatar},
		PublishedAt: pubAt,
		Cover:       a.Cover,
		Status:      pb.ArticleStatus(a.Status),
		Visibility:  vis,
	}
}

func parseCursor(s string) int64 {
	s = strings.TrimSpace(s)
	if s == "" {
		return 0
	}
	n, _ := strconv.ParseInt(s, 10, 64)
	return n
}

func (s *Service) ListFeaturedArticles(ctx context.Context, _ *pb.ListFeaturedArticlesRequest) (*pb.ListFeaturedArticlesResponse, error) {
	ids := config.GetFeaturedArticleIds()
	if len(ids) == 0 {
		return &pb.ListFeaturedArticlesResponse{}, nil
	}
	list, err := s.repo.ListByIDs(ctx, ids)
	if err != nil {
		return nil, err
	}
	rsp := &pb.ListFeaturedArticlesResponse{}
	for _, a := range list {
		if a.Visibility == 2 {
			continue
		}
		rsp.Articles = append(rsp.Articles, toProtoArticle(a))
	}
	return rsp, nil
}

func (s *Service) ListArticles(ctx context.Context, request *pb.ListArticlesRequest) (*pb.ListArticlesResponse, error) {
	cursor := parseCursor(request.GetCursor())
	list, next, err := s.repo.ListPublished(ctx, request.GetQ(), cursor, request.GetPageSize())
	if err != nil {
		return nil, err
	}
	rsp := &pb.ListArticlesResponse{NextCursor: next}
	for _, a := range list {
		rsp.Articles = append(rsp.Articles, toProtoArticle(a))
	}
	return rsp, nil
}

func (s *Service) GetArticle(ctx context.Context, request *pb.GetArticleRequest) (*pb.GetArticleResponse, error) {
	a, err := s.repo.GetByID(ctx, request.GetId())
	if err != nil {
		return nil, err
	}
	if a == nil {
		return nil, kerrors.NotFound("ARTICLE_NOT_FOUND", "文章不存在")
	}
	// 获取文章详情时顺便记录浏览，用于热度榜统计
	if err := s.repo.InsertViewLog(ctx, request.GetId()); err != nil {
		log.Error("InsertViewLog failed: article_id=%d err=%v", request.GetId(), err)
	}
	return &pb.GetArticleResponse{
		Article:  toProtoArticle(a),
		BodyHtml: a.BodyHTML,
	}, nil
}

func (s *Service) ListMyArticles(ctx context.Context, request *pb.ListMyArticlesRequest) (*pb.ListMyArticlesResponse, error) {
	info, ok := domainAuth.ReadUserContextInfo(ctx)
	if !ok || info == nil || info.Account == "" {
		return nil, kerrors.Unauthorized("UNAUTHORIZED", "请先登录")
	}
	list, total, err := s.repo.ListByAccount(ctx, info.Account, request.GetPage(), request.GetPageSize())
	if err != nil {
		return nil, err
	}
	rsp := &pb.ListMyArticlesResponse{Total: total}
	for _, a := range list {
		rsp.Articles = append(rsp.Articles, toProtoArticle(a))
	}
	return rsp, nil
}

func (s *Service) CreateArticle(ctx context.Context, request *pb.CreateArticleRequest) (*pb.CreateArticleResponse, error) {
	info, ok := domainAuth.ReadUserContextInfo(ctx)
	if !ok || info == nil || info.Account == "" {
		return nil, kerrors.Unauthorized("UNAUTHORIZED", "请先登录")
	}
	u, err := s.users.GetUserInfo(ctx, info.Account)
	if err != nil {
		return nil, err
	}
	if u == nil {
		return nil, kerrors.Unauthorized("USER_NOT_FOUND", "用户不存在")
	}
	title := strings.TrimSpace(request.GetTitle())
	summary := strings.TrimSpace(request.GetSummary())
	if title == "" || summary == "" {
		return nil, kerrors.BadRequest("INVALID_PARAMS", "标题和简介不能为空")
	}
	st := request.GetStatus()
	if st == pb.ArticleStatus_ARTICLE_STATUS_UNSPECIFIED {
		st = pb.ArticleStatus_PUBLISHED
	}
	nick := u.Name
	if nick == "" {
		nick = u.Account
	}
	avatar := u.Avatar
	if avatar == "" {
		avatar = "👤"
	}
	cover := request.GetCover()
	if cover == "" {
		cover = "📝"
	}
	art := &entity.Article{
		Account:      info.Account,
		Title:        title,
		Summary:      summary,
		Cover:        cover,
		BodyHTML:     request.GetBodyHtml(),
		Status:       int32(st),
		Visibility:   1,
		AuthorName:   nick,
		AuthorAvatar: avatar,
	}
	if err := s.repo.Insert(ctx, art); err != nil {
		return nil, err
	}
	return &pb.CreateArticleResponse{Id: art.Id}, nil
}

func (s *Service) RecordView(ctx context.Context, request *pb.RecordViewRequest) (*pb.RecordViewResponse, error) {
	_ = s.repo.InsertViewLog(ctx, request.GetArticleId())
	return &pb.RecordViewResponse{}, nil
}

func (s *Service) UpdateArticle(ctx context.Context, request *pb.UpdateArticleRequest) (*pb.UpdateArticleResponse, error) {
	info, ok := domainAuth.ReadUserContextInfo(ctx)
	if !ok || info == nil || info.Account == "" {
		return nil, kerrors.Unauthorized("UNAUTHORIZED", "请先登录")
	}
	var title, summary, cover, body *string
	if request.Title != nil {
		title = request.Title
	}
	if request.Summary != nil {
		summary = request.Summary
	}
	if request.Cover != nil {
		cover = request.Cover
	}
	if request.BodyHtml != nil {
		body = request.BodyHtml
	}
	var st *int32
	if request.Status != nil {
		v := int32(*request.Status)
		st = &v
	}
	var vis *int8
	if request.Visibility != nil {
		v := request.GetVisibility()
		if v != 1 && v != 2 {
			return nil, kerrors.BadRequest("INVALID_VISIBILITY", "可见性无效，应为 1（可见）或 2（隐藏）")
		}
		vb := int8(v)
		vis = &vb
	}
	okUpdate, err := s.repo.UpdateByOwner(ctx, request.GetId(), info.Account, title, summary, cover, body, st, vis)
	if err != nil {
		return nil, err
	}
	if !okUpdate {
		return nil, kerrors.Forbidden("NOT_OWNER", "无权修改该文章或文章不存在")
	}
	return &pb.UpdateArticleResponse{Ok: true}, nil
}
