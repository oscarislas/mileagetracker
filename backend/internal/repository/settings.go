package repository

import (
	"context"
	"time"

	"github.com/oscar/mileagetracker/internal/domain"
	"go.uber.org/zap"
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
	monitor := GetQueryPerformanceMonitor()
	defer monitor.MonitorQuery(OpGetByKey, "settings", zap.String("key", key))()

	ctxWithTimeout, cancel := WithTimeout(ctx, GetTimeoutForOperation(OpGetByKey))
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
	monitor := GetQueryPerformanceMonitor()
	defer monitor.MonitorQuery(OpUpdateByKey, "settings", zap.String("key", key))()

	ctxWithTimeout, cancel := WithTimeout(ctx, GetTimeoutForOperation(OpUpdateByKey))
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
	monitor := GetQueryPerformanceMonitor()
	defer monitor.MonitorQuery(OpGetAll, "settings")()

	ctxWithTimeout, cancel := WithTimeout(ctx, GetTimeoutForOperation(OpGetAll))
	defer cancel()

	var settings []domain.Settings
	// Order by key for consistent results
	err := r.db.WithContext(ctxWithTimeout).Order("key ASC").Find(&settings).Error
	return settings, err
}
