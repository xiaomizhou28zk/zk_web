package comment

import (
	"context"
	"sort"
	"strconv"
	"strings"
	"time"

	kerrors "github.com/go-kratos/kratos/v2/errors"

	pb "github.com/xiaomizhou28zk/zk_web/api/comment"
	articleApp "github.com/xiaomizhou28zk/zk_web/internal/application/article"
	"github.com/xiaomizhou28zk/zk_web/internal/domain/entity"
	userApp "github.com/xiaomizhou28zk/zk_web/internal/application/user"
	domainAuth "github.com/xiaomizhou28zk/zk_web/internal/domain/auth"
)

type Service struct {
	commentRepo CommentRepository
	articleRepo articleApp.ArticleRepository
	users       userApp.UserRepository
}

var _ pb.CommentServiceHTTPServer = (*Service)(nil)

func NewService(commentRepo CommentRepository, articleRepo articleApp.ArticleRepository, users userApp.UserRepository) *Service {
	return &Service{
		commentRepo: commentRepo,
		articleRepo: articleRepo,
		users:       users,
	}
}

func formatTime(t time.Time) string {
	return t.Format("2006-01-02 15:04")
}

func parseCommentID(s string) (int64, error) {
	s = strings.TrimPrefix(s, "c-")
	return strconv.ParseInt(s, 10, 64)
}

func parseReplyID(s string) (int64, error) {
	s = strings.TrimPrefix(s, "r-")
	return strconv.ParseInt(s, 10, 64)
}

func (s *Service) ListComments(ctx context.Context, request *pb.ListCommentsRequest) (*pb.ListCommentsResponse, error) {
	comments, err := s.commentRepo.ListByArticleID(ctx, request.GetArticleId())
	if err != nil {
		return nil, err
	}
	if len(comments) == 0 {
		return &pb.ListCommentsResponse{Comments: nil}, nil
	}
	commentIDs := make([]int64, 0, len(comments))
	for _, c := range comments {
		commentIDs = append(commentIDs, c.Id)
	}
	replies, err := s.commentRepo.ListRepliesByCommentIDs(ctx, commentIDs)
	if err != nil {
		return nil, err
	}
	// 直接挂在评论下的回复按 comment_id 分组；对「回复的回复」按父回复 id 分组。
	// 切勿用 parentKey=0 混放所有顶级回复，否则每条评论都会错误地带上全文章的回复。
	topByCommentID := make(map[int64][]*entity.Reply)
	childrenByReplyID := make(map[int64][]*entity.Reply)
	for _, r := range replies {
		if r.ReplyToReplyID != nil {
			pid := *r.ReplyToReplyID
			childrenByReplyID[pid] = append(childrenByReplyID[pid], r)
		} else {
			topByCommentID[r.CommentID] = append(topByCommentID[r.CommentID], r)
		}
	}
	out := make([]*pb.Comment, 0, len(comments))
	sort.Slice(comments, func(i, j int) bool { return comments[i].CreateAt.Before(comments[j].CreateAt) })
	for _, c := range comments {
		out = append(out, &pb.Comment{
			Id:      "c-" + strconv.FormatInt(c.Id, 10),
			Author:  c.AuthorName,
			Content: c.Content,
			Time:    formatTime(c.CreateAt),
			Replies: s.buildReplyPBTree(topByCommentID[c.Id], childrenByReplyID),
		})
	}
	return &pb.ListCommentsResponse{Comments: out}, nil
}

// buildReplyPBTree 将某一评论下的顶级回复列表递归展开为 protobuf 树。
func (s *Service) buildReplyPBTree(level []*entity.Reply, childrenByReplyID map[int64][]*entity.Reply) []*pb.Reply {
	if len(level) == 0 {
		return nil
	}
	sort.Slice(level, func(i, j int) bool { return level[i].CreateAt.Before(level[j].CreateAt) })
	out := make([]*pb.Reply, 0, len(level))
	for _, k := range level {
		kids := childrenByReplyID[k.Id]
		rep := &pb.Reply{
			Id:      "r-" + strconv.FormatInt(k.Id, 10),
			Author:  k.AuthorName,
			Content: k.Content,
			Time:    formatTime(k.CreateAt),
			Replies: s.buildReplyPBTree(kids, childrenByReplyID),
		}
		out = append(out, rep)
	}
	return out
}

