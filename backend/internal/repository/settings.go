package repository

import (
	"context"
	"log"
	"time"

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
	start := time.Now()
	defer func() {
		duration := time.Since(start)
		if duration > 20*time.Millisecond {
			log.Printf("[SLOW_QUERY] GetByKey took %v (key=%s)", duration, key)
		}
	}()

	ctxWithTimeout, cancel := context.WithTimeout(ctx, 1*time.Second)
	defer cancel()

	var settings domain.Settings
	// Uses the unique index on key field for fast lookups
	err := r.db.WithContext(ctxWithTimeout).Where("key = ?", key).First(&settings).Error
	if err != nil {
		return nil, err
	}
	return &settings, nil
}

func (r *settingsRepository) UpdateByKey(ctx context.Context, key, value string) error {
	start := time.Now()
	defer func() {
		duration := time.Since(start)
		if duration > 100*time.Millisecond {
			log.Printf("[SLOW_QUERY] UpdateByKey took %v (key=%s)", duration, key)
		}
	}()

	ctxWithTimeout, cancel := context.WithTimeout(ctx, 3*time.Second)
	defer cancel()

	// Update with current timestamp
	result := r.db.WithContext(ctxWithTimeout).Model(&domain.Settings{}).
		Where("key = ?", key).
		Updates(map[string]interface{}{
			"value":      value,
			"updated_at": time.Now(),
		})

	return result.Error
}

func (r *settingsRepository) GetAll(ctx context.Context) ([]domain.Settings, error) {
	start := time.Now()
	defer func() {
		duration := time.Since(start)
		if duration > 50*time.Millisecond {
			log.Printf("[SLOW_QUERY] GetAll settings took %v", duration)
		}
	}()

	ctxWithTimeout, cancel := context.WithTimeout(ctx, 2*time.Second)
	defer cancel()

	var settings []domain.Settings
	// Order by key for consistent results
	err := r.db.WithContext(ctxWithTimeout).Order("key ASC").Find(&settings).Error
	return settings, err
}
