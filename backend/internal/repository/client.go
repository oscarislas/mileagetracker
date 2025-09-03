package repository

import (
	"context"

	"github.com/oscar/mileagetracker/internal/domain"
	"gorm.io/gorm"
)

type ClientRepository interface {
	Create(ctx context.Context, client *domain.Client) error
	FindByName(ctx context.Context, name string) (*domain.Client, error)
	GetSuggestions(ctx context.Context, query string, limit int) ([]domain.Client, error)
}

type clientRepository struct {
	db *gorm.DB
}

func NewClientRepository(db *gorm.DB) ClientRepository {
	return &clientRepository{db: db}
}

func (r *clientRepository) Create(ctx context.Context, client *domain.Client) error {
	return r.db.WithContext(ctx).Create(client).Error
}

func (r *clientRepository) FindByName(ctx context.Context, name string) (*domain.Client, error) {
	var client domain.Client
	err := r.db.WithContext(ctx).Where("name = ?", name).First(&client).Error
	if err != nil {
		return nil, err
	}
	return &client, nil
}

func (r *clientRepository) GetSuggestions(ctx context.Context, query string, limit int) ([]domain.Client, error) {
	var clients []domain.Client
	err := r.db.WithContext(ctx).Where("name ILIKE ?", "%"+query+"%").
		Order("name ASC").
		Limit(limit).
		Find(&clients).Error
	return clients, err
}
