package repository

import (
	"context"

	"github.com/oscar/mileagetracker/internal/domain"
	"gorm.io/gorm"
)

type SettingsRepository interface {
	GetByKey(ctx context.Context, key string) (*domain.Settings, error)
	UpdateByKey(ctx context.Context, key, value string) error
	GetAll(ctx context.Context) ([]domain.Settings, error)
}

type settingsRepository struct {
	db *gorm.DB
}

func NewSettingsRepository(db *gorm.DB) SettingsRepository {
	return &settingsRepository{db: db}
}

func (r *settingsRepository) GetByKey(ctx context.Context, key string) (*domain.Settings, error) {
	var settings domain.Settings
	err := r.db.WithContext(ctx).Where("key = ?", key).First(&settings).Error
	if err != nil {
		return nil, err
	}
	return &settings, nil
}

func (r *settingsRepository) UpdateByKey(ctx context.Context, key, value string) error {
	return r.db.WithContext(ctx).Model(&domain.Settings{}).
		Where("key = ?", key).
		Update("value", value).Error
}

func (r *settingsRepository) GetAll(ctx context.Context) ([]domain.Settings, error) {
	var settings []domain.Settings
	err := r.db.WithContext(ctx).Find(&settings).Error
	return settings, err
}
