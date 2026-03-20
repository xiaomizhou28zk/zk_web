package article

type Repository struct {
	ArticleStorage
}

func NewRepository(st ArticleStorage) *Repository {
	return &Repository{ArticleStorage: st}
}