func (s *Service) AddComment(ctx context.Context, request *pb.AddCommentRequest) (*pb.AddCommentResponse, error) {
	info, ok := domainAuth.ReadUserContextInfo(ctx)
	if !ok || info == nil || info.Account == "" {
		return nil, kerrors.Unauthorized("UNAUTHORIZED", "请先登录")
	}
	content := strings.TrimSpace(request.GetContent())
	if content == "" {
		return nil, kerrors.BadRequest("INVALID_CONTENT", "评论内容不能为空")
	}
	u, err := s.users.GetUserInfo(ctx, info.Account)
	if err != nil {
		return nil, err
	}
	if u == nil {
		return nil, kerrors.Unauthorized("USER_NOT_FOUND", "用户不存在")
	}
	exists, err := s.articleRepo.Exists(ctx, request.GetArticleId())
	if err != nil {
		return nil, err
	}
	if !exists {
		return nil, kerrors.NotFound("ARTICLE_NOT_FOUND", "文章不存在")
	}
	author := u.Name
	if author == "" {
		author = u.Account
	}
	c := &entity.Comment{
		ArticleID:  request.GetArticleId(),
		Account:    info.Account,
		Content:    content,
		AuthorName: author,
	}
	err = s.commentRepo.Insert(ctx, c)
	if err != nil {
		return nil, err
	}
	return &pb.AddCommentResponse{
		Comment: &pb.Comment{
			Id:      "c-" + strconv.FormatInt(c.Id, 10),
			Author:  author,
			Content: content,
			Time:    formatTime(c.CreateAt),
			Replies: nil,
		},
	}, nil
}

func (s *Service) AddReply(ctx context.Context, request *pb.AddReplyRequest) (*pb.AddReplyResponse, error) {
	info, ok := domainAuth.ReadUserContextInfo(ctx)
	if !ok || info == nil || info.Account == "" {
		return nil, kerrors.Unauthorized("UNAUTHORIZED", "请先登录")
	}
	content := strings.TrimSpace(request.GetContent())
	if content == "" {
		return nil, kerrors.BadRequest("INVALID_CONTENT", "回复内容不能为空")
	}
	u, err := s.users.GetUserInfo(ctx, info.Account)
	if err != nil {
		return nil, err
	}
	if u == nil {
		return nil, kerrors.Unauthorized("USER_NOT_FOUND", "用户不存在")
	}
	rootID, err := parseCommentID(request.GetCommentId())
	if err != nil || rootID <= 0 {
		return nil, kerrors.NotFound("COMMENT_NOT_FOUND", "评论不存在")
	}
	root, err := s.commentRepo.GetByID(ctx, rootID)
	if err != nil || root == nil {
		return nil, kerrors.NotFound("COMMENT_NOT_FOUND", "评论不存在")
	}
	if root.ArticleID != request.GetArticleId() {
		return nil, kerrors.NotFound("COMMENT_NOT_FOUND", "评论不存在")
	}
	var replyToReplyID *int64
	if request.GetParentReplyId() != "" {
		replyID, err2 := parseReplyID(request.GetParentReplyId())
		if err2 != nil || replyID <= 0 {
			return nil, kerrors.NotFound("COMMENT_NOT_FOUND", "评论不存在")
		}
		parent, err2 := s.commentRepo.GetReplyByID(ctx, replyID)
		if err2 != nil || parent == nil {
			return nil, kerrors.NotFound("COMMENT_NOT_FOUND", "评论不存在")
		}
		if parent.CommentID != rootID {
			return nil, kerrors.NotFound("COMMENT_NOT_FOUND", "评论不存在")
		}
		replyToReplyID = &replyID
	}
	author := u.Name
	if author == "" {
		author = u.Account
	}
	r := &entity.Reply{
		CommentID:      rootID,
		ReplyToReplyID: replyToReplyID,
		Account:        info.Account,
		Content:        content,
		AuthorName:     author,
	}
	err = s.commentRepo.InsertReply(ctx, r)
	if err != nil {
		return nil, err
	}
	return &pb.AddReplyResponse{
		Reply: &pb.Reply{
			Id:      "r-" + strconv.FormatInt(r.Id, 10),
			Author:  author,
			Content: content,
			Time:    formatTime(r.CreateAt),
			Replies: nil,
		},
	}, nil
}
