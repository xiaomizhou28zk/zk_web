package user

type Repository struct {
	UserStorage
}

func NewRepository(
	userStorage UserStorage,
) *Repository {
	return &Repository{
		UserStorage: userStorage,
	}
}
